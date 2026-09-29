import {db,cleanMobile} from './firebase-config.js';
import {ref,get,push,set,update,onValue} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import {requireAuth,today,money,esc,initLanguage,t,compressImage} from './common.js';
initLanguage();

let uid,cid,customer,mode='credit',shop={};

requireAuth(async u=>{
 uid=u.uid; cid=new URLSearchParams(location.search).get('id');
 if(!cid)return location.href='customers.html';
 onValue(ref(db,`shops/${uid}/customers/${cid}`),snap=>{
   customer=snap.val();
   if(!customer)return location.href='customers.html';
   render();
 });
 onValue(ref(db,`shops/${uid}/shop`),snap=>{shop=snap.val()||{}; if(customer) render();});
});

function calc(){
 let cr=0,pa=0;
 Object.values(customer?.transactions||{}).forEach(x=>x.type==='credit'?cr+=Number(x.amount)||0:pa+=Number(x.amount)||0);
 return{cr,pa,due:cr-pa};
}
function dt(ts,date){
 const d=ts?new Date(ts):new Date((date||today())+'T00:00:00');
 return d.toLocaleString(getLang()==='ne'?'ne-NP':'en-IN',{dateStyle:'short',timeStyle:'short',hour12:true});
}
function getLang(){return localStorage.getItem('khata_lang')||'en'}

async function syncPortal(){
 if(!customer?.customerAccessKey)return;
 const existing=(await get(ref(db,`customerAccess/${customer.customerAccessKey}`))).val()||{};
 const account={name:customer.name||'',mobile:customer.mobile||'',address:customer.address||'',email:customer.email||'',notes:customer.notes||'',photo:customer.photo||'',transactions:customer.transactions||{},notifications:customer.notifications||{},updatedAt:Date.now()};
 await set(ref(db,`customerAccess/${customer.customerAccessKey}`),{
   enabled:customer.online!==false,
   updatedAt:Date.now(),
   shops:{...(existing.shops||{}),[uid]:{
     ...(existing.shops?.[uid]||{}),
     shopName:shop.shopName||t('shop'),shopPhoto:shop.shopPhoto||'',
     customerId:cid,account
   }}
 });
}
function render(){
 const x=calc();
 document.querySelector('#credit').textContent=money(x.cr);
 document.querySelector('#paid').textContent=money(x.pa);
 document.querySelector('#due').textContent=money(x.due);
 document.querySelector('#customerHead').innerHTML=`<div><p class="eyebrow">${t('customerLedger')}</p><div class="customer-headline"><div class="avatar customer-photo large">${customer.photo?`<img src="${esc(customer.photo)}" alt="">`:esc((customer.name||'?')[0].toUpperCase())}</div><div><h1>${esc(customer.name)}</h1><p>📱 ${esc(customer.mobile)} ${customer.address?` • 📍 ${esc(customer.address)}`:''}</p></div></div><div class="top-right customer-pin-owner"><span class="portal-badge">${x.due>0?t('due'):t('paid')}</span><span class="pin-owner">🔐 ${t('pin')}: <b id="ownerPin">••••••</b> <button class="ghost small-action" id="toggleOwnerPin" type="button">${t('showPin')}</button></span></div></div>`;
 const toggle=document.querySelector('#toggleOwnerPin');
 if(toggle)toggle.onclick=()=>{const el=document.querySelector('#ownerPin');const shown=el.textContent!=='••••••';el.textContent=shown?'••••••':(customer.customerPin||'—');toggle.textContent=shown?t('showPin'):t('hidePin')};
 const rows=Object.entries(customer.transactions||{}).sort((a,b)=>(b[1].createdAt||0)-(a[1].createdAt||0)).map(([id,x])=>{
   const qty=Number(x.qty)||1,unit=x.unit||'pcs',mrp=x.type==='credit'?(Number(x.mrp)||((Number(x.amount)||0)/qty)):0;
   return `<tr><td>${esc(dt(x.createdAt,x.date))}</td><td>${esc(x.item||t('payment'))}</td><td>${x.type==='credit'?money(mrp):'—'}</td><td>${x.type==='credit'?esc(`${qty} ${unit}`):'—'}</td><td class="${x.type==='credit'?'credit':'paid'}">${x.type==='credit'?money(x.amount):'-'+money(x.amount)}</td></tr>`
 }).join('');
 document.querySelector('#entries').innerHTML=`<table><thead><tr><th>${t('dateTime')}</th><th>${t('item')}</th><th>${t('mrp')}</th><th>${t('quantity')}</th><th>${t('total')}</th></tr></thead><tbody>${rows||`<tr><td colspan="5" class="empty">${t('noTransactions')}</td></tr>`}</tbody></table>`;
 setupEdit();
}

