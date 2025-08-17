const socket = io();

const bikeCount = 12;
const container = document.getElementById('bikesContainer');
const timers = {};

for (let i = 1; i <= bikeCount; i++) {
  const div = document.createElement('div');
  div.className = 'bike-container';
  div.id = `bikeDiv${i}`;
  div.innerHTML = `
    <h3>العجلة ${i}</h3>
    <input id="person${i}" placeholder="اسم المستأجر" />
    <input id="bike${i}" placeholder="اسم العجلة" />
    <input id="duration${i}" type="number" min="1" placeholder="مدة الإيجار بالدقائق" />
    <button id="start${i}">▶️ بدء الإيجار</button>
    <button id="stop${i}" disabled>⏹️ إنهاء</button>
    <div class="countdown" id="countdown${i}">الوقت المتبقي: -</div>
  `;
  container.appendChild(div);

  document.getElementById(`start${i}`).onclick = ()=>{
    const person = document.getElementById(`person${i}`).value.trim();
    const bikeName = document.getElementById(`bike${i}`).value.trim();
    const duration = parseInt(document.getElementById(`duration${i}`).value);

    if(!person || !bikeName || isNaN(duration) || duration <=0){
      alert('املأ كل الخانات بشكل صحيح');
      return;
    }

    const startTime = Date.now();
    const endTime = startTime + duration*60*1000;

    socket.emit('startRent', {id:i, person, bikeName, startTime, endTime});
  };

  document.getElementById(`stop${i}`).onclick = ()=>{
    socket.emit('stopRent', i);
  };
}

// تحديث العجلات عند استقبال البيانات من السيرفر
socket.on('updateBikes', bikes=>{
  bikes.forEach(b=>{
    const personInput = document.getElementById(`person${b.id}`);
    const bikeInput = document.getElementById(`bike${b.id}`);
    const durationInput = document.getElementById(`duration${b.id}`);
    const startBtn = document.getElementById(`start${b.id}`);
    const stopBtn = document.getElementById(`stop${b.id}`);

    personInput.value = b.person;
    bikeInput.value = b.bikeName;

    if(b.endTime > Date.now()){
      startBtn.disabled = true;
      stopBtn.disabled = false;
      updateCountdown(b.id, b.endTime, b.person, b.bikeName);
    } else {
      startBtn.disabled = false;
      stopBtn.disabled = true;
      document.getElementById(`countdown${b.id}`).textContent = 'الوقت المتبقي: -';
      if(timers[b.id]) clearInterval(timers[b.id]);
    }
  });
});

socket.on('stopBike', id=>{
  const personInput = document.getElementById(`person${id}`);
  const bikeInput = document.getElementById(`bike${id}`);
  const startBtn = document.getElementById(`start${id}`);
  const stopBtn = document.getElementById(`stop${id}`);
  personInput.value = '';
  bikeInput.value = '';
  document.getElementById(`countdown${id}`).textContent = 'الوقت المتبقي: -';
  startBtn.disabled = false;
  stopBtn.disabled = true;
  if(timers[id]) clearInterval(timers[id]);
});

function updateCountdown(id, endTime, person, bikeName){
  const countdownEl = document.getElementById(`countdown${id}`);
  if(timers[id]) clearInterval(timers[id]);

  function tick(){
    const diff = Math.floor((endTime - Date.now())/1000);
    if(diff <=0){
      countdownEl.textContent = `انتهى وقت إيجار "${bikeName}" للمستأجر "${person}"`;
      document.getElementById('alarm').play();
      clearInterval(timers[id]);
      document.getElementById(`start${id}`).disabled = false;
      document.getElementById(`stop${id}`).disabled = true;
      return;
    }
    const mins = Math.floor(diff/60);
    const secs = diff % 60;
    countdownEl.textContent = `الوقت المتبقي: ${mins} دقيقة و ${secs} ثانية`;
  }

  tick();
  timers[id] = setInterval(tick,1000);
}

// تحديث الساعة
const nowEl = document.getElementById('now');
setInterval(()=>{
  const d = new Date();
  nowEl.textContent = d.toLocaleTimeString();
},1000);
