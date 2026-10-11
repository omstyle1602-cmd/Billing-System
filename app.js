const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const inr=n=>'₹'+(+n).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
const SHOP={n:'Om Style Delhi',a:'B-1, Main Ismailpur Road, Jaitpur - 110044',m:'9599126467'};
const TC=['No Return, only Replace within 3 days.','Fashion ke daur me color / kapde ki koi guarantee nahi hai.','Fixed Price, no bargaining.'];
let db={stock:[],inv:[],cnt:0,email:'',auto:0,draft:null};
try{Object.assign(db,JSON.parse(localStorage.getItem('omstyle')||'{}'))}catch(e){}
const save=()=>localStorage.setItem('omstyle',JSON.stringify(db));
const blank=()=>({n:'',q:1,p:0,s:null});
let rows=[blank()],cur=null;
const today=()=>new Date().toLocaleDateString('en-CA');
function toast(m,err){const t=$('#toast');t.textContent=m;t.className='on'+(err?' err':'');clearTimeout(t._t);t._t=setTimeout(()=>t.className='',3200)}

/* tabs */
$('#nv').onclick=e=>{const b=e.target.closest('button');if(!b)return;document.querySelectorAll('.pg').forEach(x=>x.classList.toggle('on',x.id==b.dataset.p));document.querySelectorAll('nav button').forEach(x=>x.classList.toggle('on',x==b));draw()};

/* draft autosave (form data safe even if page refreshes) */
function saveDraft(){db.draft={n:$('#cn').value,p:$('#cp').value,a:$('#ca').value,pm:$('#pm').value,d:$('#dp').value,rows};save()}
document.addEventListener('input',e=>{if(e.target.closest('#b'))saveDraft()});
function loadDraft(){const d=db.draft;if(!d)return;$('#cn').value=d.n;$('#cp').value=d.p;$('#ca').value=d.a;$('#pm').value=d.pm;$('#dp').value=d.d;if(d.rows&&d.rows.length)rows=d.rows}

/* billing */
function addRow(){rows.push(blank());drawRows();saveDraft()}
function delRow(i){rows.splice(i,1);if(!rows.length)rows.push(blank());drawRows();saveDraft()}
function pickItem(i,v){const s=db.stock.find(x=>x.name.toLowerCase()==v.trim().toLowerCase());rows[i].n=v.trim();if(s){rows[i].s=s.id;rows[i].n=s.name;if(s.price)rows[i].p=s.price}else rows[i].s=null;drawRows();saveDraft()}
function drawRows(){
 $('#sl').innerHTML=db.stock.map(s=>`<option value="${esc(s.name)}">${s.qty} in stock</option>`).join('');
 $('#rb').innerHTML=rows.map((r,i)=>{const st=db.stock.find(x=>x.id==r.s);return `<div class="ir">
 <div><input list="sl" value="${esc(r.n)}" placeholder="Item - stock se chuno ya manual likho" onchange="pickItem(${i},this.value)">${st?`<small>Stock: ${st.qty}</small>`:''}</div>
 <input type="number" min="1" value="${r.q}" aria-label="Qty" oninput="rows[${i}].q=+this.value;calc()">
 <input type="number" min="0" value="${r.p}" aria-label="Price" oninput="rows[${i}].p=+this.value;calc()">
 <div class="am" id="am${i}">${inr(r.q*r.p)}</div><button class="btn rm" onclick="delRow(${i})" aria-label="Remove">✕</button></div>`}).join('');calc()}
function tots(){const sub=rows.reduce((a,r)=>a+r.q*r.p,0),d=Math.min(100,Math.max(0,+$('#dp').value||0)),da=sub*d/100;return{sub,d,da,t:sub-da}}
function calc(){const t=tots();rows.forEach((r,i)=>{const e=$('#am'+i);if(e)e.textContent=inr(r.q*r.p)});
 $('#st').textContent=inr(t.sub);$('#da').textContent='- '+inr(t.da);$('#ft').textContent=inr(t.t);
 $('#rn').textContent='OS-'+String(db.cnt+1).padStart(4,'0');$('#rc').textContent=$('#cn').value||'Customer name';
 $('#rl').innerHTML=rows.filter(r=>r.n&&r.q>0).map(r=>`<div><span>${esc(r.n)} × ${r.q}</span><b>${inr(r.q*r.p)}</b></div>`).join('')||'<p class="em">Items add karo</p>'}

