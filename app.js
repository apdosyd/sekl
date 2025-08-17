// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD5zCOEqEBNUULIxtadn6wNF_QU_PgbOQ0", // ضع بيانات Firebase هنا
  authDomain: "sekl-c6dbf.firebaseapp.com",
  databaseURL: "https://sekl-c6dbf-default-rtdb.firebaseio.com",
  projectId: "sekl-c6dbf",
  storageBucket: "sekl-c6dbf.appspot.com",
  messagingSenderId: "158135231453",
  appId: "1:158135231453:web:web:d1ddad09b14f2390004c34"
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

const bikeCount = 25;
const timers = {};
const container = document.getElementById('bikesContainer');

function getLocalTime() { return new Date(); }

function formatTime12(date){
  let h = date.getHours(), m = date.getMinutes().toString().padStart(2,'0');
  const ampm = h>=12?'م':'ص';
  h = h%12||12;
  return `${h}:${m} ${ampm}`;
}

function updateCurrentTime(){
  document.getElementById('currentTime').textContent = `الوقت الحالي: ${formatTime12(getLocalTime())}`;
}
setInterval(updateCurrentTime,1000);
updateCurrentTime();

// إنشاء واجهة العجلات
for(let i=1;i<=bikeCount;i++){
  const div=document.createElement('div');
  div.className='bike-container';
  div.innerHTML=`
    <h3>العجلة رقم ${i}</h3>
    <label>اسم المستأجر:</label>
    <input id="person${i}" placeholder="ادخل اسم المستأجر"/>
    <label>اسم العجلة:</label>
    <input id="bike${i}" placeholder="ادخل اسم العجلة"/>
    <label>مدة الإيجار (بالدقائق):</label>
    <input type="number" id="duration${i}" min="1" placeholder="ادخل مدة الإيجار"/>
    <button onclick="startRent(${i})" id="startBtn${i}">ابدأ الإيجار</button>
    <button onclick="stopRent(${i})" id="stopBtn${i}">إيقاف الإيجار</button>
    <div class="countdown" id="countdown${i}">الوقت المتبقي: -</div>
  `;
  container.appendChild(div);
}

function startRent(i){
  const name=document.getElementById(`person${i}`).value.trim();
  const bike=document.getElementById(`bike${i}`).value.trim();
  const mins=parseInt(document.getElementById(`duration${i}`).value);
  if(!name||!bike||isNaN(mins)||mins<=0){alert("املأ جميع الخانات!");return;}
  const start=getLocalTime();
  const end=new Date(start.getTime()+mins*60*1000);
  database.ref("bikes/"+i).set({person:name,bikeName:bike,startTime:start.getTime(),endTime:end.getTime()});
}

function stopRent(i){ database.ref("bikes/"+i).remove(); }

function updateCountdown(i,endTime,person,bikeName){
  const el=document.getElementById(`countdown${i}`);
  if(timers[i]) clearInterval(timers[i]);
  function tick(){
    const diff=Math.floor((endTime-getLocalTime().getTime())/1000);
    const returnTime=formatTime12(new Date(endTime));
    if(diff<=0){
      el.innerHTML=`انتهى وقت "<strong>${bikeName}</strong>" لـ "<strong>${person}</strong>"!<br>الوقت كان: <strong>${returnTime}</strong>`;
      document.getElementById('alarm').play();
      clearInterval(timers[i]);
      document.getElementById(`startBtn${i}`).disabled=false;
      document.getElementById(`person${i}`).disabled=false;
      document.getElementById(`bike${i}`).disabled=false;
      document.getElementById(`duration${i}`).disabled=false;
      return;
    }
    const m=Math.floor(diff/60), s=diff%60;
    el.innerHTML=`الوقت المتبقي: <strong>${m}</strong> دقيقة و <strong>${s}</strong> ثانية | يرجع الساعة: <strong>${returnTime}</strong>`;
  }
  tick(); timers[i]=setInterval(tick,1000);
}

// مراقبة البيانات من Firebase
database.ref("bikes").on('value',snapshot=>{
  const data=snapshot.val()||{};
  for(let i=1;i<=bikeCount;i++){
    if(data[i]){
      const {person,bikeName,endTime}=data[i];
      document.getElementById(`person${i}`).value=person;
      document.getElementById(`bike${i}`).value=bikeName;
      document.getElementById(`person${i}`).disabled=true;
      document.getElementById(`bike${i}`).disabled=true;
      document.getElementById(`duration${i}`).disabled=true;
      document.getElementById(`startBtn${i}`).disabled=true;
      updateCountdown(i,endTime,person,bikeName);
    }else{
      document.getElementById(`person${i}`).value='';
      document.getElementById(`bike${i}`).value='';
      document.getElementById(`duration${i}`).value='';
      document.getElementById(`person${i}`).disabled=false;
      document.getElementById(`bike${i}`).disabled=false;
      document.getElementById(`duration${i}`).disabled=false;
      document.getElementById(`startBtn${i}`).disabled=false;
      document.getElementById(`countdown${i}`).textContent='الوقت المتبقي: -';
      if(timers[i]){clearInterval(timers[i]);timers[i]=null;}
    }
  }
});
