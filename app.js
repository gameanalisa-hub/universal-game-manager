(() => {
"use strict";
const DB="ugm_pw_module",VERSION=1,STORE="state",$=id=>document.getElementById(id);
const blank=()=>({schemaVersion:1,gameId:"pixel-worlds",inventory:[],worlds:[],events:[]});
let state=blank(),scanCandidates=[];
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
$("addItemBtn").onclick=()=>showForm("itemForm");$("addWorldBtn").onclick=()=>showForm("worldForm");
$("itemForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget),quantity=Number(f.get("quantity"));if(!Number.isInteger(quantity)||quantity<0||quantity>999){notice("Jumlah Inventory harus 0–999 per stack.");return}state.inventory.push({id:id(),name:f.get("name").trim(),category:f.get("category"),quantity,notes:f.get("notes").trim()});hideForm("itemForm");await save()};
$("worldForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.worlds.push({id:id(),name:f.get("name").trim(),block:f.get("block").trim(),quantity:Number(f.get("quantity")),notes:f.get("notes").trim()});hideForm("worldForm");await save()};
$("eventForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);state.events.push({id:id(),name:f.get("name").trim(),target:f.get("target").trim(),current:Number(f.get("current")),goal:Number(f.get("goal"))});hideForm("eventForm");await save()};
function remove(kind,key){const entry=state[kind].find(x=>x.id===key);if(!entry||!confirm(`Hapus "${entry.name}"?`))return;state[kind]=state[kind].filter(x=>x.id!==key);save()}
function renderList(kind,container,detail){const root=$(container);if(!state[kind].length){root.innerHTML='<div class="empty">Belum ada data. Gunakan tombol tambah untuk memulai.</div>';return}root.innerHTML=state[kind].map(x=>`<article class="item"><div class="item-main"><b>${esc(x.name)}</b><small>${detail(x)}</small></div><div class="item-actions"><button class="btn danger" data-remove="${kind}" data-id="${esc(x.id)}" aria-label="Hapus ${esc(x.name)}">Hapus</button></div></article>`).join("")}
function render(){$("statItems").textContent=state.inventory.length;$("inventoryCount").textContent=state.inventory.length+" item";$("statWorlds").textContent=state.worlds.length;$("statEvents").textContent=state.events.length;$("eventCount").textContent=state.events.length+" event";renderList("inventory","inventoryList",x=>`${esc(x.category)} · ${x.quantity.toLocaleString("id-ID")} · ${esc(x.notes||"Tanpa catatan")}`);renderList("worlds","worldList",x=>`${esc(x.block||"Belum ada blok")} · ${x.quantity.toLocaleString("id-ID")} terpasang · ${esc(x.notes||"Tanpa catatan")}`);renderList("events","eventList",x=>{const pct=x.goal>0?Math.min(100,Math.round(x.current/x.goal*100)):0;return `<small>${esc(x.target||"Tanpa target")} · ${x.current}/${x.goal}</small><div class="progress"><span style="width:${pct}%"></span></div>`});const recent=[...state.inventory.slice(-2).map(x=>`Inventory: ${esc(x.name)}`),...state.worlds.slice(-2).map(x=>`World: ${esc(x.name)}`),...state.events.slice(-2).map(x=>`Event: ${esc(x.name)}`)];$("overviewRecent").innerHTML=recent.length?recent.map(x=>`<div class="small muted">${x}</div>`).join(""):'<div class="small muted">Belum ada data tersimpan.</div>'}
document.addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(b)remove(b.dataset.remove,b.dataset.id)});
$("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ugm-pixel-worlds-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notice("Backup berhasil dibuat. Simpan file di tempat aman.")};
$("importFile").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw 0;const parsed=JSON.parse(await file.text());if(!valid(parsed))throw 0;if(!confirm("Impor akan mengganti semua data Pixel Worlds di browser ini. Lanjutkan?"))return;state=parsed;await save();notice("Backup berhasil dipulihkan.")}catch{notice("File tidak valid atau gagal dibaca. Data lama tidak diubah.")}finally{e.target.value=""}};

// OCR: preprocess image at multiple scales/thresholds, then compare Tesseract PSM results.
function preprocess(file,mode){return new Promise((resolve,reject)=>{const img=new Image(),url=URL.createObjectURL(file);img.onload=()=>{try{const maxW=2400,scale=Math.min(3,Math.max(1.8,maxW/img.width));const c=document.createElement("canvas");c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);const ctx=c.getContext("2d",{willReadFrequently:true});ctx.drawImage(img,0,0,c.width,c.height);const im=ctx.getImageData(0,0,c.width,c.height),d=im.data;for(let i=0;i<d.length;i+=4){let g=(d[i]*.299+d[i+1]*.587+d[i+2]*.114);if(mode===1)g=g<145?0:255;else if(mode===2)g=Math.max(0,Math.min(255,(g-128)*1.65+128));d[i]=d[i+1]=d[i+2]=g;}ctx.putImageData(im,0,0);c.toBlob(b=>{URL.revokeObjectURL(url);b?resolve(b):reject(Error("Gagal memproses gambar"))},"image/png")}catch(e){URL.revokeObjectURL(url);reject(e)}};img.onerror=()=>{URL.revokeObjectURL(url);reject(Error("Gambar tidak dapat dibuka"))};img.src=url})}
function scoreText(s){const words=(s.match(/[A-Za-z]{2,}/g)||[]).length,digits=(s.match(/\d+/g)||[]).length,noise=(s.match(/[|{}\[\]~=^]/g)||[]).length;return words*2+digits*3-noise*1.5+s.length*.01}
function parseCandidates(text){const lines=text.split(/\n+/).map(x=>x.replace(/[|{}[\]~=_]+/g," ").replace(/\s+/g," ").trim()).filter(Boolean),out=[],seen=new Set();for(const line of lines){const m=line.match(/^(.{2,55}?)\s+([0-9][0-9,.]*)\s*$/);if(!m)continue;let name=m[1].replace(/^[^A-Za-z]+/,"").replace(/[^A-Za-z0-9 '&().-]/g,"").trim(),qty=Number(m[2].replace(/[,.](?=\d{3}\b)/g,"").replace(/[,.]/g,""));if(name.length<2||!Number.isFinite(qty)||qty<0)continue;const key=name.toLowerCase()+"|"+qty;if(seen.has(key))continue;seen.add(key);out.push({name,quantity:qty,category:/seed/i.test(name)?"Seeds":/hat|shirt|pants|wear/i.test(name)?"Wearables":/corn|turkey|thanksgiving/i.test(name)?"Event Items":"Blocks"})}return out.slice(0,100)}
function parseAiInventory(text){
 const out=[],seen=new Set(),lines=text.split(/\r?\n/);
 const clean=s=>String(s||"").replace(/^\*+|\*+$/g,"").replace(/^["'“”]+|["'“”]+$/g,"").trim();
 const add=(name,qty)=>{
  name=clean(name).replace(/^\*+|\*+$/g,"").trim();
  qty=String(qty||"").replace(/[,.](?=\d{3}\b)/g,"").replace(/[^0-9]/g,"");
  const n=Number(qty);
  if(!name||name.length<2||!Number.isInteger(n)||n<0||n>999)return;
  if(/^(slot|item|jumlah|quantity|name|nama|posisi|player|inventory|hotbar|baris|blocks?|seeds?)$/i.test(name))return;
  if(/^(feather|bulu)$/i.test(name))name="Feather";
  const key=name.toLowerCase()+"|"+n;
  if(seen.has(key))return;seen.add(key);
  const category=/seed|bibit/i.test(name)?"Seeds":/hat|shirt|pants|wear|wearable/i.test(name)?"Wearables":/coin|lock|currency|koin|world lock/i.test(name)?"Currency":/corn block/i.test(name)?"Blocks":/corn|turkey|thanksgiving/i.test(name)?"Event Items":"Blocks";
  out.push({name,quantity:n,category});
 };
 for(const raw of lines){
  let line=raw.trim();if(!line)continue;
  if(/^\|?\s*:?-{2,}/.test(line))continue;
  if(/^(player|posisi|yang paling penting|hotbar atas|inventory|baris [0-9]|slot\s+item)/i.test(line.replace(/^#+\s*/,"")))continue;
  if(line.includes("|")){
   const p=line.split("|").map(x=>clean(x)).filter(Boolean);
   if(p.length>=3){
    const first=p[0].replace(/[^0-9]/g,""),last=p[p.length-1].replace(/[^0-9]/g,"");
    if(first&&last){add(p.slice(1,-1).join(" ").replace(/^\*|\*$/g,""),last);continue}
   }
  }
  let m=line.match(/^\s*(?:[-*•]\s*)?(\d{1,2})[.)]?\s+(.+?)\s+(\d{1,3})\s*$/);
  if(m){add(m[2],m[3]);continue}
  m=line.match(/^\s*(?:[-*•]\s*)?(.{2,65}?)\s*[·—–]\s*(?:[A-Za-z &]+\s*[·—–]\s*)?(\d{1,3})\s*(?:·.*)?$/);
  if(m){add(m[1],m[2]);continue}
 }
 return out.slice(0,200);
}
function showCandidates(candidates){scanCandidates=candidates;$("scanRows").innerHTML=candidates.length?candidates.map((x,i)=>`<div class="scan-row"><input type="checkbox" data-sel="${i}" checked aria-label="Pilih ${esc(x.name)}"><input data-name="${i}" value="${esc(x.name)}" aria-label="Nama item"><input data-qty="${i}" type="number" min="0" max="999" step="1" value="${x.quantity}" aria-label="Jumlah"><select data-cat="${i}" aria-label="Kategori">${["Blocks","Seeds","Event Items","Wearables","Currency","Other"].map(c=>`<option ${c===x.category?"selected":""}>${c}</option>`).join("")}</select></div>`).join(""):'<div class="empty">Belum ada baris nama item + jumlah yang cocok. Periksa teks mentah; jangan simpan jika hasilnya keliru.</div>';$("scanResults").classList.remove("hidden")}
$("parseAiBtn").onclick=()=>{
 const text=$("aiInventoryText").value.trim();
 if(!text){$("scanStatus").textContent="Tempel hasil analisis AI terlebih dahulu.";return}
 const candidates=parseAiInventory(text);
 showCandidates(candidates);
 $("rawOcr").value=text;
 $("scanStatus").textContent=candidates.length?("Analisis teks selesai. Ditemukan "+candidates.length+" kandidat; periksa nama, kategori, dan jumlah sebelum menyimpan."):"Belum ditemukan baris item yang cocok. Gunakan format Slot | Nama Item | Jumlah atau periksa teks yang ditempel.";
};
$("clearAiBtn").onclick=()=>{$("aiInventoryText").value="";$("scanStatus").textContent="Teks analisis dibersihkan.";};
$("scanBtn").onclick=async()=>{const file=$("scanFile").files?.[0];if(!file){$("scanStatus").textContent="Pilih screenshot terlebih dahulu.";return}if(!window.Tesseract){$("scanStatus").textContent="Library OCR belum termuat. Periksa koneksi internet lalu muat ulang halaman.";return}const btn=$("scanBtn");btn.disabled=true;$("scanStatus").textContent="Memproses gambar dan mencoba beberapa pengaturan OCR…";$("scanResults").classList.add("hidden");try{const worker=await Tesseract.createWorker("eng",1,{logger:m=>{if(m.status==="recognizing text")$("scanStatus").textContent=`Membaca teks… ${Math.round((m.progress||0)*100)}%`}});let best="",bestScore=-Infinity;for(let mode=0;mode<3;mode++){const blob=await preprocess(file,mode);for(const psm of [6,11]){await worker.setParameters({tessedit_pageseg_mode:psm,preserve_interword_spaces:"1"});const r=await worker.recognize(blob);const t=r.data.text||"",s=scoreText(t);if(s>bestScore){best=t;bestScore=s}}}await worker.terminate();$("rawOcr").value=best;const candidates=parseCandidates(best);showCandidates(candidates);$("scanStatus").textContent=candidates.length?`OCR selesai. Ditemukan ${candidates.length} kandidat; periksa semuanya sebelum menyimpan.`:"OCR selesai, tetapi belum menemukan pasangan nama item dan jumlah yang cukup jelas. Tidak ada data Inventory yang diubah."}catch(e){$("scanStatus").textContent="OCR gagal: "+(e.message||"periksa koneksi internet dan coba lagi.")}finally{btn.disabled=false}};
$("cancelScanBtn").onclick=()=>{$("scanResults").classList.add("hidden");$("rawOcr").value="";$("scanRows").innerHTML="";scanCandidates=[];$("scanStatus").textContent="Hasil scan dibatalkan. Inventory tidak berubah."};
$("saveScanBtn").onclick=async()=>{let count=0,skipped=0;for(let i=0;i<scanCandidates.length;i++){if(!$(`scanRows`).querySelector(`[data-sel="${i}"]`)?.checked)continue;const name=$(`scanRows`).querySelector(`[data-name="${i}"]`).value.trim(),quantity=Number($(`scanRows`).querySelector(`[data-qty="${i}"]`).value),category=$(`scanRows`).querySelector(`[data-cat="${i}"]`).value;if(!name||!Number.isInteger(quantity)||quantity<0||quantity>999){skipped++;continue}const existing=state.inventory.find(x=>x.name.toLowerCase()===name.toLowerCase()&&x.category===category);if(existing)existing.quantity=quantity;else state.inventory.push({id:id(),name,category,quantity,notes:"Diimpor dari OCR; periksa hasil scan"});count++}if(count){await save();$("scanStatus").textContent=count+" item disimpan"+(skipped?"; "+skipped+" dilewati karena jumlah harus 0–999":"")+". Item dengan nama dan kategori sama diperbarui, bukan digandakan."}else $("scanStatus").textContent=skipped?skipped+" item dilewati. Jumlah Inventory harus 0–999 per stack.":"Tidak ada item yang dipilih atau datanya tidak valid.";$("scanResults").classList.add("hidden")};
if("serviceWorker"in navigator&&(location.protocol==="https:"||location.hostname==="localhost"))addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
load().catch(()=>notice("IndexedDB tidak tersedia di browser ini."));
})();