async function gen(){
 const name=$('#cn').value.trim(),ph=$('#cp').value.replace(/\D/g,'').slice(-10),items=rows.filter(r=>r.n.trim()&&r.q>0);
 if(!name||ph.length!=10)return toast('Customer name aur 10 digit mobile number daalo',1);
 if(!items.length)return toast('Kam se kam ek item add karo',1);
 for(const r of items){const s=db.stock.find(x=>x.id==r.s);if(s&&r.q>s.qty)return toast(r.n+': stock me sirf '+s.qty+' bacha hai',1)}
 const t=tots(),empty=[];
 items.forEach(r=>{const s=db.stock.find(x=>x.id==r.s);if(s){s.qty-=r.q;if(s.qty==0)empty.push(s)}});
 db.cnt++;const no='OS-'+String(db.cnt).padStart(4,'0');
 cur={no,date:new Date().toLocaleString('en-IN'),day:today(),name,ph,addr:$('#ca').value.trim(),pay:$('#pm').value,items:items.map(r=>({n:r.n,q:r.q,p:r.p})),sub:t.sub,d:t.d,da:t.da,t:t.t};
 db.inv.unshift(cur);rows=[blank()];['cn','cp','ca'].forEach(i=>$('#'+i).value='');$('#dp').value=0;db.draft=null;save();drawRows();
 empty.forEach(s=>mail(s));
 $('#mn').textContent=no;$('#wp').value=ph;
 $('#wm').value=`Welcome to ${SHOP.n}! 🙏\nNamaste ${name},\nAapki khareedari ke liye dhanyavaad.\n\nInvoice No: ${no}\nTotal Amount: ${inr(cur.t)}\n\nBill PDF attached hai.\nTerms: No Return, only Replace within 3 days. Fixed Price.\n\n📞 ${SHOP.m} | ${SHOP.a}\nPhir padharein! 😊`;
 $('#sv').textContent='';$('#md').style.display='flex';
 const ok=await toFolder(cur);
 $('#sv').textContent=ok?'✔ Saved: '+cur.day+' / '+no+'.pdf (folder me) + OmStyle_Data.xlsx updated':'Folder auto-save off hai (Settings me folder chuno). Data browser me save hai.';
 if(db.auto)xl();
}

