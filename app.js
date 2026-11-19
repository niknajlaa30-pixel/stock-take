(function(){
  const MONTHS=["Januari","Februari","Mac","April","Mei","Jun","Julai","Ogos","September","Oktober","November","Disember"];
  const TYPES=["tab","bottle","tube","sachet","box","ampoule"];
  const $=id=>document.getElementById(id);
  const expIn=$("exp"), brandIn=$("brand");
  const fmtDate=s=>{const [y,m,d]=s.split("-");return d+"/"+m+"/"+y;};
  const expClass=s=>{const t=new Date(s+"T00:00:00");const today=new Date();today.setHours(0,0,0,0);
    if(t<today) return "past"; const soon=new Date(today);soon.setMonth(soon.getMonth()+3); return t<=soon?"soon":"";};
  const expPill=s=>{const p=document.createElement("span");const c=expClass(s);p.className="exp"+(c?" "+c:"");
    p.textContent=(c==="past"?"Luput ":"Exp ")+fmtDate(s);return p;};
  const monthSel=$("month"), form=$("form"), nameIn=$("name"), qtyIn=$("qty"), typeIn=$("type"), perIn=$("per"), priceIn=$("price"), msg=$("msg");
  let entries=[];          // {id,name,qty,month,at}
  let itemMap=new Map();   // normalized name -> {type, per, price}
  let store=null;          // {add, del, setItem}
  let lastRows=[];

  const fillTypes=(sel,blank)=>{sel.textContent="";const o0=document.createElement("option");o0.value="";o0.textContent=blank;sel.appendChild(o0);
    for(const t of TYPES){const o=document.createElement("option");o.value=t;o.textContent=t;sel.appendChild(o);}};
  fillTypes(typeIn,"— pilih —");

  // Month list
  const now=new Date(); const keys=[];
  for(let i=-5;i<=1;i++){const d=new Date(now.getFullYear(),now.getMonth()+i,1);keys.push(d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0"));}
  if(!keys.includes("2026-11")) keys.push("2026-11");
  keys.sort();
  keys.forEach(k=>{const o=document.createElement("option");o.value=k;const [y,m]=k.split("-");o.textContent=MONTHS[+m-1]+" "+y;monthSel.appendChild(o);});
  let saved=null; try{saved=localStorage.getItem("kiraStokMonth")}catch(e){}
  monthSel.value = saved && keys.includes(saved) ? saved : (keys.includes("2026-11")?"2026-11":keys[keys.length-2]);
  monthSel.addEventListener("change",()=>{try{localStorage.setItem("kiraStokMonth",monthSel.value)}catch(e){};render()});

  const norm=s=>s.trim().replace(/\s+/g," ").toLowerCase();
  const tidy=s=>s.trim().replace(/\s+/g," ");
  const fmt=n=>Number.isInteger(n)?String(n):String(Math.round(n*100)/100);
  const rm=n=>n.toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:2});
  const rmUnit=n=>n>=0.1?rm(n):n.toLocaleString("en-MY",{minimumFractionDigits:2,maximumFractionDigits:4});
  const say=(t,err)=>{msg.textContent=t;msg.className="msg"+(err?" err":"");};
  const keyId=k=>"i-"+Array.from(k).map(ch=>/[A-Za-z0-9_\-.]/.test(ch)?ch:"~"+ch.codePointAt(0).toString(16)).join("").slice(0,190);
  const info=k=>itemMap.get(k)||{};
  const td=(cls,text)=>{const c=document.createElement("td");if(cls)c.className=cls;if(text!=null)c.textContent=text;return c;};
  const dash=c=>{c.textContent="–";c.classList.add("unset");return c;};

  function numInput(cls,val,label,step,onSave){
    const i=document.createElement("input");i.type="number";i.inputMode="decimal";i.step=step;i.min="0";i.className=cls;
    i.value=val?String(val):"";i.placeholder="?";i.setAttribute("aria-label",label);
    i.addEventListener("change",()=>onSave(i.value));return i;
  }

  function render(){
    const m=monthSel.value;
    const list=entries.filter(e=>e.month===m).sort((a,b)=>b.at-a.at);
    const g=new Map();
    for(const e of list.slice().reverse()){
      const k=norm(e.name); if(!g.has(k)) g.set(k,{key:k,name:tidy(e.name),parts:[],total:0});
      const it=g.get(k); it.parts.push(e.qty); it.total+=e.qty;
      if(e.exp&&(!it.exp||e.exp<it.exp)) it.exp=e.exp;
    }
    const rows=[...g.values()].sort((a,b)=>a.name.localeCompare(b.name,"ms",{sensitivity:"base"}));

    // Totals
    const tb=$("totals"); tb.textContent="";
    if(!rows.length){tb.innerHTML='<tr><td colspan="4" class="empty">Belum ada kiraan untuk bulan ni. Taip nama ubat dan bilangan di atas untuk mula.</td></tr>';}
    let grand=0, priced=0;
    for(const r of rows){
      const it=info(r.key); r.type=it.type||""; r.brand=it.brand||""; r.isi=it.per?r.total*it.per:null; r.value=it.price?r.total*it.price:null;
      if(r.value!=null){grand+=r.value;priced++;}
      const tr=document.createElement("tr");
      const a=td("",null);const nc=document.createElement("div");nc.className="namecell";
      const nl=document.createElement("span");nl.textContent=r.name;
      if(r.type){const t=document.createElement("span");t.className="tag";t.textContent=r.type;nl.appendChild(t);}
      nc.appendChild(nl);
      if(r.brand){const b=document.createElement("span");b.className="brand";b.textContent=r.brand;nc.appendChild(b);}
      if(r.exp) nc.appendChild(expPill(r.exp)); a.appendChild(nc);
      const b=td("n total",(fmt(r.total)));
      if(r.parts.length>1){const p=document.createElement("span");p.className="parts";p.textContent=r.parts.map(fmt).join(" + ");b.appendChild(p);}
      const c=td("n");r.isi!=null?c.textContent=fmt(r.isi):dash(c);
      const d=td("n total acc");r.value!=null?d.textContent=rm(r.value):dash(d);
      tr.append(a,b,c,d);tb.appendChild(tr);
    }
    $("foot").hidden=!priced; $("grand").textContent="RM "+rm(grand);
    $("stat").textContent=rows.length?rows.length+" ubat · "+list.length+" kiraan":"";
    lastRows=rows; lastGrand=priced?grand:null;

    // Item info (all items ever counted)
    const all=new Map();
    for(const e of entries){const k=norm(e.name);if(!all.has(k))all.set(k,tidy(e.name));}
    const names=[...all.entries()].sort((a,b)=>a[1].localeCompare(b[1],"ms",{sensitivity:"base"}));
    const ib=$("info"); ib.textContent="";
    if(!names.length){ib.innerHTML='<tr><td colspan="6" class="empty">Ubat akan keluar di sini lepas kiraan pertama.</td></tr>';}
    for(const [k,name] of names){
      const it=info(k);const tr=document.createElement("tr");
      const sel=document.createElement("select");fillTypes(sel,"–");sel.value=it.type||"";sel.setAttribute("aria-label","Jenis "+name);
      sel.addEventListener("change",()=>saveItem(name,{type:sel.value}));
      const sTd=td("");sTd.appendChild(sel);
      const pTd=td("n");pTd.appendChild(numInput("sm",it.per&&fmt(it.per),"Berapa tablet dalam 1x "+name,"any",v=>saveItem(name,{per:v})));
      const prTd=td("n");prTd.appendChild(numInput("md",it.price&&it.price.toFixed(2),"Harga beli 1x "+name,"0.01",v=>saveItem(name,{price:v})));
      const u=td("n");(it.price&&it.per)?u.textContent="RM "+rmUnit(it.price/it.per):dash(u);
      const bi=document.createElement("input");bi.className="br";bi.maxLength=80;bi.value=it.brand||"";bi.placeholder="–";bi.setAttribute("aria-label","Brand "+name);
      bi.addEventListener("change",()=>saveItem(name,{brand:bi.value}));
      const bTd=td("");bTd.appendChild(bi);
      const ni=document.createElement("input");ni.className="nmi";ni.maxLength=120;ni.value=name;ni.setAttribute("aria-label","Tukar nama "+name);
      ni.addEventListener("change",()=>renameItem(k,ni.value));
      const nTd=td("");nTd.appendChild(ni);
      tr.append(nTd,bTd,sTd,pTd,prTd,u);ib.appendChild(tr);
    }

    // Log
    const ul=$("log");ul.textContent="";
    if(!list.length){ul.innerHTML='<li class="empty" style="justify-content:center">Belum ada kiraan.</li>';}
    for(const e of list){
      if(editing&&editing.id===e.id){ul.appendChild(editRow());continue;}
      const li=document.createElement("li");
      const nm=document.createElement("span");nm.className="nm";nm.textContent=e.name;
      if(e.exp){nm.appendChild(document.createTextNode(" "));nm.appendChild(expPill(e.exp));}
      const q=document.createElement("span");q.className="q";q.textContent=fmt(e.qty);
      const t=document.createElement("span");t.className="t";const d=new Date(e.at);t.textContent=d.getDate()+"/"+(d.getMonth()+1)+" "+String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
      const x=document.createElement("button");x.className="del";x.type="button";x.textContent="Padam";x.setAttribute("aria-label","Padam "+e.name+" "+fmt(e.qty));
      x.addEventListener("click",()=>{
        if(x.dataset.sure){store&&store.del(e.id).catch(()=>say("Tak dapat padam. Cuba lagi.",true));}
        else{x.dataset.sure="1";x.textContent="Pasti?";setTimeout(()=>{if(x.isConnected){delete x.dataset.sure;x.textContent="Padam";}},3000);}
      });
      const ed=document.createElement("button");ed.className="edit";ed.type="button";ed.textContent="Ubah";ed.setAttribute("aria-label","Ubah "+e.name+" "+fmt(e.qty));
      ed.addEventListener("click",()=>{editing={id:e.id,name:e.name,qty:fmt(e.qty),exp:e.exp||""};render();const f=document.getElementById("ed-name");if(f)f.focus();});
      li.append(nm,q,t,ed,x);ul.appendChild(li);
    }

    const dl=$("names");dl.textContent="";
    for(const [,name] of names){const o=document.createElement("option");o.value=name;dl.appendChild(o);}
  }
  let lastGrand=null;
  let editing=null; // {id,name,qty,exp} draft for one count being corrected

  function editRow(){
    const li=document.createElement("li");li.className="editing";
    const n=document.createElement("input");n.id="ed-name";n.className="en";n.value=editing.name;n.setAttribute("list","names");n.setAttribute("aria-label","Nama ubat");
    const q=document.createElement("input");q.id="ed-qty";q.className="eq";q.type="number";q.inputMode="decimal";q.step="any";q.value=editing.qty;q.setAttribute("aria-label","Bilangan");
    const x=document.createElement("input");x.id="ed-exp";x.className="ee";x.type="date";x.value=editing.exp;x.setAttribute("aria-label","Expiry");
    n.addEventListener("input",()=>editing.name=n.value);q.addEventListener("input",()=>editing.qty=q.value);x.addEventListener("input",()=>editing.exp=x.value);
    const s=document.createElement("button");s.type="button";s.className="btn";s.textContent="Simpan";
    const c=document.createElement("button");c.type="button";c.className="edit";c.textContent="Batal";
    c.addEventListener("click",()=>{editing=null;render();});
    s.addEventListener("click",async()=>{
      const name=tidy(editing.name), qty=parseFloat(editing.qty);
      if(!name){say("Nama ubat tak boleh kosong.",true);return;}
      if(!isFinite(qty)){say("Bilangan mesti nombor.",true);return;}
      const exp=/^\d{4}-\d{2}-\d{2}$/.test(editing.exp)?editing.exp:"";
      try{await store.upd(editing.id,{name,qty,exp});editing=null;say("Kiraan dibetulkan: "+name+" "+fmt(qty));render();}
      catch(e){say("Tak dapat simpan. Cuba lagi.",true);}
    });
    li.addEventListener("keydown",ev=>{if(ev.key==="Enter"){ev.preventDefault();s.click();}else if(ev.key==="Escape"){c.click();}});
    li.append(n,q,x,s,c);return li;
  }

  // Rename every count of one ubat (all months) and carry its brand/jenis/tablet/harga over.
  async function renameItem(oldKey,raw){
    const newName=tidy(raw); if(!newName){say("Nama ubat tak boleh kosong.",true);render();return;}
    const newKey=norm(newName);
    const targets=entries.filter(e=>norm(e.name)===oldKey);
    if(targets.every(e=>tidy(e.name)===newName)) return;
    if(!store){say("Belum sedia, tunggu sekejap.",true);return;}
    const old=info(oldKey); const hasInfo=old.type||old.brand||old.per||old.price;
    const full=f=>({type:f.type||"",brand:f.brand||"",per:f.per||0,price:f.price||0});
    try{
      for(const e of targets) await store.upd(e.id,{name:newName});
      if(hasInfo){
        if(newKey===oldKey) await store.setItem(newKey,newName,full(old));
        else{ if(!itemMap.has(newKey)) await store.setItem(newKey,newName,full(old)); await store.setItem(oldKey,"",full({})); }
      }
      say("Nama ditukar ke "+newName+" ("+targets.length+" kiraan)."+(newKey!==oldKey&&entries.some(e=>norm(e.name)===newKey&&!targets.includes(e))?" Dicampur dengan ubat yang sama nama.":""));
    }catch(e){say("Tak dapat tukar nama. Cuba lagi.",true);}
    render();
  }

  // Save one or more of type / per / price for an item. Empty string clears that field.
  async function saveItem(name,changes){
    const k=norm(name); const cur={...info(k)}; const next={...cur};
    if("type" in changes){next.type=TYPES.includes(changes.type)?changes.type:"";}
    if("brand" in changes){next.brand=tidy(String(changes.brand)).slice(0,80);}
    for(const f of ["per","price"]){
      if(!(f in changes)) continue;
      const raw=String(changes[f]).trim(); const v=raw===""?0:parseFloat(raw);
      if(!isFinite(v)||v<0){say((f==="per"?"Bilangan tablet dalam 1x":"Harga")+" mesti nombor.",true);render();return false;}
      next[f]=v;
    }
    if((cur.type||"")===(next.type||"")&&(cur.brand||"")===(next.brand||"")&&(cur.per||0)===(next.per||0)&&(cur.price||0)===(next.price||0)) return true;
    if(!store){say("Belum sedia, tunggu sekejap.",true);return false;}
    try{await store.setItem(k,tidy(name),{type:next.type||"",brand:next.brand||"",per:next.per||0,price:next.price||0});say("Maklumat "+tidy(name)+" disimpan.");return true;}
    catch(e){say("Tak dapat simpan maklumat ubat. Cuba lagi.",true);return false;}
  }

  nameIn.addEventListener("input",()=>{const it=info(norm(nameIn.value));
    typeIn.value=it.type||""; brandIn.value=it.brand||""; perIn.value=it.per?fmt(it.per):""; priceIn.value=it.price?it.price.toFixed(2):"";});

  form.addEventListener("submit",async ev=>{
    ev.preventDefault();
    const name=tidy(nameIn.value); const qty=parseFloat(qtyIn.value);
    if(!name){say("Taip nama ubat dulu.",true);nameIn.focus();return;}
    if(!isFinite(qty)){say("Taip bilangan (nombor).",true);qtyIn.focus();return;}
    for(const [inp,lbl] of [[perIn,"Bilangan tablet dalam 1x"],[priceIn,"Harga"]]){const v=inp.value.trim();if(v!==""&&!(parseFloat(v)>=0)){say(lbl+" mesti nombor.",true);inp.focus();return;}}
    if(!store){say("Belum sedia, tunggu sekejap.",true);return;}
    const rec={name,qty,month:monthSel.value,at:Date.now()};
    if(/^\d{4}-\d{2}-\d{2}$/.test(expIn.value)) rec.exp=expIn.value;
    try{await store.add(rec);}
    catch(e){say(e&&e.code==="quota_exceeded"?"Storan penuh. Padam kiraan bulan lama dulu.":"Tak dapat simpan. Cuba tekan Tambah sekali lagi.",true);return;}
    const ch={};
    if(typeIn.value) ch.type=typeIn.value;
    if(brandIn.value.trim()) ch.brand=brandIn.value;
    if(perIn.value.trim()!=="") ch.per=perIn.value;
    if(priceIn.value.trim()!=="") ch.price=priceIn.value;
    if(Object.keys(ch).length) await saveItem(name,ch);
    const k=norm(name); const it=info(k);
    const tot=entries.filter(e=>e.month===rec.month&&norm(e.name)===k).reduce((s,e)=>s+e.qty,0);
    let t="Disimpan: "+name+" "+fmt(qty)+(it.type?" "+it.type:"")+(rec.exp?" (exp "+fmtDate(rec.exp)+")":"");
    if(tot!==qty) t+=" (jumlah sekarang "+fmt(tot)+")";
    if(it.price) t+=" · nilai RM "+rm(tot*it.price);
    say(t);
    nameIn.value="";qtyIn.value="";expIn.value="";typeIn.value="";brandIn.value="";perIn.value="";priceIn.value="";nameIn.focus();
  });

  const CONF=window.STOCKTAKE_CONFIG||{};
  const clinic=CONF.clinicName||"";
  function monthLabel(){const [y,m]=monthSel.value.split("-");return MONTHS[+m-1]+" "+y;}
  function reportText(){
    const lines=lastRows.map(r=>{let s="- "+r.name+(r.brand?" ("+r.brand+")":"")+": "+fmt(r.total)+(r.type?" "+r.type:"");
      if(r.isi!=null) s+=" ("+fmt(r.isi)+" tablet)"; if(r.value!=null) s+=" = RM "+rm(r.value);
      if(r.exp) s+=" · exp "+fmtDate(r.exp); return s;});
    return "Stock take "+monthLabel()+(clinic?" - "+clinic:"")+"\n\n"+lines.join("\n")+(lastGrand!=null?"\n\nJumlah nilai stok: RM "+rm(lastGrand):"");
  }
  $("copy").addEventListener("click",async()=>{
    const text=reportText();
    try{await navigator.clipboard.writeText(text);say("Senarai disalin. Boleh tampal dalam WhatsApp.");}
    catch(e){say("Tak dapat salin terus. "+text.replace(/\n/g," · "),true);}
  });

  // Send to accountant: opens WhatsApp or the mail app with the report already written; the user taps Send there.
  const waNum=String(CONF.accountantPhone||"").replace(/\D/g,"").replace(/^0/,"60");
  const mail=String(CONF.accountantEmail||"");
  if(waNum||mail){
    $("sendSec").hidden=false;
    $("accPhone").textContent=CONF.accountantPhone||"";$("accEmail").textContent=mail;
    $("sendWa").hidden=!waNum;$("sendMail").hidden=!mail;
    const go=(kind,ev)=>{
      if(!lastRows.length){ev.preventDefault();say("Belum ada kiraan untuk "+monthLabel()+". Kira dulu sebelum hantar.",true);return;}
      const text=reportText();
      try{navigator.clipboard.writeText(text).catch(()=>{});}catch(e){}
      const subj="Stock take "+monthLabel()+(clinic?" - "+clinic:"");
      ev.currentTarget.href = kind==="wa"
        ? "https://wa.me/"+waNum+"?text="+encodeURIComponent(text)
        : "mailto:"+mail+"?subject="+encodeURIComponent(subj)+"&body="+encodeURIComponent(text);
      say("Laporan dibuka dalam "+(kind==="wa"?"WhatsApp":"email")+". Semak dan tekan Send. (Laporan juga dah disalin, boleh tampal kalau terpotong.)");
    };
    $("sendWa").addEventListener("click",ev=>go("wa",ev));
    $("sendMail").addEventListener("click",ev=>go("mail",ev));
  }
  if(clinic){$("clinic").textContent=clinic;$("clinic").hidden=false;document.title="Stock Take · "+clinic;}
  if(CONF.logo){const im=$("logo");im.src=CONF.logo;im.alt=clinic||"Logo";im.hidden=false;}

  // Local fallback (signed out, or store unreachable)
  function useLocal(note){
    try{entries=JSON.parse(localStorage.getItem("kiraStokEntries")||"[]")}catch(e){entries=[]}
    try{const raw=JSON.parse(localStorage.getItem("kiraStokItems")||"null");
      if(raw) itemMap=new Map(raw);
      else{const old=JSON.parse(localStorage.getItem("kiraStokPer")||"[]");itemMap=new Map(old.map(([k,v])=>[k,{per:v}]));}
    }catch(e){itemMap=new Map()}
    const save=()=>{try{localStorage.setItem("kiraStokEntries",JSON.stringify(entries));localStorage.setItem("kiraStokItems",JSON.stringify([...itemMap]))}catch(e){}};
    store={local:true,
      add:async r=>{entries.push({...r,id:String(r.at)+Math.random().toString(36).slice(2,6)});save();render();},
      del:async id=>{entries=entries.filter(e=>e.id!==id);save();render();},
      upd:async(id,f)=>{entries=entries.map(e=>e.id===id?{...e,...f}:e);save();},
      setItem:async(k,name,f)=>{if(!f.type&&!f.brand&&!f.per&&!f.price)itemMap.delete(k);else itemMap.set(k,f);save();render();}};
    const n=$("storeNote");n.textContent=note;n.hidden=false;render();
  }

  // Online store: Supabase (PostgREST over fetch, no library). Settings in config.js.
  const CFG=window.STOCKTAKE_CONFIG||{};
  const ONLINE=!!(CFG.supabaseUrl&&CFG.supabaseAnonKey);
  const API=ONLINE?CFG.supabaseUrl.replace(/\/+$/,"")+"/rest/v1/":"";
  async function api(method,path,body,prefer){
    const h={apikey:CFG.supabaseAnonKey,Authorization:"Bearer "+CFG.supabaseAnonKey};
    if(body!==undefined) h["Content-Type"]="application/json";
    if(prefer) h.Prefer=prefer;
    const r=await fetch(API+path,{method,headers:h,body:body===undefined?undefined:JSON.stringify(body)});
    if(!r.ok) throw new Error("HTTP "+r.status);
    return r.status===204?null:r.json().catch(()=>null);
  }
  const okExp=x=>typeof x==="string"&&/^\d{4}-\d{2}-\d{2}$/.test(x)?x:"";
  let loading=false, everLoaded=false;
  async function refresh(){
    if(loading) return; loading=true;
    try{
      const [es,its]=await Promise.all([api("GET","entries?select=*&order=at.asc&limit=10000"),api("GET","items?select=*")]);
      entries=(es||[]).map(x=>({id:String(x.id),name:String(x.name||""),qty:Number(x.qty)||0,month:String(x.month||""),at:Number(x.at)||0,exp:okExp(x.exp)})).filter(e=>e.name);
      const m=new Map();
      for(const x of its||[]){if(!x.key)continue;
        m.set(String(x.key),{type:TYPES.includes(x.type)?x.type:"",brand:typeof x.brand==="string"?x.brand.slice(0,80):"",per:Number(x.per)>0?Number(x.per):0,price:Number(x.price)>0?Number(x.price):0});}
      itemMap=m; everLoaded=true; $("storeNote").hidden=true; render();
    }catch(e){
      const n=$("storeNote");n.textContent=everLoaded?"Tak dapat sambung ke internet. Nombor mungkin bukan yang terkini; cuba muat semula page.":"Tak dapat muatkan data. Semak internet dan muat semula page.";n.hidden=false;
      if(!everLoaded){$("totals").innerHTML='<tr><td colspan="4" class="empty">Tak dapat muatkan data.</td></tr>';}
    }finally{loading=false;}
  }

  render();
  if(!ONLINE){
    useLocal("Simpanan online belum disambung. Kiraan disimpan dalam browser ni sahaja buat masa ni.");
  }else{
    const w=fn=>async(...a)=>{await fn(...a);await refresh();};
    store={
      add:w(r=>api("POST","entries",{name:r.name,qty:r.qty,month:r.month,at:r.at,exp:r.exp||""},"return=minimal")),
      del:w(id=>api("DELETE","entries?id=eq."+encodeURIComponent(id))),
      upd:w((id,f)=>api("PATCH","entries?id=eq."+encodeURIComponent(id),f,"return=minimal")),
      setItem:w((k,name,f)=>(!f.type&&!f.brand&&!f.per&&!f.price)
        ? api("DELETE","items?key=eq."+encodeURIComponent(k))
        : api("POST","items?on_conflict=key",{key:k,name,type:f.type||"",brand:f.brand||"",per:f.per||0,price:f.price||0},"resolution=merge-duplicates,return=minimal"))
    };
    refresh();
    // Pick up other people's counts: every 20 s while the page is open, and when it comes back to the front.
    setInterval(()=>{if(document.visibilityState==="visible"&&!editing&&!(document.activeElement&&document.activeElement.closest("#info")))refresh();},20000);
    document.addEventListener("visibilitychange",()=>{if(document.visibilityState==="visible")refresh();});
  }
})();
