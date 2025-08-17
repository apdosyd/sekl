// استيراد المكتبات من Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-database.js";

// إعدادات Firebase الخاصة بمشروعك
const firebaseConfig = {
  apiKey: "AIzaSyD5zCOEqEBNUULIxtadn6wNF_QU_PgbOQ0",
  authDomain: "sekl-c6dbf.firebaseapp.com",
  databaseURL: "https://sekl-c6dbf-default-rtdb.firebaseio.com", // مهم جدا
  projectId: "sekl-c6dbf",
  storageBucket: "sekl-c6dbf.appspot.com",
  messagingSenderId: "158135231453",
  appId: "1:158135231453:web:d1ddad09b14f2390004c34",
  measurementId: "G-DNBH4Z3ZJ9"
};

// تهيئة Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const bikeCount = 10; // عدد العجل
const timers = {};
const container = document.getElementById('bikesContainer');

// رسم العجل
for (let i = 1; i <= bikeCount; i++) {
  const div = document.createElement('div');
  div.className = 'bike';
  div.innerHTML = `
    <h3>🚲 عجلة رقم ${i}</h3>
    <label>اسم المستأجر:</label>
    <input id="person${i}" placeholder="اكتب اسمك">
    <label>مدة الإيجار (دقائق):</label>
    <input id="duration${i}" type="number" min="1" placeholder="المدة">
    <button onclick="rentBike(${i})">تأجير</button>
    <button onclick="endRent(${i})">إنهاء</button>
    <div id="status${i}" class="status">الحالة: متاحة</div>
    <div id="countdown${i}" class="countdown"></div>
  `;
  container.appendChild(div);
}

// وظيفة تأجير العجلة
window.rentBike = function (i) {
  const person = document.getElementById(`person${i}`).value.trim();
  const duration = parseInt(document.getElementById(`duration${i}`).value);

  if (!person || isNaN(duration) || duration <= 0) {
    alert("أدخل البيانات بشكل صحيح");
    return;
  }

  const start = Date.now();
  const end = start + duration * 60 * 1000;

  set(ref(db, "bikes/" + i), {
    person,
    start,
    end
  });
};

// وظيفة إنهاء الإيجار
window.endRent = function (i) {
  remove(ref(db, "bikes/" + i));
};

// تحديث الحالة مباشرة عند أي تغيير
onValue(ref(db, "bikes"), (snapshot) => {
  const data = snapshot.val() || {};
  for (let i = 1; i <= bikeCount; i++) {
    const statusEl = document.getElementById(`status${i}`);
    const countdownEl = document.getElementById(`countdown${i}`);

    if (data[i]) {
      const { person, start, end } = data[i];
      statusEl.textContent = `مؤجّرة بواسطة: ${person}`;

      if (timers[i]) clearInterval(timers[i]);
      timers[i] = setInterval(() => {
        const diff = Math.floor((end - Date.now()) / 1000);
        if (diff <= 0) {
          countdownEl.textContent = "انتهى الوقت!";
          clearInterval(timers[i]);
          return;
        }
        const mins = Math.floor(diff / 60);
        const secs = diff % 60;
        countdownEl.textContent = `الوقت المتبقي: ${mins} دقيقة و ${secs} ثانية`;
      }, 1000);

    } else {
      statusEl.textContent = "الحالة: متاحة";
      countdownEl.textContent = "";
      if (timers[i]) clearInterval(timers[i]);
    }
  }
});
