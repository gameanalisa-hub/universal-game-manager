(() => {
"use strict";
const DB="ugm_pw_module", VERSION=1, STORE="state";
const $=id=>document.getElementById(id);
const blank=()=>({schemaVersion:1,gameId:"pixel-worlds",inventory:[],worlds:[],events:[]});
let state=blank();
const notice=msg=>{$("notice").textContent=msg};
function dbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function load(){const db=await dbOpen();state=await new Promise((res,rej)=>{const t=db.transaction(STORE,"readonly"),r=t.objectStore(STORE).get("data");r.onsuccess=()=>res(r.result||blank());r.onerror=()=>rej(r.error)});db.close();if(!valid(state))state=blank();render()}
async function save(){const db=await dbOpen();await new Promise((res,rej)=>{const t=db.transaction(STORE,"readwrite");t.objectStore(STORE).put(state,"data");t.oncomplete=res;t.onerror=()=>rej(t.error)});db.close();render()}
function valid(x){return x&&x.schemaVersion===1&&x.gameId==="pixel-worlds"&&["inventory","worlds","events"].every(k=>Array.isArray(x[k])&&x[k].length<10000)}
function id(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showForm(id){$(id).classList.remove("hidden");$(id).querySelector("input")?.focus()}
function hideForm(id){$(id).reset();$(id).classList.add("hidden")}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".tab").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll(".panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab))}));
document.querySelectorAll("[data-cancel]").forEach(b=>b.addEventListener("click",()=>hideForm(b.dataset.cancel)));
$("addItemBtn").onclick=()=>showForm("itemForm");$("addWorldBtn").onclick=()=>showForm("worldForm");$("addEventBtn").onclick=()=>showForm("eventForm");
$("itemForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.inventory.push({id:id(),name:f.get("name").trim(),category:f.get("category"),quantity:Number(f.get("quantity")),notes:f.get("notes").trim()});hideForm("itemForm");await save()};
$("worldForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.worlds.push({id:id(),name:f.get("name").trim(),block:f.get("block").trim(),quantity:Number(f.get("quantity")),notes:f.get("notes").trim()});hideForm("worldForm");await save()};
$("eventForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.events.push({id:id(),name:f.get("name").trim(),target:f.get("target").trim(),current:Number(f.get("current")),goal:Number(f.get("goal"))});hideForm("eventForm");await save()};
function remove(kind,key){const entry=state[kind].find(x=>x.id===key);if(!entry||!confirm(`Hapus "${entry.name}"?`))return;state[kind]=state[kind].filter(x=>x.id!==key);save()}
function renderList(kind,container,detail){const root=$(container);if(!state[kind].length){root.innerHTML='<div class="empty">Belum ada data. Gunakan tombol tambah untuk memulai.</div>';return}root.innerHTML=state[kind].map(x=>`<article class="item"><div class="item-main"><b>${esc(x.name)}</b><small>${detail(x)}</small></div><div class="item-actions"><button class="btn danger" data-remove="${kind}" data-id="${esc(x.id)}" aria-label="Hapus ${esc(x.name)}">Hapus</button></div></article>`).join("")}
function render(){
$("statItems").textContent=state.inventory.length;$("statWorlds").textContent=state.worlds.length;$("statEvents").textContent=state.events.length;
renderList("inventory","inventoryList",x=>`${esc(x.category)} · ${x.quantity.toLocaleString("id-ID")} · ${esc(x.notes||"Tanpa catatan")}`);
renderList("worlds","worldList",x=>`${esc(x.block||"Belum ada blok")} · ${x.quantity.toLocaleString("id-ID")} terpasang · ${esc(x.notes||"Tanpa catatan")}`);
renderList("events","eventList",x=>{const pct=x.goal>0?Math.min(100,Math.round(x.current/x.goal*100)):0;return `${esc(x.target||"Tanpa target")} · ${x.current}/${x.goal} <div class="progress"><span style="width:${pct}%"></span></div>`});
const recent=[...state.inventory.slice(-2).map(x=>`Inventory: ${esc(x.name)}`),...state.worlds.slice(-2).map(x=>`World: ${esc(x.name)}`),...state.events.slice(-2).map(x=>`Event: ${esc(x.name)}`)];
$("overviewRecent").innerHTML=recent.length?recent.map(x=>`<div class="small muted">${x}</div>`).join(""):'<div class="small muted">Belum ada data tersimpan.</div>';
}
document.addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(b)remove(b.dataset.remove,b.dataset.id)});
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ugm-pixel-worlds-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice("Backup berhasil dibuat. Simpan file di tempat aman.")};
$("importFile").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw 0;const parsed=JSON.parse(await file.text());if(!valid(parsed))throw 0;if(!confirm("Impor akan mengganti semua data Pixel Worlds di browser ini. Lanjutkan?"))return;state=parsed;await save();notice("Backup berhasil dipulihkan.")}catch{notice("File tidak valid atau gagal dibaca. Data lama tidak diubah.")}finally{e.target.value=""}};
if("serviceWorker"in navigator&&(location.protocol==="https:"||location.hostname==="localhost"))addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
load().catch(()=>notice("IndexedDB tidak tersedia di browser ini."));
})();