function setupEdit(){
 const btn=document.querySelector('#editCustomerBtn'); if(!btn||btn.dataset.bound)return;
 btn.dataset.bound='1';
 btn.onclick=()=>{
   document.querySelector('#editName').value=customer.name||'';
   document.querySelector('#editMobile').value=customer.mobile||'';
   document.querySelector('#editAddress').value=customer.address||'';
   document.querySelector('#editEmail').value=customer.email||'';
   document.querySelector('#editNotes').value=customer.notes||'';
   document.querySelector('#editPhotoPreviewWrap').innerHTML=customer.photo?`<img class="photo-preview" src="${esc(customer.photo)}">`:'';
   document.querySelector('#editCustomerMsg').textContent='';
   document.querySelector('#editCustomerModal').classList.remove('hidden');
 };
 document.querySelector('#editCustomerClose').onclick=()=>document.querySelector('#editCustomerModal').classList.add('hidden');
 const form=document.querySelector('#editCustomerForm');
 form.onsubmit=async e=>{
   e.preventDefault();
   const msg=document.querySelector('#editCustomerMsg'); msg.textContent='Saving...';
   try{
     const oldMobile=cleanMobile(customer.mobile), newMobile=cleanMobile(document.querySelector('#editMobile').value);
     if(newMobile.length<7)throw new Error('Enter a valid mobile number.');
     if(newMobile!==oldMobile){
       const cs=(await get(ref(db,`shops/${uid}/customers`))).val()||{};
       if(Object.entries(cs).some(([id,c])=>id!==cid&&cleanMobile(c.mobile)===newMobile))throw new Error('This mobile number is already used by another customer.');
     }
     let photo=customer.photo||'';
     const file=document.querySelector('#editPhoto').files?.[0]; if(file)photo=await compressImage(file);
     const patch={name:document.querySelector('#editName').value.trim(),mobile:newMobile,address:document.querySelector('#editAddress').value.trim(),email:document.querySelector('#editEmail').value.trim(),notes:document.querySelector('#editNotes').value.trim(),photo,updatedAt:Date.now()};
     await update(ref(db,`shops/${uid}/customers/${cid}`),patch);
     if(newMobile!==oldMobile){
       const oldHash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(oldMobile));
       const newHash=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(newMobile));
       const hex=a=>[...new Uint8Array(a)].map(b=>b.toString(16).padStart(2,'0')).join('');
       const oldH=hex(oldHash),newH=hex(newHash);
       const pin=customer.customerPin||String(Math.floor(100000+Math.random()*900000));
       const newKey=await hashText(newMobile+'|'+pin);
       const oldKey=customer.customerAccessKey;
       const updates={};
       updates[`customerIndex/${oldH}/${uid}`]=null;
       updates[`customerIndex/${newH}/${uid}`]={shopName:shop.shopName||t('shop'),shopPhoto:shop.shopPhoto||'',accessKey:newKey,enabled:customer.online!==false};
       if(oldKey&&oldKey!==newKey)updates[`customerAccess/${oldKey}`]=null;
       updates[`customerAccess/${newKey}`]={enabled:customer.online!==false,updatedAt:Date.now(),shops:{[uid]:{shopName:shop.shopName||t('shop'),shopPhoto:shop.shopPhoto||'',customerId:cid,account:{...customer,...patch,mobile:newMobile,customerAccessKey:newKey,transactions:customer.transactions||{},notifications:customer.notifications||{}}}}};
       await update(ref(db),updates);
       await update(ref(db,`shops/${uid}/customers/${cid}`),{customerAccessKey:newKey,customerPin:pin,customerPinHash:await hashText(pin)});
     }else await syncPortal();
     msg.textContent='Customer details updated in real time.';
     setTimeout(()=>document.querySelector('#editCustomerModal').classList.add('hidden'),500);
   }catch(err){msg.textContent=err.message;msg.className='msg error'}
 };
}

