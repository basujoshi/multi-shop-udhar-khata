import {db,cleanMobile} from './firebase-config.js';
import {ref,get,push,set,update} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import {requireAuth,compressImage,initLanguage,t,esc} from './common.js';
initLanguage();
const makePin=()=>String(Math.floor(100000+Math.random()*900000));
const hashText=async text=>{const data=new TextEncoder().encode(text);const hash=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(hash)].map(b=>b.toString(16).padStart(2,'0')).join('')};
const indexHash=m=>hashText(cleanMobile(m));
requireAuth(u=>document.querySelector('#customerForm').onsubmit=async e=>{
 e.preventDefault();const msg=document.querySelector('#msg');msg.textContent=t('loading');msg.className='msg';
 try{
  const m=cleanMobile(document.querySelector('#mobile').value);
  if(m.length<7) throw new Error('Enter a valid mobile number.');
  const customers=(await get(ref(db,`shops/${u.uid}/customers`))).val()||{};
  if(Object.values(customers).some(c=>cleanMobile(c.mobile)===m)) throw new Error('This mobile number is already registered in this shop.');
  const pin=makePin(),id=push(ref(db,`shops/${u.uid}/customers`)).key,online=document.querySelector('#online').checked;
  const photoFile=document.querySelector('#customerPhoto')?.files?.[0];let photo='';
  if(photoFile) photo=await compressImage(photoFile);
  const accessKey=await hashText(m+'|'+pin);
  const c={name:document.querySelector('#name').value.trim(),mobile:m,address:document.querySelector('#address').value.trim(),email:document.querySelector('#email').value.trim(),notes:document.querySelector('#notes').value.trim(),online,customerPin:pin,customerPinHash:await hashText(pin),customerAccessKey:accessKey,photo,transactions:{},notifications:{},createdAt:Date.now()};
  await set(ref(db,`shops/${u.uid}/customers/${id}`),c);
  const shop=(await get(ref(db,`shops/${u.uid}/shop`))).val()||{};
  const ih=await indexHash(m);
  await update(ref(db),{[`customerIndex/${ih}/${u.uid}`]:{shopName:shop.shopName||t('shop'),shopPhoto:shop.shopPhoto||'',accessKey,enabled:online}});
  if(online) await set(ref(db,`customerAccess/${accessKey}`),{enabled:true,shops:{[u.uid]:{shopName:shop.shopName||t('shop'),shopPhoto:shop.shopPhoto||'',customerId:id,account:{name:c.name,mobile:c.mobile,address:c.address,photo:c.photo,transactions:{},notifications:{}}}}});
  document.querySelector('#pinCode').textContent=pin;document.querySelector('#pinBox').classList.remove('hidden');document.querySelector('#customerForm').classList.add('hidden');
  msg.textContent=t('created');msg.className='msg';
  document.querySelector('#copyPin').onclick=async()=>{await navigator.clipboard.writeText(pin);document.querySelector('#copyPin').textContent=t('copied')};
  document.querySelector('#openCustomer').href=`customer.html?id=${encodeURIComponent(id)}`;
 }catch(x){msg.textContent=x.message;msg.className='msg error'}
});
window.addEventListener('languageChanged',()=>location.reload());
