(() => {
"use strict";
const DB="ugm_pw_module",VERSION=1,STORE="state",$=id=>document.getElementById(id);
const blank=()=>({schemaVersion:1,gameId:"pixel-worlds",inventory:[],worlds:[],events:[]});
const blankSfl=()=>({schemaVersion:1,gameId:"sunflower-land",inventory:[],crops:[],goals:[],marketReports:[],activeSeason:null});
const SFL_SEASON_DATA={
 Spring:{crops:["Sunflower","Rhubarb","Carrot","Cabbage","Soybean","Corn","Wheat","Kale","Barley"],fruits:["Tomato","Blueberry","Orange"],greenhouse:["Grape","Rice","Olive"],flowers:["Sunpetal","Bloom","Lily","Lavender"]},
 Summer:{crops:["Sunflower","Potato","Zucchini","Pepper","Beetroot","Cauliflower","Eggplant","Radish","Wheat"],fruits:["Lemon","Orange","Banana"],greenhouse:["Grape","Rice","Olive"],flowers:["Sunpetal","Bloom","Lily","Gladiolus"]},
 Autumn:{crops:["Potato","Pumpkin","Carrot","Yam","Broccoli","Soybean","Wheat","Barley","Artichoke"],fruits:["Tomato","Apple","Banana"],greenhouse:["Grape","Rice","Olive"],flowers:["Sunpetal","Bloom","Lily","Clover"]},
 Winter:{crops:["Potato","Cabbage","Beetroot","Cauliflower","Parsnip","Onion","Turnip","Wheat","Kale"],fruits:["Lemon","Blueberry","Apple"],greenhouse:["Grape","Rice","Olive"],flowers:["Sunpetal","Bloom","Lily","Edelweiss"]}
};
const SFL_SEASONS=["Spring","Summer","Autumn","Winter"];
const SFL_HISTORICAL_BASELINE=4.632;

let state=blank(),sflState=blankSfl(),scanCandidates=[],autoEvents=[];
const notice=msg=>{$("notice").textContent=msg};
function dbOpen(){return new Promise((res,rej)=>{const r=indexedDB.open(DB,VERSION);r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains(STORE))r.result.createObjectStore(STORE)};r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)})}
async function load(){const db=await dbOpen();const values=await new Promise((res,rej)=>{const t=db.transaction(STORE,"readonly"),s=t.objectStore(STORE),a=s.get("data"),b=s.get("sunflower-land-data");t.oncomplete=()=>res([a.result||blank(),b.result||blankSfl()]);t.onerror=()=>rej(t.error)});db.close();state=valid(values[0])?values[0]:blank();sflState=validSfl(values[1])?values[1]:blankSfl();render();renderSfl();if(typeof renderAutoEvents==="function")renderAutoEvents()}
async function save(){const db=await dbOpen();await new Promise((res,rej)=>{const t=db.transaction(STORE,"readwrite");t.objectStore(STORE).put(state,"data");t.oncomplete=res;t.onerror=()=>rej(t.error)});db.close();render()}
function valid(x){return x&&x.schemaVersion===1&&x.gameId==="pixel-worlds"&&["inventory","worlds","events"].every(k=>Array.isArray(x[k])&&x[k].length<10000)}
function validSfl(x){return x&&x.schemaVersion===1&&x.gameId==="sunflower-land"&&["inventory","crops","goals"].every(k=>Array.isArray(x[k])&&x[k].length<10000)&&(x.marketReports===undefined||(Array.isArray(x.marketReports)&&x.marketReports.length<1000))}
async function saveSfl(){const db=await dbOpen();await new Promise((res,rej)=>{const t=db.transaction(STORE,"readwrite");t.objectStore(STORE).put(sflState,"sunflower-land-data");t.oncomplete=res;t.onerror=()=>rej(t.error)});db.close();renderSfl()}
function showSflForm(id){$(id).classList.remove("hidden");$(id).querySelector("input")?.focus()}
function hideSflForm(id){$(id).reset();$(id).classList.add("hidden")}
function switchGame(game){
 const pixel=game==="pixel";
 $("pixelMain").classList.toggle("hidden",!pixel);$("sunflowerMain").classList.toggle("hidden",pixel);
 $("gamePixelBtn").classList.toggle("primary",pixel);$("gameSunflowerBtn").classList.toggle("primary",!pixel);
 document.querySelectorAll(".tab[data-tab]").forEach(x=>x.classList.toggle("active",pixel&&x.dataset.tab==="market"));document.querySelectorAll("#pixelMain .panel").forEach(x=>x.classList.toggle("active",pixel&&x.id==="market"));
 if(!pixel){document.querySelectorAll("[data-sfl-tab]").forEach(x=>x.classList.toggle("active",x.dataset.sflTab==="sflDashboard"));document.querySelectorAll("#sunflowerMain .panel").forEach(x=>x.classList.toggle("active",x.id==="sflDashboard"));renderSfl()}
}
$("gamePixelBtn").onclick=()=>switchGame("pixel");$("gameSunflowerBtn").onclick=()=>switchGame("sunflower");
document.querySelectorAll("[data-sfl-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("[data-sfl-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll("#sunflowerMain .panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.sflTab))}));
document.querySelectorAll("[data-sfl-cancel]").forEach(b=>b.addEventListener("click",()=>hideSflForm(b.dataset.sflCancel)));
$("sflAddItemBtn").onclick=()=>showSflForm("sflItemForm");$("sflAddCropBtn").onclick=()=>showSflForm("sflCropForm");$("sflAddGoalBtn").onclick=()=>showSflForm("sflGoalForm");
$("sflSeasonSelect").onchange=async e=>{sflState.activeSeason=SFL_SEASONS.includes(e.target.value)?e.target.value:null;await saveSfl();};
$("sflAssignSeasonBtn").onclick=async()=>{const season=sflState.activeSeason;if(!SFL_SEASONS.includes(season)){$("sflMarketStatus").textContent="Pilih musim aktif terlebih dahulu.";return}const startedAt=new Date().toISOString();if(!confirm("Konfirmasi bahwa musim aktif sekarang adalah "+season+"? Snapshot yang diambil mulai saat konfirmasi ini akan otomatis ditandai sebagai musim "+season+". Snapshot sebelumnya tidak diubah."))return;sflState.activeSeasonStartedAt=startedAt;await saveSfl();$("sflMarketStatus").textContent="Musim "+season+" dikonfirmasi mulai "+new Date(startedAt).toLocaleString("id-ID")+". Snapshot berikutnya akan otomatis masuk ke riwayat musim ini.";};
$("sflItemForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);sflState.inventory.push({id:id(),name:f.get("name").trim(),category:f.get("category"),quantity:Number(f.get("quantity")),notes:f.get("notes").trim()});hideSflForm("sflItemForm");await saveSfl()};
$("sflCropForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);sflState.crops.push({id:id(),name:f.get("name").trim(),quantity:Number(f.get("quantity")),status:f.get("status"),harvestDate:f.get("harvestDate"),notes:f.get("notes").trim()});hideSflForm("sflCropForm");await saveSfl()};
$("sflGoalForm").onsubmit=async e=>{e.preventDefault();const f=new FormData(e.currentTarget);sflState.goals.push({id:id(),name:f.get("name").trim(),current:Number(f.get("current")),goal:Number(f.get("goal")),notes:f.get("notes").trim()});hideSflForm("sflGoalForm");await saveSfl()};
function renderSflList(kind,container){const root=$(container),items=sflState[kind];if(!items.length){root.innerHTML='<div class="empty">Belum ada catatan. Gunakan tombol tambah untuk memulai.</div>';return}root.innerHTML=items.map(x=>{let detail="",badge=kind==="inventory"?(x.category||"Item"):kind==="crops"?(x.status||"Farm"):"Target",pct=0;if(kind==="inventory")detail="Jumlah: "+Number(x.quantity||0).toLocaleString("id-ID");if(kind==="crops")detail=Number(x.quantity||0)+" unit"+(x.harvestDate?" · Panen: "+x.harvestDate:"");if(kind==="goals"){pct=x.goal>0?Math.min(100,Math.round(x.current/x.goal*100)):0;detail=Number(x.current||0)+" / "+Number(x.goal||0)+" ("+pct+"%)"}return '<article class="item recurring-event data-card"><div class="item-main"><div class="recurring-heading"><b>'+esc(x.name)+'</b><span class="recurring-badge">'+esc(badge)+'</span></div><div class="recurring-next"><span>'+(kind==="goals"?"Progress target":"Catatan")+'</span><strong>'+esc(detail)+'</strong>'+(kind==="goals"?'<div class="progress"><span style="width:'+pct+'%"></span></div>':"")+'</div><p class="data-note">'+esc(x.notes||"Tanpa catatan")+'</p></div><div class="item-actions"><button class="btn danger" data-sfl-remove="'+kind+'" data-id="'+esc(x.id)+'">Hapus</button></div></article>'}).join("")}

function validMarketReport(x){
 if(!x||x.type!=="sfl-market-report"||x.schemaVersion!==1||typeof x.observedAt!=="string"||!Number.isFinite(Date.parse(x.observedAt)))return false;
 const numeric=v=>v===null||v===undefined||(typeof v==="number"&&Number.isFinite(v)&&v>=0);
 return numeric(x.walletBalance)&&numeric(x.confirmedReceipts)&&numeric(x.target)&&Array.isArray(x.marketPrices||[])&&Array.isArray(x.transactions||[]);
}
function buildSflGoalHtml(reports){
 const rows=(reports||[]).slice().sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
 const fmt=v=>v==null?"—":Number(v).toLocaleString("id-ID",{maximumFractionDigits:8});
 const latest=rows[0]||null;
 const balanceReport=rows.filter(r=>r.walletBalance!=null).sort((a,b)=>Date.parse(b.walletBalanceUpdatedAt||b.balanceUpdatedAt||b.observedAt)-Date.parse(a.walletBalanceUpdatedAt||a.balanceUpdatedAt||a.observedAt))[0]||null;
 const transactionMap=new Map();
 for(const report of rows)for(const tx of report.transactions||[])if(tx&&typeof tx.id==="string"&&!transactionMap.has(tx.id))transactionMap.set(tx.id,tx);
 const transactions=[...transactionMap.values()];
 const estimated=SFL_HISTORICAL_BASELINE+transactions.reduce((sum,tx)=>sum+Number(tx.amount||0),0);
 const actual=!!balanceReport;
 const balance=actual?Number(balanceReport.walletBalance):(transactions.length?estimated:(latest?.confirmedReceipts??null));
 const target=Number((balanceReport||latest||{}).target||410);
 const updatedAt=actual?(balanceReport.walletBalanceUpdatedAt||balanceReport.balanceUpdatedAt||balanceReport.observedAt):null;
 const timeKnown=!!updatedAt&&String(updatedAt).includes("T");
 const age=updatedAt?Math.max(0,Date.now()-Date.parse(updatedAt)):null;
 const stale=actual&&age!=null&&age>(timeKnown?24:36)*3600000;
 const updatedLabel=updatedAt?(timeKnown?new Date(updatedAt).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"}):new Date(updatedAt).toLocaleDateString("id-ID",{dateStyle:"medium"})+" (jam tidak dicatat)"):"waktu pembaruan tidak tersedia";
 const delta=actual?Number((balance-estimated).toFixed(8)):null;
 const reconciliation=actual&&transactions.length&&Math.abs(delta)>=0.00005
  ?'<p class="data-note">Rekonsiliasi: saldo wallet '+fmt(balance)+' FLOWER; baseline + transaksi '+fmt(estimated)+' FLOWER. Selisih '+(delta>0?"+":"")+fmt(delta)+' FLOWER belum terjelaskan.</p>'
  :(actual?'<p class="data-note">Saldo wallet terkonfirmasi menjadi acuan target. Catatan transaksi ditampilkan terpisah.</p>':'<p class="data-note">Saldo belum terverifikasi. '+(transactions.length?'Estimasi berasal dari baseline historis 4.632 FLOWER ditambah transaksi tercatat.':'Belum ada saldo atau transaksi yang dapat dihitung.')+'</p>');
 const remaining=balance==null?null:Math.max(0,target-Number(balance));
 const pct=balance==null||!target?null:Math.min(100,Number(balance)/target*100);
 return '<section class="card recurring-event backup-card market-target sfl-goal-hero"><div class="sfl-goal-top"><div><span class="sfl-goal-kicker">TARGET UTAMA</span><h3>'+fmt(target)+' FLOWER</h3></div><span class="recurring-badge">'+(actual?(stale?"Saldo perlu diperbarui":"Wallet terkonfirmasi"):"Estimasi penerimaan")+'</span></div><div class="sfl-goal-number">'+fmt(balance)+' <span>/ '+fmt(target)+' FLOWER</span></div><div class="progress"><span style="width:'+(pct==null?0:pct)+'%"></span></div><div class="sfl-goal-foot"><strong>'+(pct==null?"Progres belum tersedia":pct.toFixed(2)+"% tercapai")+'</strong><span>'+(remaining==null?"Saldo belum diketahui":"Sisa "+fmt(remaining)+" FLOWER")+'</span></div><small class="sfl-goal-status">'+(actual?"Saldo wallet diperbarui: "+updatedLabel+(stale?" · PERLU KONFIRMASI ULANG":""):"Saldo wallet belum terverifikasi")+'</small></section>'+reconciliation;
}

function buildSflDashboardMarketHtml(){
 const reports=(sflState.marketReports||[]).filter(r=>!String(r.id||"").startsWith("sfl-transactions-")&&Array.isArray(r.marketPrices)&&r.marketPrices.length).slice().sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
 const snapshots=[];
 for(const report of reports){const key=report.observedAt||report.id;if(!snapshots.some(x=>(x.observedAt||x.id)===key))snapshots.push(report)}
 const latest=snapshots[snapshots.length-1],previous=snapshots[snapshots.length-2];
 const activeSeason=SFL_SEASONS.includes(sflState.activeSeason)?sflState.activeSeason:null;
 const seasonCrops=activeSeason?SFL_SEASON_DATA[activeSeason]:null;
 const allowed=new Set((seasonCrops?[...seasonCrops.crops,...seasonCrops.fruits,...seasonCrops.greenhouse,...seasonCrops.flowers]:SFL_SEASONS.flatMap(season=>{const d=SFL_SEASON_DATA[season];return [...d.crops,...d.fruits,...d.greenhouse,...d.flowers]})).map(x=>String(x).trim().toLowerCase()));
 const fmt=v=>Number(v).toLocaleString("id-ID",{maximumFractionDigits:8});
 const observed=latest?.observedAt?new Date(latest.observedAt).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"}):"";
 const empty='<p class="data-note">Belum tersedia dua snapshot harga. Feed otomatis perlu mengambil setidaknya dua snapshot untuk menghitung perubahan.</p>';
 if(!latest||!previous)return '<section class="card sfl-dashboard-market"><div class="recurring-heading"><h3>Harga tanaman hari ini</h3><span class="recurring-badge">Menunggu data</span></div>'+empty+'</section>';
 const oldPrices=new Map(previous.marketPrices.map(p=>[String(p.item||"").trim().toLowerCase(),Number(p.p2pPrice)]));
 const rows=latest.marketPrices.map(p=>{
  const key=String(p.item||"").trim().toLowerCase(),before=oldPrices.get(key),now=Number(p.p2pPrice);
  if(!p.item||!allowed.has(key)||!Number.isFinite(before)||before<=0||!Number.isFinite(now)||now<=0)return null;
  return {item:p.item,price:now,change:(now-before)/before*100};
 }).filter(Boolean);
 const renderTable=(items,type)=>items.length?'<div class="table-wrap"><table class="data-table"><thead><tr><th>Nama seed</th><th>Harga seed</th><th>Harga naik %</th><th>Harga turun %</th></tr></thead><tbody>'+items.map(p=>'<tr><td><b>'+esc(p.item)+'</b></td><td>'+fmt(p.price)+' FLOWER</td><td class="'+(type==="up"?'up':'')+'">'+(type==="up"?'+'+p.change.toFixed(2)+'%':'—')+'</td><td class="'+(type==="down"?'down':'')+'">'+(type==="down"?p.change.toFixed(2)+'%':'—')+'</td></tr>').join("")+'</tbody></table></div>':'<p class="data-note">Belum ada seed dengan perubahan harga '+(type==="up"?'naik':'turun')+' pada musim ini.</p>';
 const rising=rows.filter(p=>p.change>0).sort((a,b)=>b.change-a.change).slice(0,5);
 const falling=rows.filter(p=>p.change<0).sort((a,b)=>a.change-b.change).slice(0,5);
 return '<section class="card sfl-dashboard-market"><div class="recurring-heading"><h3>Harga tanaman hari ini</h3><span class="recurring-badge">'+(activeSeason?activeSeason:"Semua musim")+'</span></div><p class="data-note">Perubahan dibanding snapshot sebelumnya · '+esc(observed)+'</p>'+(activeSeason?'':'<p class="data-note">Pilih dan konfirmasi musim aktif di menu Market agar daftar hanya menampilkan seed sesuai musim.</p>')+'<h4>Top 5 harga naik</h4>'+renderTable(rising,"up")+'<h4>Top 5 harga turun</h4>'+renderTable(falling,"down")+'<p class="data-note">Harga seed dan persentase berasal dari feed market. Kenaikan harga bukan jaminan profit farming.</p><button class="btn" type="button" data-sfl-tab="sflMarket">Buka analisis market</button></section>';
}
function renderMarketReports(){
 const root=$("sflMarketList");if(!root)return;
 const reports=(sflState.marketReports||[]).slice().sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt));
 const targetHtml=buildSflGoalHtml(reports);
 if(!reports.length){root.innerHTML=targetHtml+'<div class="empty">Belum ada data harga. Feed SFL.world akan mengisi data saat tersedia.</div>';return}
 const fmt=v=>v==null?"—":Number(v).toLocaleString("id-ID",{maximumFractionDigits:8});
 const latest=reports[0],balanceReport=reports.filter(r=>r.walletBalance!=null).sort((a,b)=>Date.parse(b.walletBalanceUpdatedAt||b.balanceUpdatedAt||b.observedAt)-Date.parse(a.walletBalanceUpdatedAt||a.balanceUpdatedAt||a.observedAt))[0],priceReports=reports.filter(r=>!String(r.id||"").startsWith("sfl-transactions-")&&r.marketPrices&&r.marketPrices.some(p=>p.p2pPrice!=null)).sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt)),activeSeason=SFL_SEASONS.includes(sflState.activeSeason)?sflState.activeSeason:null,verifiedPrices=priceReports.filter(r=>r.seasonVerified===true&&SFL_SEASONS.includes(r.season)),latestPrice=priceReports[0]||{marketPrices:[],observedAt:null,season:activeSeason,seasonVerified:false};
 const seasonData=activeSeason?SFL_SEASON_DATA[activeSeason]:null;
 const seasonCrops=seasonData?[...seasonData.crops,...seasonData.fruits,...seasonData.greenhouse,...seasonData.flowers]:null;
 const allowedSeasonCrops=seasonCrops?new Set(seasonCrops.map(name=>String(name).trim().replace(/\\s+(seed|seeds)$/i,"").toLowerCase())):null;
 const seasonGuideHtml=seasonData?'<section class="card market-target"><div class="recurring-heading"><h3>Rencana panen · '+activeSeason+'</h3><span class="recurring-badge">Sesuai data game</span></div><p class="data-note">Tanam dan panen tanaman berikut selama musim ini. Greenhouse tersedia sepanjang tahun.</p><p class="data-note"><b>Tanaman:</b> '+seasonData.crops.map(esc).join(" · ")+'</p><p class="data-note"><b>Buah:</b> '+seasonData.fruits.map(esc).join(" · ")+'</p><p class="data-note"><b>Greenhouse:</b> '+seasonData.greenhouse.map(esc).join(" · ")+'</p><p class="data-note"><b>Bunga:</b> '+seasonData.flowers.map(esc).join(" · ")+'</p></section>':'<section class="card market-target"><h3>Rencana panen per musim</h3><p class="data-note">Pilih musim aktif pada pengaturan musim, lalu konfirmasi agar daftar panen dan analisis harga mengikuti musim tersebut.</p></section>';
 const seasonHistory=SFL_SEASONS.map(season=>({season,report:verifiedPrices.find(r=>r.season===season)}));
 const itemHistory=new Map();
 if(activeSeason&&latestPrice.seasonVerified===true&&latestPrice.season===activeSeason){
  for(const report of verifiedPrices.filter(r=>r.season===activeSeason).slice().sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt))){
   for(const p of report.marketPrices||[]){
    const price=Number(p.p2pPrice);if(p.p2pPrice==null||!Number.isFinite(price)||price<=0)continue;
    const key=String(p.item||"").trim().toLowerCase();if(!key)continue;
    if(!itemHistory.has(key))itemHistory.set(key,[]);
    itemHistory.get(key).push({price,observedAt:report.observedAt});
   }
  }
 }
 const sellableItems=new Set([...SFL_SEASONS.flatMap(season=>{const d=SFL_SEASON_DATA[season];return [...d.crops,...d.fruits,...d.greenhouse,...d.flowers]}),"Duskberry","Lunara","Celestine","Saltwort","Egg","Honey"]);
 const items=(latestPrice.marketPrices||[]).filter(p=>p.p2pPrice!=null&&Number(p.p2pPrice)>0).map(p=>{
  const history=(itemHistory.get(String(p.item||"").trim().toLowerCase())||[]).filter(x=>Date.parse(x.observedAt)<=Date.parse(latestPrice.observedAt)).slice(-4);
  const now=Number(p.p2pPrice),previous=history.length>=2?history[history.length-2].price:null,prior=history.length>=3?history[history.length-3].price:null;
  const change=previous!=null&&previous>0?((now-previous)/previous*100):null;
  const baseline=history.length>=3?history.slice(0,-1).reduce((sum,x)=>sum+x.price,0)/(history.length-1):null;
  const vsBaseline=baseline!=null&&baseline>0?(now-baseline)/baseline*100:null;
  const recentHigh=history.length>=4?Math.max(...history.slice(0,-1).map(x=>x.price)):history.length>=3?Math.max(...history.slice(0,-1).map(x=>x.price)):null;
  const consecutiveDrops=previous!=null&&prior!=null&&now<previous&&previous<prior;
  const itemKey=String(p.item||"").trim().toLowerCase(),inSeason=!allowedSeasonCrops||allowedSeasonCrops.has(itemKey);
  const trendPoints=history.map(x=>x.price);
  const trendPrevious=history.length>1?{p2pPrice:history[history.length-2].price}:null;
  const marketChange=trendPrevious&&Number(trendPrevious.p2pPrice)>0?(now-Number(trendPrevious.p2pPrice))/Number(trendPrevious.p2pPrice)*100:null;
  const sparkline=trendPoints.length>1?(()=>{const min=Math.min(...trendPoints),max=Math.max(...trendPoints),span=max-min||1;const pts=trendPoints.map((v,i)=>(6+i*108/(trendPoints.length-1)).toFixed(1)+","+(30-(v-min)/span*24).toFixed(1)).join(" ");return '<svg class="sfl-sparkline" viewBox="0 0 120 36" role="img" aria-label="Tren harga '+esc(p.item)+'"><polyline points="'+pts+'" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'})():'<span class="data-note">Tren belum tersedia</span>';
  let signal="unknown",trendLabel="Belum cukup data",reason=(latestPrice.seasonVerified===true&&latestPrice.season===activeSeason)?"Butuh minimal 3 snapshot valid dari musim yang sama.":"Harga dan tren pasar ditampilkan; rekomendasi jual menunggu snapshot musim aktif.";
  if(!sellableItems.has(String(p.item||""))){signal="watch";trendLabel="Pantau harga pasar";reason="Item tercatat di market, tetapi bukan komoditas tanaman utama untuk rekomendasi jual musim ini.";}
  else if(!inSeason){signal="watch";trendLabel="Di luar tanaman musim ini";reason="Harga tetap dipantau, tetapi item ini tidak masuk daftar tanaman musim aktif yang dipilih.";}
  else if(history.length>=3&&activeSeason&&latestPrice.seasonVerified===true&&latestPrice.season===activeSeason){
   const atLocalPeak=recentHigh!=null&&now>=recentHigh&&vsBaseline!=null&&vsBaseline>=1;
   const sharpDrop=change!=null&&change<=-2&&consecutiveDrops;
   const strongRise=change!=null&&change>=1.5;
   if(atLocalPeak){signal="sell";trendLabel="Jual bertahap · harga kuat";reason="Harga terbaru berada di atas rentang pembanding musim ini ("+(vsBaseline>0?"+":"")+vsBaseline.toFixed(2)+"% dari rata-rata sebelumnya).";}
   else if(sharpDrop){signal="sell";trendLabel="Pertimbangkan jual · momentum turun";reason="Harga turun "+Math.abs(change).toFixed(2)+"% dan sudah melemah dua snapshot berturut-turut.";}
   else if(strongRise){signal="hold";trendLabel="Tahan · harga menguat";reason="Harga naik "+change.toFixed(2)+"% dari snapshot sebelumnya; belum menyentuh puncak lokal.";}
   else if(change!=null&&change<=-1.5){signal="watch";trendLabel="Pantau · harga melemah";reason="Harga turun "+Math.abs(change).toFixed(2)+"%; tunggu konfirmasi snapshot berikutnya sebelum mengambil keputusan.";}
   else {signal="hold";trendLabel="Tahan · belum ada sinyal jual";reason="Perubahan terbaru relatif datar; belum ada sinyal harga kuat atau penurunan beruntun.";}
  }
  return {...p,signal,trendLabel,reason,change,vsBaseline,historyCount:history.length,marketChange,inSeason};
 });
 const rank={sell:0,watch:1,hold:2,unknown:3};
 const recommendations=items.filter(p=>sellableItems.has(String(p.item||""))&&p.inSeason).sort((a,b)=>rank[a.signal]-rank[b.signal]||a.item.localeCompare(b.item)).slice(0,5);
 const rising=items.filter(p=>p.inSeason&&p.marketChange>0).sort((a,b)=>b.marketChange-a.marketChange).slice(0,5);
 const falling=items.filter(p=>p.inSeason&&p.marketChange<0).sort((a,b)=>a.marketChange-b.marketChange).slice(0,5);
 const moverHtml=list=>list.length?list.map(p=>'<article class="item recurring-event data-card market-price"><div class="item-main"><div class="recurring-heading"><b>'+esc(p.item)+'</b><span class="recurring-badge">'+(p.marketChange>0?"+":"")+p.marketChange.toFixed(2)+'%</span></div><div class="market-price-grid"><span>Harga P2P<strong>'+fmt(p.p2pPrice)+' FLOWER</strong></span></div></div></article>').join(""):'<div class="empty">Belum ada perbandingan snapshot.</div>';
 const sellCount=items.filter(p=>p.signal==="sell").length;
 const recommendationHtml=recommendations.length?recommendations.map(p=>'<article class="item recurring-event data-card market-price"><div class="item-main"><div class="recurring-heading"><b>'+esc(p.item)+'</b><span class="recurring-badge">'+p.trendLabel+'</span></div><div class="market-price-grid"><span>Harga P2P<strong>'+fmt(p.p2pPrice)+' FLOWER</strong></span><span>Perubahan terakhir<strong>'+(p.marketChange==null?"—":(p.marketChange>0?"+":"")+p.marketChange.toFixed(2)+"%")+'</strong></span></div><p class="data-note">'+esc(p.reason)+'</p></div></article>').join(""):'<div class="empty">Belum ada item yang memenuhi kriteria rekomendasi musim ini.</div>';
 const observed=latestPrice.observedAt?new Date(latestPrice.observedAt).toLocaleString("id-ID",{dateStyle:"medium",timeStyle:"short"}):"—";
 const seasonHistoryHtml=seasonHistory.map(x=>'<span class="recurring-badge">'+x.season+' · '+(x.report?new Date(x.report.observedAt).toLocaleDateString("id-ID"):"Belum ada data")+'</span>').join(" ");
 const seasonNotice=activeSeason?((latestPrice.seasonVerified===true&&latestPrice.season===activeSeason)?"Musim aktif: "+activeSeason+" · snapshot terbaru sudah terverifikasi untuk musim ini. Rekomendasi jual memakai riwayat musim ini.":"Musim aktif: "+activeSeason+" · harga terbaru tetap ditampilkan, tetapi analisis menunggu snapshot yang terverifikasi untuk musim ini."):"Pilih musim sesuai kalender dalam game, lalu konfirmasi. Semua harga dan tren tetap tampil; rekomendasi jual menunggu verifikasi musim.";
 const transactionHtml=transactions.length?transactions.map(tx=>'<article class="item recurring-event data-card"><div class="item-main"><div class="recurring-heading"><b>'+esc(tx.item)+'</b><span class="recurring-badge">'+esc(tx.status==="sold"?"Terjual":"Claimed")+'</span></div><small>'+fmt(tx.quantity)+' unit · '+fmt(tx.amount)+' FLOWER · '+esc(tx.soldAt||tx.claimedAt||"Tanggal tidak tersedia")+'</small></div></article>').join(""):'<div class="empty">Belum ada transaksi claimed yang tersinkron.</div>';
 root.innerHTML=targetHtml+'<section class="card market-target sfl-market-heading"><div class="recurring-heading"><h3>Market SFL</h3><span class="recurring-badge">'+items.length+' item pasar</span></div><p class="data-note">Snapshot terbaru: '+esc(observed)+'. Pergerakan dan rekomendasi difilter sesuai musim aktif.</p></section>'+seasonGuideHtml+'<section class="section-head"><h3>Top 5 harga naik · musim aktif</h3></section><div class="list">'+moverHtml(rising)+'</div><section class="section-head"><h3>Top 5 harga turun</h3></section><div class="list">'+moverHtml(falling)+'</div><section class="section-head"><h3>Rekomendasi jual</h3><span class="small muted">'+sellCount+' sinyal jual</span></section><div class="list">'+recommendationHtml+'</div><p class="data-note">'+esc(seasonNotice)+' Rekomendasi jual hanya aktif dengan minimal tiga snapshot terverifikasi dalam musim yang sama.</p>';


}
$("sflFetchMarketBtn").onclick=()=>loadSflMarketFeed();
 $("sflSyncTransactionsBtn").onclick=()=>loadSflTransactionFeed();
