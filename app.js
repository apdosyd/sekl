import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, set, onValue, remove } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyD5zCOEqEBNUULIxtadn6wNF_QU_PgbOQ0",
  authDomain: "sekl-c6dbf.firebaseapp.com",
  databaseURL: "https://sekl-c6dbf-default-rtdb.firebaseio.com", // مهم جدًا
  projectId: "sekl-c6dbf",
  storageBucket: "sekl-c6dbf.appspot.com",
  messagingSenderId: "158135231453",
  appId: "1:158135231453:web:d1ddad09b14f2390004c34"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const bikeCount = 5;
const bikesDiv = document.getElementById("bikes");

for (let i = 1; i <= bikeCount; i++) {
  const div = document.createElement("div");
  div.className = "bike available";
  div.id = "bike-" + i;
  div.innerHTML = `
    <h3>العجلة ${i}</h3>
    <input id="name-${i}" placeholder="اسم المستأجر">
    <button onclick="rent(${i})">تأجير</button>
    <button onclick="finish(${i})">إنهاء</button>
    <p id="status-${i}">متاحة</p>
  `;
  bikesDiv.appendChild(div);
}

window.rent = function(i) {
  const name = document.getElementById(`name-${i}`).value;
  if (!name) return alert("ادخل الاسم أولاً");

  set(ref(db, "bikes/" + i), {
    renter: name,
    status: "rented"
  });
};

window.finish = function(i) {
  remove(ref(db, "bikes/" + i));
};

onValue(ref(db, "bikes"), snapshot => {
  const data = snapshot.val() || {};
  for (let i = 1; i <= bikeCount; i++) {
    const bikeEl = document.getElementById("bike-" + i);
    const statusEl = document.getElementById("status-" + i);

    if (data[i]) {
      bikeEl.className = "bike rented";
      statusEl.textContent = `مستأجرة بواسطة: ${data[i].renter}`;
    } else {
      bikeEl.className = "bike available";
      statusEl.textContent = "متاحة";
    }
  }
});
