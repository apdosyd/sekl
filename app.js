import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD5zCOEqEBNUULIxtadn6wNF_QU_PgbOQ0",
  authDomain: "sekl-c6dbf.firebaseapp.com",
  databaseURL: "https://sekl-c6dbf-default-rtdb.firebaseio.com",
  projectId: "sekl-c6dbf",
  storageBucket: "sekl-c6dbf.appspot.com",
  messagingSenderId: "158135231453",
  appId: "1:158135231453:web:d1ddad09b14f2390004c34",
  measurementId: "G-DNBH4Z3ZJ9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Helpers
const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));
function fmt12(d){ let date=(d instanceof Date)?d:new Date(d); let h=date.getHours(), m=String(date.getMinutes()).padStart(2,'0'), s=String(date.getSeconds()).padStart(2,'0'); const ampm=h>=12?'م':'ص'; h=h%12||12; return `${h}:${m}:${s} ${ampm}`; }
function toast(msg){ const el=$('#toast'); el.classList.remove('hidden'); el.innerHTML=msg; clearTimeout(el._t); el._t=setTimeout(()=>el.classList.add('hidden'),2800); }

const BIKE_COUNT=12;
const timers={};

// Render Bikes
function bikeCard(i){
  return `
  <article class="rounded-2xl border dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
    <div class="flex items-center gap-2 mb-3">
      <div class="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 grid place-items-center font-bold">${i}</div>
      <h3 class="text-base font-semibold">العجلة ${i}</h3>
      <span id="status${i}" class="ms-auto text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600">متاحة</span>
    </div>
    <input id="person${i}" class="w-full rounded-xl border mb-2 px-3 py-2 text-sm dark:bg-gray-900" placeholder="👤 اسم المستأجر"/>
    <input id="bike${i}" class="w-full rounded-xl border mb-2 px-3 py-2 text-sm dark:bg-gray-900" placeholder="🚲 اسم العجلة"/>
    <div class="grid grid-cols-2 gap-3">
      <input id="mins${i}" type="number" min="1" class="rounded-xl border px-3 py-2 text-sm dark:bg-gray-900" placeholder="⏱️ المدة (د)"/>
      <div id="return${i}" class="rounded-xl border bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm">—</div>
    </div>
    <div class="mt-4 flex items-center gap-2">
      <button id="start${i}" class="flex-1 rounded-xl bg-blue-600 text-white px-4 py-2 text-sm">▶️ بدء</button>
      <button id="stop${i}" class="flex-1 rounded-xl bg-rose-600 text-white px-4 py-2 text-sm" disabled>⏹️ إنهاء</button>
    </div>
    <div id="cd${i}" class="mt-3 text-sm font-semibold text-gray-700 dark:text-gray-300">الوقت المتبقي: —</div>
  </article>`;
}
function renderGrid(){
  const wrap=$('#bikes'); wrap.innerHTML=Array.from({length:BIKE_COUNT},(_,k)=>bikeCard(k+1)).join('');
  for(let i=1;i<=BIKE_COUNT;i++){
    $('#start'+i).addEventListener('click',()=>startRent(i));
    $('#stop'+i).addEventListener('click',()=>stopRent(i));
  }
}

// Logic
function setDisabled(i,on){
  $('#person'+i).disabled=on; $('#bike'+i).disabled=on; $('#mins'+i).disabled=on;
  $('#start'+i).disabled=on; $('#stop'+i).disabled=!on;
  $('#status'+i).textContent=on?'مؤجرة':'متاحة';
}
function startCountdown(i,end,person,bike){
  const el=$('#cd'+i), ret=$('#return'+i);
  if(timers[i]) clearInterval(timers[i]);
  function tick(){
    const now=Date.now(), diff=Math.floor((end-now)/1000);
    if(diff<=0){ el.textContent=`⏰ انتهى الوقت لـ "${bike}" (${person})`; $('#alarm').play().catch(()=>{}); clearInterval(timers[i]); setDisabled(i,false); ret.textContent='—'; return; }
    const m=Math.floor(diff/60), s=diff%60; el.textContent=`الوقت المتبقي: ${m} دقيقة و ${String(s).padStart(2,'0')} ثانية`; ret.textContent=fmt12(end);
  }
  tick(); timers[i]=setInterval(tick,1000);
}
function stopCountdown(i){ if(timers[i]) clearInterval(timers[i]); timers[i]=null; $('#cd'+i).textContent='الوقت المتبقي: —'; $('#return'+i).textContent='—'; setDisabled(i,false); }

function startRent(i){
  const person=$('#person'+i).value.trim(), bike=$('#bike'+i).value.trim(), mins=parseInt($('#mins'+i).value,10);
  if(!person||!bike||!mins||mins<=0){ toast('⚠️ أدخل البيانات كاملة'); return; }
  const start=Date.now(), end=start+mins*60*1000;
  set(ref(db,'bikes/'+i),{person,bikeName:bike,startTime:start,endTime:end});
  setDisabled(i,true); startCountdown(i,end,person,bike);
}
function stopRent(i){ remove(ref(db,'bikes/'+i)); }

// Realtime bind
function bindRealtime(){
  const bikesRef=ref(db,'bikes');
  onValue(bikesRef,snap=>{
    const data=snap.val()||{}; let rented=0;
    for(let i=1;i<=BIKE_COUNT;i++){
      if(data[i]){ const {person,bikeName,endTime}=data[i]; $('#person'+i).value=person||''; $('#bike'+i).value=bikeName||''; setDisabled(i,true); startCountdown(i,Number(endTime),person,bikeName); rented++; }
      else stopCountdown(i);
    }
    $('#rentedCount').textContent=rented; $('#availableCount').textContent=BIKE_COUNT-rented;
  });
}

// Time & dark
function tickNow(){ $('#now').textContent=fmt12(new Date()); }
$('#toggleDark').onclick=()=>document.documentElement.classList.toggle('dark');
$('#clearAll').onclick=()=>{ if(confirm('مسح كل الحجوزات؟')) remove(ref(db,'bikes')); }
$('#searchBox').addEventListener('input',e=>{ const val=e.target.value.toLowerCase(); $$('#bikes article').forEach(card=>{ card.style.display=card.textContent.toLowerCase().includes(val)?'':'none'; }) });

// Boot
renderGrid(); bindRealtime(); tickNow(); setInterval(tickNow,1000);