$("sflClearMarketBtn").onclick=()=>{$("sflMarketJson").value="";$("sflMarketStatus").textContent="Kolom JSON dibersihkan."};
$("sflImportMarketBtn").onclick=async()=>{
 const status=$("sflMarketStatus"),raw=$("sflMarketJson").value.trim();
 if(!raw){status.textContent="Tempel JSON laporan terlebih dahulu.";return}
 try{
  const cleaned=raw.replace(/^\s*```(?:json)?\s*/i,"").replace(/\s*```\s*$/,"");
  const parsed=JSON.parse(cleaned);
  const reports=Array.isArray(parsed)?parsed:[parsed];
  if(!reports.length||reports.length>100||!reports.every(validMarketReport))throw new Error("Format JSON tidak sesuai. Pastikan memakai blok JSON laporan SFL dari Scheduled Task.");
  sflState.marketReports=Array.isArray(sflState.marketReports)?sflState.marketReports:[];
  let added=0;
  for(const report of reports){
   const normalized={...report,id:report.id||("market-"+Date.parse(report.observedAt))};
   const index=sflState.marketReports.findIndex(x=>x.id===normalized.id);
   if(index>=0)sflState.marketReports[index]=normalized;else{sflState.marketReports.push(normalized);added++}
  }
  sflState.marketReports=sflState.marketReports.slice(-100);
  await saveSfl();status.textContent=added+" laporan baru diimpor; "+(reports.length-added)+" diperbarui/duplikat. Tersimpan lokal di perangkat ini.";
 }catch(error){status.textContent=error.message||"JSON tidak valid; data tidak diubah."}
};
document.addEventListener("click",async e=>{
 const b=e.target.closest("[data-market-remove]");if(!b)return;
 const item=sflState.marketReports.find(x=>x.id===b.dataset.marketRemove);
 if(!item||!confirm("Hapus laporan market ini?"))return;
 sflState.marketReports=sflState.marketReports.filter(x=>x.id!==item.id);await saveSfl();$("sflMarketStatus").textContent="Laporan dihapus.";
});

