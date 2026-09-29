import {auth,db} from './firebase-config.js';
import {signInWithEmailAndPassword,sendPasswordResetEmail,signInWithPopup,GoogleAuthProvider,onAuthStateChanged} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js';
import {ref,update} from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import {initLanguage,t} from './common.js';
initLanguage();
const form=document.querySelector('#authForm'),btn=document.querySelector('#authBtn'),msg=document.querySelector('#msg'),reset=document.querySelector('#resetBtn'),googleBtn=document.querySelector('#googleBtn');
btn.textContent=t('loginBtn');
form.onsubmit=async e=>{
 e.preventDefault(); msg.textContent=t('loading'); msg.className='msg';
 try{const email=document.querySelector('#email').value.trim(),password=document.querySelector('#password').value;
 await signInWithEmailAndPassword(auth,email,password); location.href='dashboard.html';
 }catch(err){msg.textContent=err.message;msg.className='msg error';}
};
reset.onclick=async()=>{const e=document.querySelector('#email').value.trim();if(!e){msg.textContent=t('enterEmail');return;}try{await sendPasswordResetEmail(auth,e);msg.textContent=t('passwordResetSent');}catch(x){msg.textContent=x.message;msg.className='msg error'}};
googleBtn.onclick=async()=>{
 msg.textContent=t('loading');msg.className='msg';
 try{const result=await signInWithPopup(auth,new GoogleAuthProvider());const u=result.user;
 await update(ref(db,`shops/${u.uid}/shop`),{email:u.email||'',ownerName:u.displayName||'',photoURL:u.photoURL||'',updatedAt:Date.now()});
 location.href='dashboard.html';
 }catch(err){msg.textContent=err.code==='auth/popup-closed-by-user'?t('googleCancelled'):err.message;msg.className='msg error';}
};
onAuthStateChanged(auth,u=>{if(u&&location.pathname.endsWith('/index.html')) location.href='dashboard.html';});
