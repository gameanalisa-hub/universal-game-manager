(() => {
"use strict";
const DB="ugm_pw_module", STORE="state", KEY="pixel-worlds-market-data", MAX=200;
const $=id=>document.getElementById(id);
let snapshots=[];
let activePeriod=24;
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=n=>Number(n).toLocaleString("id-ID",{maximumFractionDigits:6});
const dbOpen=()=>new Promise((resolve,reject)=>{
 const req=indexedDB.open(DB,1);
 req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
});
async function readStore(){
 const db=await dbOpen();
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readonly"),req=tx.objectStore(STORE).get(KEY);req.onsuccess=()=>resolve(req.result||{schemaVersion:1,history:[]});req.onerror=()=>reject(req.error)})}
 finally{db.close()}
}
async function writeStore(){
 const db=await dbOpen();
 try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite");tx.objectStore(STORE).put({schemaVersion:1,history:snapshots},KEY);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)})}
 finally{db.close()}
}
function parseCsv(raw){
 const lines=raw.trim().split(/\r?\n/).filter(Boolean);
 if(lines.length<2)throw Error("CSV harus berisi header item,price dan minimal satu baris harga.");
 const start=/^\s*item\s*[,;\t]\s*price\s*$/i.test(lines[0])?1:0;
 return lines.slice(start).map((line,i)=>{
  const cols=line.split(/[,;\t]/);if(cols.length<2)throw Error("Baris CSV "+(i+1+start)+" tidak memiliki dua kolom.");
  return {item:cols[0].trim(),price:Number(cols[1].trim())};
 });
}
function normalize(raw){
 let data;
 try{data=JSON.parse(raw)}catch{data=null}
 let observedAt=new Date().toISOString(), rows=[];
 if(data){
  if(Array.isArray(data))rows=data;
  else{
   if(data.observedAt){const d=new Date(data.observedAt);if(!Number.isFinite(d.getTime()))throw Error("observedAt bukan tanggal yang valid.");observedAt=d.toISOString()}
   const prices=data.prices??data.items??data.marketPrices;
   if(Array.isArray(prices))rows=prices.map(x=>({item:x.item??x.name,price:x.price??x.p2pPrice??x.value}));
   else if(prices&&typeof prices==="object")rows=Object.entries(prices).map(([item,price])=>({item,price}));
   else throw Error("JSON harus memiliki objek prices atau array item.");
  }
 }else rows=parseCsv(raw);
 const map=new Map();
 for(const row of rows){
  const item=String(row.item??row.name??"").trim();
  const price=Number(row.price??row.p2pPrice??row.value);
  if(!item||item.length>100)continue;
  if(!Number.isFinite(price)||price<=0)continue;
  map.set(item.toLowerCase(),{item,price});
 }
 const entries=[...map.values()];
 if(!entries.length)throw Error("Tidak ada harga valid. Setiap baris harus memiliki nama item dan harga BC lebih dari 0.");
 return {id:"manual-"+Date.now()+"-"+Math.random().toString(36).slice(2,8),observedAt,source:"manual-user-input",sourceLabel:"Input manual PWE",entries};
}
function comparisons(){
 const sorted=[...snapshots].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
 const latest=sorted[sorted.length-1], previousByItem=new Map();
 for(let i=sorted.length-2;i>=0;i--){
  for(const entry of sorted[i].entries||[])if(!previousByItem.has(entry.item.toLowerCase()))previousByItem.set(entry.item.toLowerCase(),entry.price);
 }
 return (latest?.entries||[]).map(entry=>{
  const before=previousByItem.get(entry.item.toLowerCase());
  const change=before==null?null:(entry.price-before)/before*100;
  return {...entry,before,change,trend:change==null?"unknown":change>0?"up":change<0?"down":"stable"};
 });
}
function periodAnalysis(hours){
 const sorted=[...snapshots].sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
 if(sorted.length<2)return {rows:[],latest:null,baseline:null,reason:"Butuh minimal dua snapshot."};
 const latest=sorted[sorted.length-1], cutoff=Date.parse(latest.observedAt)-hours*3600000;
 const baseline=[...sorted].reverse().find(s=>Date.parse(s.observedAt)<=cutoff);
 if(!baseline)return {rows:[],latest,baseline:null,reason:"Belum ada snapshot yang cukup lama untuk pembanding periode ini."};
 const baseMap=new Map((baseline.entries||[]).map(x=>[x.item.toLowerCase(),x.price]));
 const rows=(latest.entries||[]).flatMap(entry=>{
  const before=baseMap.get(entry.item.toLowerCase());
  return before>0?[{item:entry.item,price:entry.price,before,change:(entry.price-before)/before*100}]:[];
 }).sort((a,b)=>Math.abs(b.change)-Math.abs(a.change));
 return {rows,latest,baseline,reason:rows.length?"":"Tidak ada item yang sama pada kedua snapshot."};
}
function render(){
 const all=comparisons(),rising=all.filter(x=>x.trend==="up").sort((a,b)=>b.change-a.change),falling=all.filter(x=>x.trend==="down").sort((a,b)=>a.change-b.change);
 const card=x=>'<article class="item"><div class="item-main"><b>'+esc(x.item)+'</b><div class="pw-market-meta">Sebelumnya: '+fmt(x.before)+' BC · Sekarang: '+fmt(x.price)+' BC</div></div><div class="item-actions"><strong class="'+(x.change>=0?"pw-trend-up":"pw-trend-down")+'">'+(x.change>0?"+":"")+x.change.toFixed(2)+'%</strong></div></article>';
 $("pwRisingList").innerHTML=rising.length?rising.map(card).join(""):'<div class="empty">Belum ada data harga naik.</div>';
 $("pwFallingList").innerHTML=falling.length?falling.map(card).join(""):'<div class="empty">Belum ada data harga turun.</div>';
 $("pwMarketSnapshotCount").textContent=snapshots.length+" snapshot";
 const history=[...snapshots].sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
 $("pwMarketHistory").innerHTML=history.length?history.map(s=>'<article class="item"><div class="item-main"><b>'+new Date(s.observedAt).toLocaleString("id-ID")+'</b><div class="pw-market-meta">'+s.entries.length+' item · '+esc(s.sourceLabel||"Input manual")+'</div></div><div class="item-actions"><button class="btn danger" type="button" data-pw-market-delete="'+esc(s.id)+'">Hapus</button></div></article>').join(""):'<div class="empty">Riwayat masih kosong.</div>';
 const latest=history[0];
 $("pwMarketStatus").textContent=latest?"Snapshot terakhir: "+new Date(latest.observedAt).toLocaleString("id-ID")+" · "+latest.entries.length+" item. Tren dibandingkan dengan snapshot sebelumnya yang memiliki item sama.":"Belum ada snapshot harga PWE.";
 const analysis=periodAnalysis(activePeriod),label=activePeriod===24?"24 jam":activePeriod===168?"7 hari":"30 hari";
 document.querySelectorAll("[data-pw-period]").forEach(b=>b.classList.toggle("active",Number(b.dataset.pwPeriod)===activePeriod));
 $("pwAnalyticsCaption").textContent=analysis.baseline?"Perbandingan "+label+": "+new Date(analysis.baseline.observedAt).toLocaleString("id-ID")+" → "+new Date(analysis.latest.observedAt).toLocaleString("id-ID")+".":analysis.reason+" Impor snapshot berkala untuk membuka analisis "+label+".";
 const movers=analysis.rows;
 $("pwAnalyticsList").innerHTML=movers.length?movers.map(x=>'<article class="item"><div class="item-main"><b>'+esc(x.item)+'</b><div class="pw-market-meta">'+fmt(x.before)+' → '+fmt(x.price)+' BC</div></div><div class="item-actions"><strong class="'+(x.change>=0?"pw-trend-up":"pw-trend-down")+'">'+(x.change>0?"+":"")+x.change.toFixed(2)+'%</strong></div></article>').join(""):'<div class="empty">Belum ada perbandingan yang valid untuk periode ini.</div>';
 const sharp=movers.filter(x=>Math.abs(x.change)>=20);
 $("pwAnomalyList").innerHTML=sharp.length?sharp.map(x=>'<article class="item"><div class="item-main"><b>'+esc(x.item)+'</b><div class="pw-market-meta">Perubahan tajam pada periode terpilih</div></div><div class="item-actions"><strong class="'+(x.change>=0?"pw-trend-up":"pw-trend-down")+'">'+(x.change>0?"+":"")+x.change.toFixed(2)+'%</strong></div></article>').join(""):'<div class="empty">Tidak ada perubahan ≥20% yang terdeteksi pada periode ini.</div>';
 $("pwAnomalyNote").textContent=sharp.length?"Sinyal perubahan tajam, bukan bukti manipulasi harga. Periksa volume, jumlah penawaran, dan sumber harga sebelum mengambil keputusan.":"Ambang sinyal: perubahan absolut minimal 20% dibanding snapshot pembanding.";
}
document.querySelectorAll("[data-pw-period]").forEach(button=>button.addEventListener("click",()=>{activePeriod=Number(button.dataset.pwPeriod);render()}));

$("pwMarketImportBtn").addEventListener("click",async()=>{
 const raw=$("pwMarketImportText").value.trim();if(!raw){$("pwMarketStatus").textContent="Tempel JSON atau CSV terlebih dahulu.";return}
 try{
  const snapshot=normalize(raw);
  if(snapshots.some(x=>x.id===snapshot.id))throw Error("Snapshot duplikat.");
  snapshots.push(snapshot);snapshots.sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));snapshots=snapshots.slice(-MAX);
  await writeStore();$("pwMarketImportText").value="";render();
  $("pwMarketStatus").textContent="Berhasil mengimpor "+snapshot.entries.length+" harga. Sumber: input manual pengguna, belum diverifikasi server PWE.";
 }catch(error){$("pwMarketStatus").textContent="Impor gagal: "+error.message}
});
$("pwMarketClearInputBtn").addEventListener("click",()=>{$("pwMarketImportText").value="";$("pwMarketStatus").textContent="Kolom impor dibersihkan."});
$("pwMarketExportBtn").addEventListener("click",()=>{
 const payload={type:"ugm-pwe-market-history",schemaVersion:1,exportedAt:new Date().toISOString(),currency:"BC",history:snapshots};
 const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
 a.href=url;a.download="ugm-pwe-market-history.json";a.click();URL.revokeObjectURL(url);
});
$("pwMarketHistory").addEventListener("click",async e=>{
 const button=e.target.closest("[data-pw-market-delete]");if(!button)return;
 const id=button.dataset.pwMarketDelete;if(!confirm("Hapus snapshot ini dari riwayat?"))return;
 snapshots=snapshots.filter(x=>x.id!==id);await writeStore();render();
});
async function init(){
 try{
  const saved=await readStore();
  snapshots=Array.isArray(saved.history)?saved.history.filter(s=>s&&typeof s.id==="string"&&Number.isFinite(Date.parse(s.observedAt))&&Array.isArray(s.entries)): [];
  $("pwAutoSourceStatus").textContent="Belum tersedia: belum ada API PWE publik yang terverifikasi. Tidak ada endpoint tebakan yang dipanggil.";
  render();
 }catch(error){$("pwMarketStatus").textContent="Penyimpanan market tidak tersedia: "+error.message}
}
init();
})();