/* auto-save folder (File System Access API) */
const idb=()=>new Promise((res,rej)=>{const r=indexedDB.open('omfs',1);r.onupgradeneeded=()=>r.result.createObjectStore('h');r.onsuccess=()=>res(r.result);r.onerror=rej});
async function hget(){try{const d=await idb();return await new Promise(r=>{const q=d.transaction('h').objectStore('h').get('dir');q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}catch(e){return null}}
async function hset(h){const d=await idb();d.transaction('h','readwrite').objectStore('h').put(h,'dir')}
async function put(d,n,b){const f=await d.getFileHandle(n,{create:true}),w=await f.createWritable();await w.write(b);await w.close()}
async function chooseFolder(){if(!window.showDirectoryPicker)return toast('Is browser me folder save nahi hota. Computer pe Chrome / Edge use karo.',1);
 try{const h=await showDirectoryPicker({mode:'readwrite'});await hset(h);$('#fn').textContent=h.name;toast('Folder set: '+h.name)}catch(e){}}
async function toFolder(v){const h=await hget();if(!h)return false;
 try{const o={mode:'readwrite'};if(await h.queryPermission(o)!=='granted'&&await h.requestPermission(o)!=='granted')return false;
  const day=await h.getDirectoryHandle(v.day||today(),{create:true});
  await put(day,v.no+'_'+v.name.replace(/[^\w]+/g,'_')+'.pdf',pdf(v).output('blob'));
  await put(h,'OmStyle_Data.xlsx',new Blob([XLSX.write(book(),{bookType:'xlsx',type:'array'})]));return true}catch(e){return false}}

/* stock */
function addStock(){const n=$('#sn').value.trim(),q=+$('#sq').value,p=+$('#sp').value||0;if(!n||q<1)return toast('Item name aur quantity daalo',1);
 const s=db.stock.find(x=>x.name.toLowerCase()==n.toLowerCase());if(s){s.qty+=q;if(p)s.price=p}else db.stock.push({id:Date.now(),name:n,qty:q,price:p});
 save();$('#sn').value='';$('#sp').value='';$('#sq').value=1;drawStock();toast('Stock updated')}
function chg(id,sign){const s=db.stock.find(x=>x.id==id),n=Math.max(1,+$('#k'+id).value||1),was=s.qty;s.qty=Math.max(0,s.qty+sign*n);save();if(was>0&&s.qty==0)mail(s);drawStock()}
function delStock(id){if(confirm('Item delete karna hai?')){db.stock=db.stock.filter(x=>x.id!=id);save();drawStock()}}
function drawStock(){$('#sb').innerHTML=db.stock.map(s=>`<tr><td><b>${esc(s.name)}</b></td><td>${inr(s.price)}</td><td><b>${s.qty}</b></td>
 <td><span class="bd ${s.qty==0?'no':s.qty<=3?'lo':'ok'}">${s.qty==0?'Out of stock':s.qty<=3?'Low':'In stock'}</span></td>
 <td style="white-space:nowrap"><input id="k${s.id}" type="number" min="1" value="1" style="width:62px;display:inline-block"> <button class="btn ghost s" onclick="chg(${s.id},1)">+ Add</button> <button class="btn rm s" onclick="chg(${s.id},-1)">− Remove</button></td>
 <td><button class="btn ghost s" onclick="delStock(${s.id})" aria-label="Delete">🗑</button></td></tr>`).join('')||'<tr><td colspan="6">Stock khali hai. Upar se pehla item add karo.</td></tr>'}

/* mail + settings */
async function mail(s,test){if(!db.email)return test?toast('Pehle email save karo',1):0;
 try{const r=await fetch('https://formsubmit.co/ajax/'+encodeURIComponent(db.email),{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},
 body:JSON.stringify({_subject:'OUT OF STOCK - '+s.name+' ('+SHOP.n+')',_captcha:'false',Item:s.name,Message:'Out of stock: "'+s.name+'" ka stock 0 ho gaya hai. Naya stock mangwayein.'})});
 if(test)toast(r.ok?'Test mail bheji (pehli baar confirmation mail activate karo)':'Mail fail hui',!r.ok)}catch(e){if(test)toast('Mail fail: internet check karo',1)}}
function saveSet(){db.email=$('#em').value.trim();db.auto=+$('#au').value;save();toast('Settings saved')}

/* whatsapp + pdf */
function pdf(v){
 const D=new jspdf.jsPDF(),W=210;D.setFillColor(27,31,59);D.rect(0,0,W,34,'F');D.setFillColor(242,169,0);D.rect(0,34,W,2,'F');
 D.setTextColor(255,255,255);D.setFontSize(22);D.setFont(undefined,'bold');D.text(SHOP.n.toUpperCase(),W/2,14,{align:'center'});
 D.setFontSize(9.5);D.setFont(undefined,'normal');D.text(SHOP.a,W/2,22,{align:'center'});D.text('Mobile: '+SHOP.m,W/2,28,{align:'center'});
 D.setTextColor(27,31,59);D.setFontSize(11);D.setFont(undefined,'bold');D.text('INVOICE',14,46);D.setFont(undefined,'normal');
 D.text('Invoice No: '+v.no,14,53);D.text('Date: '+v.date,14,59);
 D.text('Customer: '+v.name,120,53);D.text('Mobile: '+v.ph,120,59);if(v.addr)D.text('Address: '+v.addr.slice(0,40),120,65);
 D.autoTable({startY:71,head:[['#','Item Description','Qty','Price (Rs.)','Amount (Rs.)']],body:v.items.map((r,i)=>[i+1,r.n,r.q,r.p.toFixed(2),(r.q*r.p).toFixed(2)]),
  headStyles:{fillColor:[27,31,59]},styles:{fontSize:10},columnStyles:{2:{halign:'center'},3:{halign:'right'},4:{halign:'right'}}});
 let y=D.lastAutoTable.finalY+8;D.setFontSize(11);
 D.text('Subtotal:',130,y);D.text('Rs. '+v.sub.toFixed(2),196,y,{align:'right'});y+=7;
 D.text('Discount ('+v.d+'%):',130,y);D.text('- Rs. '+v.da.toFixed(2),196,y,{align:'right'});y+=3;D.setDrawColor(242,169,0);D.line(128,y,196,y);y+=7;
 D.setFont(undefined,'bold');D.setFontSize(14);D.text('Final Amount:',130,y);D.text('Rs. '+v.t.toFixed(2),196,y,{align:'right'});y+=6;
 D.setFontSize(10);D.setFont(undefined,'normal');D.text('Payment: '+v.pay,130,y);
 y=Math.max(y+16,230);if(y>250){D.addPage();y=20}
 D.setFont(undefined,'bold');D.setFontSize(11);D.text('Terms & Conditions',14,y);D.setFont(undefined,'normal');D.setFontSize(10);
 TC.forEach((t,i)=>D.text((i+1)+'. '+t,14,y+7+i*6));
 D.setTextColor(194,24,91);D.setFont(undefined,'bold');D.text('Thank you! Visit Again - '+SHOP.n,W/2,285,{align:'center'});return D}
const dl=()=>pdf(cur).save(cur.no+'.pdf');
async function wa(){const ph='91'+$('#wp').value.replace(/\D/g,'').slice(-10),msg=$('#wm').value,D=pdf(cur),f=new File([D.output('blob')],cur.no+'.pdf',{type:'application/pdf'});
 if(navigator.canShare&&navigator.canShare({files:[f]})){try{await navigator.share({files:[f],text:msg});return}catch(e){if(e.name=='AbortError')return}}
 D.save(cur.no+'.pdf');window.open('https://wa.me/'+ph+'?text='+encodeURIComponent(msg),'_blank');toast('PDF download ho gayi - WhatsApp chat me attach (📎) karke bhejo')}
function reopen(i){cur=db.inv[i];$('#mn').textContent=cur.no;$('#wp').value=cur.ph;$('#sv').textContent='';
 $('#wm').value=`Welcome to ${SHOP.n}! 🙏\nInvoice No: ${cur.no}\nTotal Amount: ${inr(cur.t)}\nBill PDF attached hai.\n📞 ${SHOP.m}`;$('#md').style.display='flex'}

/* history + excel */
function drawHist(){const td=db.inv.filter(v=>v.day==today());
 $('#stt').innerHTML=`<div><small>Aaj ke bills</small><b>${td.length}</b></div><div><small>Aaj ki sale</small><b>${inr(td.reduce((a,v)=>a+v.t,0))}</b></div><div><small>Total sale</small><b>${inr(db.inv.reduce((a,v)=>a+v.t,0))}</b></div>`;
 $('#hb').innerHTML=db.inv.map((v,i)=>`<tr><td><b>${esc(v.no)}</b></td><td>${esc(v.date)}</td><td>${esc(v.name)}<div class="sm">${esc(v.ph)}</div></td><td><b>${inr(v.t)}</b></td><td style="white-space:nowrap"><button class="btn ghost s" onclick="cur=db.inv[${i}];dl()">PDF</button> <button class="btn wa s" onclick="reopen(${i})">WhatsApp</button></td></tr>`).join('')||'<tr><td colspan="5">Abhi koi invoice nahi.</td></tr>'}
function book(only){const wb=XLSX.utils.book_new(),m={};
 db.inv.slice().reverse().forEach(v=>{const c=m[v.ph]||(m[v.ph]={'Name':v.name,'Mobile':v.ph,'Address':v.addr,'Total Bills':0,'Total Spent':0,'Last Bill':''});c.Name=v.name;if(v.addr)c.Address=v.addr;c['Total Bills']++;c['Total Spent']+=v.t;c['Last Bill']=v.date});
 const add=(n,a)=>XLSX.utils.book_append_sheet(wb,XLSX.utils.json_to_sheet(a.length?a:[{}]),n);
 add('Customers',Object.values(m));
 if(only!='c'){
  add('Invoices',db.inv.map(v=>({'Invoice No':v.no,'Date':v.date,'Customer':v.name,'Mobile':v.ph,'Address':v.addr,'Subtotal':v.sub,'Discount %':v.d,'Discount Amt':v.da,'Final Amount':v.t,'Payment':v.pay})));
  add('Invoice Items',db.inv.flatMap(v=>v.items.map(r=>({'Invoice No':v.no,'Customer':v.name,'Item':r.n,'Qty':r.q,'Price':r.p,'Amount':r.q*r.p}))));
  add('Stock',db.stock.map(s=>({'Item':s.name,'Qty':s.qty,'Price':s.price})))}
 return wb}
const xl=only=>XLSX.writeFile(book(only),only=='c'?'OmStyle_Customers.xlsx':'OmStyle_Data.xlsx');

async function draw(){drawRows();drawStock();drawHist();$('#em').value=db.email;$('#au').value=db.auto;const h=await hget();if(h)$('#fn').textContent=h.name}
loadDraft();draw();
