const API = "https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=636040&count=40&maxlength=4000&format=json";
const response = await fetch(API, { headers: { "User-Agent": "UniversalGameManager/1.0" } });
if (!response.ok) throw new Error(`Steam news API returned HTTP ${response.status}`);
const payload = await response.json();
const items = payload?.appnews?.newsitems;
if (!Array.isArray(items)) throw new Error("Steam response did not contain newsitems");

const patterns = [
  ["Seasonal Event", /thanksgiving|halloween|christmas|easter|valentine|anniversary|lunar new year|st\. patrick|summer event/i],
  ["Tournament", /tournament|fishing cup|fishing tournament|competition/i],
  ["Limited-time Offer", /black friday|special offer|limited.?time|sale|discount/i],
  ["Event / Activity", /event|questline|grand prize|returns? to the shop|returns? .*event|secret base/i]
];
const stripHtml = value => String(value || "")
  .replace(/<br\s*\/?\s*>/gi, " ")
  .replace(/<\/(p|div|li|h[1-6])>/gi, " ")
  .replace(/<[^>]*>/g, " ")
  .replace(/&nbsp;/gi, " ")
  .replace(/&amp;/gi, "&")
  .replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'")
  .replace(/&lt;/gi, "<")
  .replace(/&gt;/gi, ">")
  .replace(/\s+/g, " ")
  .trim();
const cutoff = Date.now() / 1000 - 120 * 24 * 60 * 60;
const detected = items
  .filter(item => Number(item.date || 0) >= cutoff)
  .map(item => {
    const title = stripHtml(item.title);
    const body = stripHtml(item.contents);
    const matched = patterns.find(([, regex]) => regex.test(title + " " + body));
    if (!matched) return null;
    const summary = body.length > 420 ? body.slice(0, 417).trimEnd() + "…" : body;
    return {
      id: String(item.gid || item.url || title),
      title,
      category: matched[0],
      summary: summary || "Pengumuman resmi Pixel Worlds.",
      publishedAt: new Date(Number(item.date) * 1000).toISOString(),
      url: /^https:\/\/(steamcommunity\.com|store\.steampowered\.com)\//i.test(item.url || "") ? item.url : "https://steamcommunity.com/app/636040/allnews/",
      source: "Steam · Pixel Worlds"
    };
  })
  .filter(Boolean)
  .slice(0, 30);

const fs = await import("node:fs/promises");
let previousItems = [];
try {
  const previous = JSON.parse(await fs.readFile("events-feed.json", "utf8"));
  if (previous.game === "pixel-worlds" && Array.isArray(previous.items)) previousItems = previous.items;
} catch {}
const retained = previousItems.filter(item => item && (item.dateStatus === "unannounced" || item.dateStatus === "recurring-schedule-announced" || item.startDate || item.endDate));
const merged = [...detected, ...retained.filter(item => !detected.some(found => found.id === item.id) && !(item.id === "pw-thanksgiving-2026-watch" && detected.some(found => /thanksgiving/i.test(found.title + " " + found.summary))))].slice(0, 60);
const feed = {
  game: "pixel-worlds",
  source: "Steam Community Announcements",
  sourceUrl: "https://steamcommunity.com/app/636040/allnews/",
  generatedAt: new Date().toISOString(),
  items: merged
};
await fs.writeFile("events-feed.json", JSON.stringify(feed, null, 2) + "\n");
console.log(`Saved ${detected.length} event-related announcements.`);