async function loadSflMarketFeed(options={}){
 if(loadSflMarketFeed.running)return;
 loadSflMarketFeed.running=true;
 const status=$("sflMarketStatus"),button=$("sflFetchMarketBtn");
 if(button)button.disabled=true;
 if(status&&!options.silent)status.textContent="Mengambil feed harga P2P SFL.world…";
 try{
  const response=await fetch("./market-feed.json?ts="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const feed=await response.json();
  if(feed.type!=="sfl-market-feed"||feed.schemaVersion!==1||!Array.isArray(feed.history))throw new Error("Format feed market tidak valid");
  const snapshots=feed.history.filter(x=>x&&typeof x.date==="string"&&x.prices&&typeof x.prices==="object");
  if(!snapshots.length)throw new Error("Belum ada snapshot harga pada feed");
  sflState.marketReports=Array.isArray(sflState.marketReports)?sflState.marketReports:[];
  let added=0;
  const orderedSnapshots=snapshots.slice().sort((a,b)=>Date.parse(a.observedAt||a.sourceUpdatedAt||a.date)-Date.parse(b.observedAt||b.sourceUpdatedAt||b.date));
  const latestSnapshot=orderedSnapshots[orderedSnapshots.length-1];
  for(const snapshot of orderedSnapshots){
   const marketPrices=Object.entries(snapshot.prices).filter(([item,value])=>item&&Number.isFinite(Number(value))&&Number(value)>=0).map(([item,value])=>({
    item,p2pPrice:Number(value),source:"SFL.world P2P",observedAt:snapshot.sourceUpdatedAt||snapshot.observedAt,metric:"p2p"
   }));
   if(!marketPrices.length)continue;
   const report={
    type:"sfl-market-report",schemaVersion:1,id:"sfl-market-"+(snapshot.observedAt||snapshot.date),
    observedAt:snapshot.observedAt||feed.generatedAt,currency:"FLOWER",
    season:SFL_SEASONS.includes(snapshot.season)?snapshot.season:(sflState.activeSeasonStartedAt&&SFL_SEASONS.includes(sflState.activeSeason)&&Date.parse(snapshot.observedAt||snapshot.sourceUpdatedAt||snapshot.date)>=Date.parse(sflState.activeSeasonStartedAt)?sflState.activeSeason:null),
    seasonVerified:SFL_SEASONS.includes(snapshot.season)||(Boolean(sflState.activeSeasonStartedAt)&&SFL_SEASONS.includes(sflState.activeSeason)&&Date.parse(snapshot.observedAt||snapshot.sourceUpdatedAt||snapshot.date)>=Date.parse(sflState.activeSeasonStartedAt)),
    seasonAssignmentSource:SFL_SEASONS.includes(snapshot.season)?"feed":(sflState.activeSeasonStartedAt&&SFL_SEASONS.includes(sflState.activeSeason)&&Date.parse(snapshot.observedAt||snapshot.sourceUpdatedAt||snapshot.date)>=Date.parse(sflState.activeSeasonStartedAt)?"user-confirmed-current-season":null),
    walletBalance:null,confirmedReceipts:4.632,target:410,
    marketPrices,transactions:[],
    summary:"Snapshot harga P2P SFL.world · "+marketPrices.length+" item. Harga P2P bukan last sale atau floor.",
    dataGaps:["Feed ini hanya menyediakan harga P2P; last sale, floor, listing, dan volume tidak tersedia."],
    sourceUrl:feed.sourceUrl||"https://sfl.world/api/v1/prices",
    sourceUpdatedAt:snapshot.sourceUpdatedAt||null
   };
   const index=sflState.marketReports.findIndex(x=>x.id===report.id);
   if(index>=0){const existing=sflState.marketReports[index];if(existing.seasonVerified===true&&SFL_SEASONS.includes(existing.season)){report.season=existing.season;report.seasonVerified=true;report.seasonAssignmentSource=existing.seasonAssignmentSource||"preserved-user-confirmation"}sflState.marketReports[index]={...existing,...report}}else{sflState.marketReports.push(report);added++}
  }
  sflState.marketReports.sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
  sflState.marketReports=sflState.marketReports.slice(-360);
  await saveSfl();
  renderSfl();
  const latest=latestSnapshot;
  const sourceTime=latest.sourceUpdatedAt&&Number.isFinite(Date.parse(latest.sourceUpdatedAt))?new Date(latest.sourceUpdatedAt).toLocaleString("id-ID"):"waktu sumber tidak tersedia";
  if(status)status.textContent="GitHub feed tersinkron · "+snapshots.length+" snapshot · "+Object.keys(latest.prices).length+" item · data sumber "+sourceTime+".";
 }catch(error){
  if(status)status.textContent="Feed otomatis belum dapat dimuat ("+(error.message||"kesalahan jaringan")+"). Impor JSON manual tetap tersedia.";
 }finally{
  if(button)button.disabled=false;
  loadSflMarketFeed.running=false;
 }
}
async function loadSflTransactionFeed(options={}) {
 const status=$("sflMarketStatus");
 try {
  const response=await fetch("./transaction-feed.json?ts="+Date.now(),{cache:"no-store"});
  if(!response.ok)throw new Error("HTTP "+response.status);
  const feed=await response.json();
  if(feed.type!=="sfl-transaction-feed"||feed.schemaVersion!==1||feed.currency!=="FLOWER"||!Array.isArray(feed.transactions))throw new Error("Format transaction feed tidak valid");
  const transactions=feed.transactions.filter(t=>t&&typeof t.id==="string"&&t.id&&typeof t.item==="string"&&Number.isFinite(t.quantity)&&t.quantity>0&&Number.isFinite(t.amount)&&t.amount>=0&&t.currency==="FLOWER"&&["claimed","sold"].includes(t.status));
  const prior=[...(sflState.marketReports||[])].sort((a,b)=>Date.parse(b.observedAt)-Date.parse(a.observedAt))[0];
  const marketPrices=prior&&Array.isArray(prior.marketPrices)?prior.marketPrices:[];
  const total=transactions.reduce((sum,t)=>sum+t.amount,SFL_HISTORICAL_BASELINE);
  const report={
   type:"sfl-market-report",schemaVersion:1,id:"sfl-transactions-"+String(feed.updatedAt||feed.updatedDate||"latest").slice(0,10),
   observedAt:feed.updatedAt||new Date().toISOString(),currency:"FLOWER",walletBalance:Number.isFinite(feed.walletBalance)?feed.walletBalance:null,
   confirmedReceipts:total,target:410,marketPrices,transactions,season:null,walletBalanceUpdatedAt:feed.balanceUpdatedAt||null,walletBalanceSource:feed.balanceSource||null,
   summary:"Saldo wallet berasal dari konfirmasi pengguna; estimasi penerimaan dihitung terpisah dari baseline historis dan transaksi feed.",
   dataGaps:["Selisih saldo wallet dan estimasi transaksi perlu rekonsiliasi bila keduanya berbeda.","Feed transaksi bersifat publik."]
  };
  sflState.marketReports=Array.isArray(sflState.marketReports)?sflState.marketReports:[];
  const index=sflState.marketReports.findIndex(x=>x.id===report.id);
  if(index>=0)sflState.marketReports[index]=report;else sflState.marketReports.push(report);
  sflState.marketReports.sort((a,b)=>Date.parse(a.observedAt)-Date.parse(b.observedAt));
  sflState.marketReports=sflState.marketReports.slice(-100);
  await saveSfl();
  if(status)status.textContent="Transaksi tersinkron · "+transactions.length+" catatan transaksi · penerimaan estimasi "+total.toFixed(4)+" FLOWER.";
 } catch(error) {
  if(status&&!options.silent)status.textContent="Feed transaksi belum dapat dimuat ("+(error.message||"kesalahan jaringan")+").";
 }
}
function renderSfl(){ const dashboardGoal=$("sflDashboardGoal");if(dashboardGoal)dashboardGoal.innerHTML=buildSflGoalHtml(sflState.marketReports||[]); const dashboardMarket=$("sflDashboardMarket");if(dashboardMarket)dashboardMarket.innerHTML=buildSflDashboardMarketHtml(); const seasonSelect=$("sflSeasonSelect");if(seasonSelect)seasonSelect.value=SFL_SEASONS.includes(sflState.activeSeason)?sflState.activeSeason:""; sflState.marketReports=Array.isArray(sflState.marketReports)?sflState.marketReports:[]; $("sflStatItems").textContent=sflState.inventory.length;$("sflStatCrops").textContent=sflState.crops.length;$("sflStatGoals").textContent=sflState.goals.length;renderSflList("inventory","sflInventoryList");renderSflList("crops","sflCropList");renderSflList("goals","sflGoalList");renderMarketReports();const recent=[...sflState.inventory.slice(-2).map(x=>({name:x.name,detail:(x.category||"Item")+" · "+x.quantity})),...sflState.crops.slice(-2).map(x=>({name:x.name,detail:x.status+" · "+x.quantity+" unit"})),...sflState.goals.slice(-2).map(x=>({name:x.name,detail:x.current+" / "+x.goal}))].slice(-6).reverse();$("sflRecent").innerHTML=recent.length?recent.map(x=>'<article class="item recurring-event overview-entry"><div class="item-main"><b>'+esc(x.name)+'</b><small>'+esc(x.detail)+'</small></div></article>').join(""):'<div class="empty">Belum ada data Sunflower Land.</div>'}
document.addEventListener("click",e=>{const b=e.target.closest("[data-sfl-remove]");if(!b)return;const kind=b.dataset.sflRemove,item=sflState[kind].find(x=>x.id===b.dataset.id);if(!item||!confirm('Hapus "'+item.name+'"?'))return;sflState[kind]=sflState[kind].filter(x=>x.id!==item.id);saveSfl()});

function id(){return crypto.randomUUID?crypto.randomUUID():String(Date.now())+Math.random().toString(16).slice(2)}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function showForm(id){$(id).classList.remove("hidden");$(id).querySelector("input")?.focus()}
function hideForm(id){$(id).reset();$(id).classList.add("hidden")}
document.querySelectorAll("#pixelMain .tab[data-tab]").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll("#pixelMain .tab[data-tab]").forEach(x=>x.classList.toggle("active",x===b));document.querySelectorAll("#pixelMain .panel").forEach(x=>x.classList.toggle("active",x.id===b.dataset.tab))}));
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
  return '<article class="item recurring-event event-card"><div class="item-main"><div class="recurring-heading"><b>'+esc(x.name)+'</b><span class="recurring-badge">Tracker pribadi</span></div><small>'+esc(x.target||"Target belum ditentukan")+'</small><div class="recurring-next"><span>Progres event</span><strong>'+progress+'</strong>'+(x.goal>0?'<div class="progress"><span style="width:'+pct+'%"></span></div>':'')+'</div>'+(x.sourceUrl?'<a href="'+esc(x.sourceUrl)+'" target="_blank" rel="noopener noreferrer">Lihat sumber pengumuman</a>':'')+'</div><div class="item-actions"><button class="btn" data-edit-event="'+esc(x.id)+'">Update progres</button><button class="btn danger" data-remove="events" data-id="'+esc(x.id)+'" aria-label="Hapus '+esc(x.name)+'">Hapus</button></div></article>';
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
document.addEventListener("click",async e=>{
 const b=e.target.closest("[data-edit-event]");if(!b)return;
 const item=state.events.find(x=>x.id===b.dataset.editEvent);if(!item)return;
 const currentText=prompt("Progres saat ini:",String(item.current??0));if(currentText===null)return;
 const goalText=prompt("Target jumlah:",String(item.goal??0));if(goalText===null)return;
 const current=Number(currentText),goal=Number(goalText);
 if(!Number.isSafeInteger(current)||current<0||!Number.isSafeInteger(goal)||goal<0){alert("Masukkan angka bulat 0 atau lebih.");return}
 item.current=current;item.goal=goal;await save();
});
document.addEventListener("click",e=>{const b=e.target.closest("[data-remove]");if(b)remove(b.dataset.remove,b.dataset.id)});
async function readPweMarketBackup(){
 const db=await dbOpen();
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readonly"),req=tx.objectStore(STORE).get("pixel-worlds-market-data");req.onsuccess=()=>resolve(req.result||{schemaVersion:1,history:[]});req.onerror=()=>reject(req.error);tx.onabort=()=>reject(tx.error||new Error("Gagal membaca data market PWE"))})}
 finally{db.close()}
}
function validPweMarket(x){return !!x&&x.schemaVersion===1&&Array.isArray(x.history)&&x.history.length<=200&&x.history.every(s=>s&&typeof s.id==="string"&&Number.isFinite(Date.parse(s.observedAt))&&Array.isArray(s.entries)&&s.entries.length<=500&&s.entries.every(e=>e&&typeof e.item==="string"&&e.item.length>0&&Number.isFinite(e.price)&&e.price>0))}
async function exportAllData(){
 try{
  const pweMarket=await readPweMarketBackup();
  const payload={app:"universal-game-manager",schemaVersion:1,exportedAt:new Date().toISOString(),games:{"pixel-worlds":state,"sunflower-land":sflState},modules:{"pixel-worlds-market":pweMarket}};
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download="ugm-full-backup.json";a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  notice("Backup seluruh UGM berhasil dibuat, termasuk riwayat market PWE.");$("sflNotice").textContent="Backup seluruh UGM berhasil dibuat, termasuk riwayat market PWE.";
 }catch(error){notice("Backup gagal: "+error.message);$("sflNotice").textContent="Backup gagal: "+error.message}
}
async function importAllData(event){
 const input=event.target,file=input.files?.[0];if(!file)return;
 try{
  if(file.size>10*1024*1024)throw new Error("Ukuran file melebihi 10 MB.");
  const parsed=JSON.parse(await file.text());
  let nextPixel=state,nextSfl=sflState,nextPwe=null,hasPixel=false,hasSfl=false,hasPwe=false;
  if(parsed?.app==="universal-game-manager"&&parsed.schemaVersion===1&&parsed.games){
   if(!valid(parsed.games["pixel-worlds"])||!validSfl(parsed.games["sunflower-land"]))throw new Error("Struktur backup game tidak valid.");
   nextPixel=parsed.games["pixel-worlds"];nextSfl=parsed.games["sunflower-land"];hasPixel=hasSfl=true;
   if(parsed.modules?.["pixel-worlds-market"]!==undefined){if(!validPweMarket(parsed.modules["pixel-worlds-market"]))throw new Error("Struktur backup market PWE tidak valid.");nextPwe=parsed.modules["pixel-worlds-market"];hasPwe=true}
  }else if(valid(parsed)){nextPixel=parsed;hasPixel=true}
  else if(validSfl(parsed)){nextSfl=parsed;hasSfl=true}
  else throw new Error("Format backup tidak dikenali.");
  const scope=hasPixel&&hasSfl?"Pixel Worlds dan Sunflower Land":hasPixel?"Pixel Worlds saja (format backup lama)":"Sunflower Land saja (format backup lama)";
  const extras=hasPwe?" serta riwayat market PWE":"";
  if(!confirm("Pulihkan "+scope+extras+"? Data yang termasuk dalam file akan diganti."))return;
  const db=await dbOpen();
  try{await new Promise((resolve,reject)=>{const tx=db.transaction(STORE,"readwrite"),store=tx.objectStore(STORE);if(hasPixel)store.put(nextPixel,"data");if(hasSfl)store.put(nextSfl,"sunflower-land-data");if(hasPwe)store.put(nextPwe,"pixel-worlds-market-data");tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error||new Error("Transaksi pemulihan gagal"));tx.onabort=()=>reject(tx.error||new Error("Pemulihan dibatalkan; data lama dipertahankan"))})}
  finally{db.close()}
  if(hasPixel)state=nextPixel;if(hasSfl)sflState=nextSfl;
  if(hasPixel||hasSfl){render();renderSfl()}
  if(hasPwe)window.dispatchEvent(new CustomEvent("ugm:data-restored"));
  const success="Backup berhasil dipulihkan: "+scope+extras+".";notice(success);$("sflNotice").textContent=success;
 }catch(error){
  const message=error.message||"File tidak valid. Data tidak diubah.";
  notice(message);$("sflNotice").textContent=message;
 }finally{input.value=""}
}
$("exportAllBtn").onclick=exportAllData;$("sflExportAllBtn").onclick=exportAllData;
$("importAllFile").onchange=importAllData;$("sflImportAllFile").onchange=importAllData;

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
load().then(()=>{loadSflMarketFeed({silent:true});loadSflTransactionFeed({silent:true})}).catch(()=>notice("IndexedDB tidak tersedia di browser ini."));
document.addEventListener("visibilitychange",()=>{if(!document.hidden){loadSflMarketFeed({silent:true});loadSflTransactionFeed({silent:true})}});
setInterval(()=>{if(!document.hidden)loadSflMarketFeed({silent:true})},10*60*1000);
loadAutoEvents();

