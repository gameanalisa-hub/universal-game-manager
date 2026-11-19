(() => {
"use strict";
const DB="ugm_pw_module",VERSION=1,STORE="state",$=id=>document.getElementById(id);
const blank=()=>({schemaVersion:1,gameId:"pixel-worlds",inventory:[],worlds:[],events:[]});
const blankSfl=()=>({schemaVersion:1,gameId:"sunflower-land",inventory:[],crops:[],goals:[]});
let state=blank(),sflState=blankSfl(),scanCandidates=[],autoEvents=[];
const notice=msg=>{$("notice").textContent=msg};
function dbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function load(){const db=await dbOpen();const values=await new Promise((res,rej)=>{const t=db.transaction(STORE,"readonly"),s=t.objectStore(STORE),a=s.get("data"),b=s.get("sunflower-land-data");t.oncomplete=()=>res([a.result||blank(),b.result||blankSfl()]);t.onerror=()=>rej(t.error)});db.close();state=valid(values[0])?values[0]:blank();sflState=validSfl(values[1])?values[1]:blankSfl();render();renderSfl();if(typeof renderAutoEvents==="function")renderAutoEvents()}
async function save(){const db=await dbOpen();await new Promise((res,rej)=>{const t=db.transaction(STORE,"readwrite");t.objectStore(STORE).put(state,"data");t.oncomplete=res;t.onerror=()=>rej(t.error)});db.close();render()}
function valid(x){return x&&x.schemaVersion===1&&x.gameId==="pixel-worlds"&&["inventory","worlds","events"].every(k=>Array.isArray(x[k])&&x[k].length<10000)}
function validSfl(x){return x&&x.schemaVersion===1&&x.gameId==="sunflower-land"&&["inventory","crops","goals"].every(k=>Array.isArray(x[k])&&x[k].length<10000)}
async function saveSfl(){const db=await dbOpen();await new Promise((res,rej)=>{const t=db.transaction(STORE,"readwrite");t.objectStore(STORE).put(sflState,"sunflower-land-data");t.oncomplete=res;t.onerror=()=>rej(t.error)});db.close();renderSfl()}
function showSflForm(id){$(id).classList.remove("hidden");$(id).querySelector("input")?.focus()}
function hideSflForm(id){$(id).reset();$(id).classList.add("hidden")}
function switchGame(game){
 const pixel=game==="pixel";
 $("pixelMain").classList.toggle("hidden",!pixel);$("sunflowerMain").classList.toggle("hidden",pixel);
 $("gamePixelBtn").classList.toggle("primary",pixel);$("gameSunflowerBtn").classList.toggle("primary",!pixel);
 document.querySelectorAll(".tab[data-tab]").forEach(x=>x.classList.toggle("active",pixel&&x.dataset.tab==="overview"));
 if(!pixel){document.querySelectorAll("[data-sfl-tab]").forEach(x=>x.classList.toggle("active",x.dataset.sflTab==="sflOverview"));document.querySelectorAll("#sunflowerMain .panel").forEach(x=>x.classList.toggle("active",x.id==="sflOverview"));renderSfl()}
}
$("gamePixelBtn").onclick=()=>switchGame("pixel");$("gameSunflowerBtn").onclick=()=>switchGame("sunflower");
document.querySelectorAll("[data-sfl-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-sfl-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll("#sunflowerMain .panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.sflTab))}));
document.querySelectorAll("[data-sfl-cancel]").forEach(b=>b.addEventListener("click",()=>hideSflForm(b.dataset.sflCancel)));
$("sflAddItemBtn").onclick=()=>showSflForm("sflItemForm");$("sflAddCropBtn").onclick=()=>showSflForm("sflCropForm");$("sflAddGoalBtn").onclick=()=>showSflForm("sflGoalForm");
$("sflItemForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);sflState.inventory.push({id:id(),name:f.get("name").trim(),category:f.get("category"),quantity:Number(f.get("quantity")),notes:f.get("notes").trim()});hideSflForm("sflItemForm");await saveSfl()};
$("sflCropForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);sflState.crops.push({id:id(),name:f.get("name").trim(),quantity:Number(f.get("quantity")),status:f.get("status"),harvestDate:f.get("harvestDate"),notes:f.get("notes").trim()});hideSflForm("sflCropForm");await saveSfl()};
$("sflGoalForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);sflState.goals.push({id:id(),name:f.get("name").trim(),current:Number(f.get("current")),goal:Number(f.get("goal")),notes:f.get("notes").trim()});hideSflForm("sflGoalForm");await saveSfl()};
function renderSflList(kind,container){const root=$(container),items=sflState[kind];if(!items.length){root.innerHTML='<div class="empty">Belum ada catatan. Gunakan tombol tambah untuk memulai.</div>';return}root.innerHTML=items.map(x=>{let detail="",badge=kind==="inventory"?(x.category||"Item"):kind==="crops"?(x.status||"Farm"):"Target",pct=0;if(kind==="inventory")detail="Jumlah: "+Number(x.quantity||0).toLocaleString("id-ID");if(kind==="crops")detail=Number(x.quantity||0)+" unit"+(x.harvestDate?" · Panen: "+x.harvestDate:"");if(kind==="goals"){pct=x.goal>0?Math.min(100,Math.round(x.current/x.goal*100)):0;detail=Number(x.current||0)+" / "+Number(x.goal||0)+" ("+pct+"%)"}return '<article class="item recurring-event data-card"><div class="item-main"><div class="recurring-heading"><b>'+esc(x.name)+'</b><span class="recurring-badge">'+esc(badge)+'</span></div><div class="recurring-next"><span>'+(kind==="goals"?"Progress target":"Catatan")+'</span><strong>'+esc(detail)+'</strong>'+(kind==="goals"?'<div class="progress"><span style="width:'+pct+'%"></span></div>':"")+'</div><p class="data-note">'+esc(x.notes||"Tanpa catatan")+'</p></div><div class="item-actions"><button class="btn danger" data-sfl-remove="'+kind+'" data-id="'+esc(x.id)+'">Hapus</button></div></article>'}).join("")}
function renderSfl(){ $("sflStatItems").textContent=sflState.inventory.length;$("sflStatCrops").textContent=sflState.crops.length;$("sflStatGoals").textContent=sflState.goals.length;renderSflList("inventory","sflInventoryList");renderSflList("crops","sflCropList");renderSflList("goals","sflGoalList");const recent=[...sflState.inventory.slice(-2).map(x=>({name:x.name,detail:(x.category||"Item")+" · "+x.quantity})),...sflState.crops.slice(-2).map(x=>({name:x.name,detail:x.status+" · "+x.quantity+" unit"})),...sflState.goals.slice(-2).map(x=>({name:x.name,detail:x.current+" / "+x.goal}))].slice(-6).reverse();$("sflRecent").innerHTML=recent.length?recent.map(x=>'<article class="item recurring-event overview-entry"><div class="item-main"><b>'+esc(x.name)+'</b><small>'+esc(x.detail)+'</small></div></article>').join(""):'<div class="empty">Belum ada data Sunflower Land.</div>'}
document.addEventListener("click",e=>{const b=e.target.closest("[data-sfl-remove]");if(!b)return;const kind=b.dataset.sflRemove,item=sflState[kind].find(x=>x.id===b.dataset.id);if(!item||!confirm('Hapus "'+item.name+'"?'))return;sflState[kind]=sflState[kind].filter(x=>x.id!==item.id);saveSfl()});
$("sflExportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(sflState,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download="ugm-sunflower-land-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$("sflNotice").textContent="Backup Sunflower Land berhasil dibuat."};
$("sflImportFile").onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{if(file.size>5*1024*1024)throw 0;const parsed=JSON.parse(await file.text());if(!validSfl(parsed))throw 0;if(!confirm("Impor akan mengganti data Sunflower Land saja. Lanjutkan?"))return;sflState=parsed;await saveSfl();$("sflNotice").textContent="Backup Sunflower Land dipulihkan."}catch{$("sflNotice").textContent="File tidak valid. Data lama tidak diubah."}finally{e.target.value=""}};
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
function renderList(kind,container,detail){
 const root=$(container);
 if(!state[kind].length){root.innerHTML='<div class="empty">Belum ada data. Gunakan tombol tambah untuk memulai.</div>';return}
 root.innerHTML=state[kind].map(x=>{
  const inventory=kind==="inventory";
  const badge=inventory?esc(x.category||"Item"):"World";
  const highlight=inventory
   ?'<div class="recurring-next"><span>Jumlah di Inventory</span><strong>'+Number(x.quantity||0).toLocaleString("id-ID")+'</strong><small>Maksimal 999 per stack</small></div>'
   :'<div class="recurring-next"><span>Blok / tanaman terpasang</span><strong>'+Number(x.quantity||0).toLocaleString("id-ID")+'</strong><small>'+esc(x.block||"Jenis blok belum ditentukan")+'</small></div>';
  const note=inventory?esc(x.notes||"Tanpa catatan"):esc(x.notes||"Tanpa catatan");
  return '<article class="item recurring-event data-card"><div class="item-main"><div class="recurring-heading"><b>'+esc(x.name)+'</b><span class="recurring-badge">'+badge+'</span></div>'+highlight+'<p class="data-note">'+note+'</p></div><div class="item-actions"><button class="btn danger" data-remove="'+kind+'" data-id="'+esc(x.id)+'" aria-label="Hapus '+esc(x.name)+'">Hapus</button></div></article>';
 }).join("");
}
function renderTrackedEvents(){
 const root=$("eventList");
 if(!state.events.length){root.innerHTML='<div class="empty">Belum ada data. Gunakan tombol tambah untuk memulai.</div>';return}
 root.innerHTML=state.events.map(x=>{
  const pct=x.goal>0?Math.min(100,Math.round(x.current/x.goal*100)):0;
  const progress=x.goal>0?x.current.toLocaleString("id-ID")+" / "+x.goal.toLocaleString("id-ID")+" ("+pct+"%)":"Progres belum ditentukan";
  return '<article class="item recurring-event event-card"><div class="item-main"><div class="recurring-heading"><b>'+esc(x.name)+'</b><span class="recurring-badge">Tracker pribadi</span></div><small>'+esc(x.target||"Target belum ditentukan")+'</small><div class="recurring-next"><span>Progres event</span><strong>'+progress+'</strong>'+(x.goal>0?'<div class="progress"><span style="width:'+pct+'%"></span></div>':'')+'</div>'+(x.sourceUrl?'<a href="'+esc(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Lihat sumber pengumuman</a>':'')+'</div><div class="item-actions"><button class="btn danger" data-remove="events" data-id="'+esc(x.id)+'" aria-label="Hapus '+esc(x.name)+'">Hapus</button></div></article>';
 }).join("");
}
function render(){
 $("statItems").textContent=state.inventory.length;
 $("inventoryCount").textContent=state.inventory.length+" item";
 $("statWorlds").textContent=state.worlds.length;
 $("statEvents").textContent=state.events.length;
 $("eventCount").textContent=state.events.length+" event";
 renderList("inventory","inventoryList");
 renderList("worlds","worldList");
 renderTrackedEvents();
 const recent=[
  ...state.inventory.slice(-2).map(x=>({type:"Inventory",name:x.name,detail:(x.category||"Item")+" · "+Number(x.quantity||0).toLocaleString("id-ID")})),
  ...state.worlds.slice(-2).map(x=>({type:"World",name:x.name,detail:(x.block||"Blok belum ditentukan")+" · "+Number(x.quantity||0).toLocaleString("id-ID")+" terpasang"})),
  ...state.events.slice(-2).map(x=>({type:"Event",name:x.name,detail:x.target||"Target belum ditentukan"}))
 ].slice(-6).reverse();
 $("overviewRecent").innerHTML=recent.length?recent.map(x=>'<article class="item recurring-event overview-entry"><div class="item-main"><div class="recurring-heading"><b>'+esc(x.name)+'</b><span class="recurring-badge">'+x.type+'</span></div><small>'+esc(x.detail)+'</small></div></article>').join(""):'<div class="empty">Belum ada data tersimpan. Tambahkan item, world, atau event untuk mulai mengisi ringkasan.</div>';
}
function formatEventDate(value){
 const [year,month,day]=value.split("-").map(Number);
 return new Date(year,month-1,day,12).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
}
function getRecurringDates(item){
 const [sy,sm,sd]=item.startDate.split("-").map(Number);
 const startDate=new Date(sy,sm-1,sd,12);
 const today=new Date();today.setHours(0,0,0,0);
 const dates=[];
 for(let offset=0;offset<18;offset++){
  const monthStart=new Date(sy,sm-1+offset,1,12);
  const firstDay=monthStart.getDay();
  const targetDay=Number(item.recurrence?.weekdayNumber??4);
  const day=1+((targetDay-firstDay+7)%7);
  const date=new Date(monthStart.getFullYear(),monthStart.getMonth(),day,12);
  if(date>=startDate&&date>=today)dates.push(date);
  if(dates.length>=5)break;
 }
 return dates;
}
function renderAutoEvents(){
 const root=$("autoEventList");
 $("autoEventCount").textContent=autoEvents.length+" ditemukan";
 if(!autoEvents.length){root.innerHTML='<div class="empty">Belum ada pengumuman event yang terdeteksi. Data akan diperiksa berkala oleh sinkronisasi otomatis.</div>';return}
 root.innerHTML=autoEvents.map(x=>{
  const added=state.events.some(e=>e.name.toLowerCase()===String(x.title||"").toLowerCase());
  const recurring=x.recurrence?.frequency==="monthly";
  let badge="Event terjadwal",dateLabel="Jadwal event",dateValue="";
  let extra="";
  if(recurring){
   badge="Rutin bulanan";
   const dates=getRecurringDates(x),next=dates[0],upcoming=dates.slice(1,4);
   dateLabel="Jadwal berikutnya";
   dateValue=next?next.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}):"Jadwal berikutnya belum tersedia";
   extra=upcoming.length?'<details class="recurring-more"><summary>Lihat jadwal berikutnya</summary><ul>'+upcoming.map(d=>'<li>'+d.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"})+'</li>').join("")+'</ul></details>':'';
  }else if(x.startDate){
   badge="Jadwal resmi";
   dateValue=formatEventDate(x.startDate)+(x.endDate?" – "+formatEventDate(x.endDate):"");
  }else if(x.dateStatus==="unannounced"){
   badge="Menunggu pengumuman";
   dateValue="Belum ada tanggal resmi";
  }else{
   badge="Pengumuman event";
   dateValue=x.publishedAt&&Number.isFinite(Date.parse(x.publishedAt))?"Diumumkan "+new Date(x.publishedAt).toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}):"Tanggal tidak tersedia";
  }
  const schedule=recurring?"Setiap Kamis pertama setiap bulan":esc(x.category||"Event");
  return '<article class="item recurring-event event-card"><div class="item-main"><div class="recurring-heading"><b>'+esc(x.title)+'</b><span class="recurring-badge">'+badge+'</span></div><small>'+schedule+'</small><div class="recurring-next"><span>'+dateLabel+'</span><strong>'+dateValue+'</strong></div><p>'+esc(x.summary||"")+'</p>'+extra+'<a href="'+esc(x.url||"https://steamcommunity.com/app/636040/allnews/")+'" target="_blank" rel="noopener noreferrer">Lihat pengumuman Steam</a></div><div class="item-actions">'+(added?'<span class="small muted">Sudah ditambahkan</span>':'<button class="btn primary" data-add-auto="'+esc(x.id)+'">Tambahkan</button>')+'</div></article>';
 }).join("");
}
async function loadAutoEvents(){
 const status=$("autoEventStatus");
 status.textContent="Memuat pengumuman…";
 try{
  const response=await fetch("./events-feed.json?ts="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const feed=await response.json();
  if(feed.game!=="pixel-worlds"||!Array.isArray(feed.items))throw new Error("Format feed tidak valid");
  autoEvents=feed.items.filter(x=>x&&typeof x.title==="string"&&typeof x.id==="string").slice(0,30);
  const updated=feed.generatedAt&&Number.isFinite(Date.parse(feed.generatedAt))?new Date(feed.generatedAt).toLocaleString("id-ID"):"belum pernah";
  status.textContent="Sumber Steam · diperbarui: "+updated;
  renderAutoEvents();
 }catch(error){
  status.textContent="Belum dapat memuat feed otomatis ("+error.message+"). Coba lagi nanti.";
  $("autoEventList").innerHTML='<div class="empty">Data pengumuman belum tersedia. Sinkronisasi otomatis akan mengisi bagian ini.</div>';
 }
}
$("refreshAutoEvents").onclick=loadAutoEvents;
$("autoEventList").addEventListener("click",async e=>{
 const button=e.target.closest("[data-add-auto]");
 if(!button)return;
 const item=autoEvents.find(x=>x.id===button.dataset.addAuto);
 if(!item)return;
 if(state.events.some(x=>x.name.toLowerCase()===item.title.toLowerCase())){renderAutoEvents();return}
 state.events.push({id:id(),name:item.title,target:"Pengumuman Steam · "+(item.category||"Event"),current:0,goal:0,sourceUrl:item.url||""});
 await save();
 renderAutoEvents();
 $("autoEventStatus").textContent="Event ditambahkan ke Daftar Event.";
});
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
loadAutoEvents();
})();