function openModal(m){mode=m;document.querySelector('#modalTitle').textContent=m==='credit'?t('addCredit'):t('addPayment');document.querySelector('#item').value=m==='credit'?'':t('paymentNote');document.querySelector('#qtyWrap').classList.toggle('hidden',m!=='credit');document.querySelector('#mrpWrap').classList.toggle('hidden',m!=='credit');document.querySelector('#totalLabel').textContent=m==='credit'?t('total'):t('amount');document.querySelector('#modal').classList.remove('hidden');document.querySelector('#date').value=today();document.querySelector('#mrp').value='';document.querySelector('#amount').value='';document.querySelector('#qty').value='1';updateTotal()}
function updateTotal(){const mrp=Number(document.querySelector('#mrp').value)||0,qty=Number(document.querySelector('#qty').value)||0,total=document.querySelector('#amount');if(mode==='credit'){const unit=document.querySelector('#unit')?.value||'pcs';total.value=mrp>0&&qty>0?(unit==='gm'?mrp*qty/1000:unit==='kg'?mrp*qty:mrp*qty).toFixed(2):''}}
document.querySelector('#entryBtn').onclick=()=>openModal('credit');document.querySelector('#paymentBtn').onclick=()=>openModal('payment');document.querySelector('#close').onclick=()=>document.querySelector('#modal').classList.add('hidden');document.querySelector('#mrp').oninput=updateTotal;document.querySelector('#qty').oninput=updateTotal;

document.querySelector('#entryForm').onsubmit=async e=>{
 e.preventDefault();const item=document.querySelector('#item').value.trim()||t('paymentNote'),qty=Number(document.querySelector('#qty').value)||1,mrp=Number(document.querySelector('#mrp').value)||0,unit=document.querySelector('#unit')?.value||'pcs',amount=mode==='credit'?(unit==='gm'?mrp*qty/1000:unit==='kg'?mrp*qty:mrp*qty):Number(document.querySelector('#amount').value);
 if(!(amount>0)|| (mode==='credit' && !(mrp>0&&qty>0)))return;
 const id=push(ref(db,`shops/${uid}/customers/${cid}/transactions`)).key,createdAt=Date.now();
 await set(ref(db,`shops/${uid}/customers/${cid}/transactions/${id}`),{type:mode,item,qty:mode==='credit'?qty:0,unit:mode==='credit'?unit:'',mrp:mode==='credit'?mrp:0,amount,total:amount,date:document.querySelector('#date').value,createdAt});
 const notificationId=push(ref(db,`shops/${uid}/customers/${cid}/notifications`)).key;
 await set(ref(db,`shops/${uid}/customers/${cid}/notifications/${notificationId}`),{title:mode==='credit'?t('newTransaction'):t('paymentReceived'),message:mode==='credit'?`${item} • ${t('mrp')}: ${money(mrp)} • ${t('quantity')}: ${qty} • ${money(amount)}`:`${money(amount)} ${t('paymentReceived')}`,createdAt,read:false,type:mode==='credit'?'transaction':'payment'});
 await syncPortal();
 document.querySelector('#modal').classList.add('hidden');
};

const notifyBtn=document.querySelector('#notifyBtn');if(notifyBtn)notifyBtn.onclick=()=>document.querySelector('#notifyModal').classList.remove('hidden');
const notifyClose=document.querySelector('#notifyClose');if(notifyClose)notifyClose.onclick=()=>document.querySelector('#notifyModal').classList.add('hidden');
const notifyForm=document.querySelector('#notifyForm');if(notifyForm)notifyForm.onsubmit=async e=>{e.preventDefault();const title=document.querySelector('#notifyTitle').value.trim()||t('notification');const message=document.querySelector('#notifyMessage').value.trim();if(!message)return;const id=push(ref(db,`shops/${uid}/customers/${cid}/notifications`)).key;await set(ref(db,`shops/${uid}/customers/${cid}/notifications/${id}`),{title,message,createdAt:Date.now(),read:false,type:'custom'});await syncPortal();notifyForm.reset();document.querySelector('#notifyModal').classList.add('hidden');alert(t('notificationSent'))};
window.addEventListener('languageChanged',()=>location.reload());

async function hashText(text){const data=new TextEncoder().encode(text),h=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('')}