// Pixel Worlds PWE offer calculator: seed count multiplied by offer per seed.
function updatePwFarmCalc(){
 const read=id=>{
  const raw=$(id).value.trim();
  if(raw==="")return null;
  const n=Number(raw);
  return Number.isFinite(n)?n:NaN;
 };
 const seeds=read("pwCalcSeeds"),offer=read("pwCalcOffer");
 const output=$("pwCalcTotalOffer"),verdict=$("pwCalcVerdict");
 output.textContent="— BC";
 const fmt=n=>Number(n).toLocaleString("id-ID",{maximumFractionDigits:4});
 if(seeds===null||offer===null){verdict.textContent="Lengkapi jumlah seed dan tawaran PWE per seed.";return}
 if(!Number.isInteger(seeds)||seeds<=0){verdict.textContent="Jumlah seed harus bilangan bulat lebih dari 0.";return}
 if(!Number.isFinite(offer)||offer<0){verdict.textContent="Tawaran PWE harus 0 atau lebih.";return}
 output.textContent=fmt(seeds*offer)+" BC";
 verdict.textContent="Perkiraan total BC jika semua seed terjual pada tawaran tersebut.";
}
["pwCalcSeeds","pwCalcOffer"].forEach(id=>$(id).addEventListener("input",updatePwFarmCalc));
updatePwFarmCalc();
})();
