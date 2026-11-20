const API = "https://sfl.world/api/v1/prices";
const response = await fetch(API, {
  headers: { "User-Agent": "UniversalGameManager/1.0 (public market snapshot)" },
  signal: AbortSignal.timeout(20000)
});
if (!response.ok) throw new Error(`SFL.world price feed returned HTTP ${response.status}`);
const payload = await response.json();
const prices = payload?.data?.p2p;
if (!prices || typeof prices !== "object" || Array.isArray(prices)) {
  throw new Error("SFL.world response did not contain data.p2p");
}
const cleanPrices = Object.fromEntries(
  Object.entries(prices)
    .filter(([item, value]) => typeof item === "string" && item.trim() && Number.isFinite(Number(value)) && Number(value) >= 0)
    .map(([item, value]) => [item, Number(value)])
);
if (!Object.keys(cleanPrices).length) throw new Error("No valid P2P prices were returned");

const now = new Date();
const date = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Jakarta", year: "numeric", month: "2-digit", day: "2-digit"
}).format(now);
const sourceUpdatedAt = Number.isFinite(Number(payload.updatedAt))
  ? new Date(Number(payload.updatedAt)).toISOString()
  : (typeof payload.updated_text === "string" ? payload.updated_text : null);
const snapshot = {
  date,
  observedAt: now.toISOString(),
  sourceUpdatedAt,
  prices: cleanPrices
};

const fs = await import("node:fs/promises");
let history = [];
try {
  const previous = JSON.parse(await fs.readFile("market-feed.json", "utf8"));
  if (previous.type === "sfl-market-feed" && Array.isArray(previous.history)) {
    history = previous.history.filter(x => x && typeof x.date === "string" && x.prices && typeof x.prices === "object");
  }
} catch {}
history.push(snapshot);
history.sort((a, b) => Date.parse(a.observedAt) - Date.parse(b.observedAt));
history = history.slice(-360);

const feed = {
  type: "sfl-market-feed",
  schemaVersion: 1,
  source: "SFL.world public P2P price feed",
  sourceUrl: API,
  currency: "FLOWER",
  generatedAt: now.toISOString(),
  latestDate: date,
  itemCount: Object.keys(cleanPrices).length,
  history
};
await fs.writeFile("market-feed.json", JSON.stringify(feed, null, 2) + "\n");
console.log(`Saved ${Object.keys(cleanPrices).length} P2P item prices; ${history.length} snapshots retained (up to 30 days at 2-hour intervals).`);
