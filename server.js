const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(express.json());

// إنشاء قاعدة بيانات SQLite
const db = new sqlite3.Database('./bikes.db', (err) => {
  if(err) return console.error(err.message);
  console.log('Connected to SQLite database.');
});

// إنشاء جدول العجلات
db.run(`CREATE TABLE IF NOT EXISTS bikes (
  id INTEGER PRIMARY KEY,
  person TEXT,
  bikeName TEXT,
  startTime INTEGER,
  endTime INTEGER
)`);

// جلب كل العجلات
app.get('/api/bikes', (req, res) => {
  db.all(`SELECT * FROM bikes`, [], (err, rows) => {
    if(err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// إضافة/تحديث إيجار
app.post('/api/bikes/:id', (req, res) => {
  const id = req.params.id;
  const { person, bikeName, startTime, endTime } = req.body;

  db.run(
    `INSERT INTO bikes(id, person, bikeName, startTime, endTime)
     VALUES(?,?,?,?,?)
     ON CONFLICT(id) DO UPDATE SET
       person=excluded.person,
       bikeName=excluded.bikeName,
       startTime=excluded.startTime,
       endTime=excluded.endTime`,
    [id, person, bikeName, startTime, endTime],
    function(err) {
      if(err) return res.status(500).json({error: err.message});
      res.json({success: true});
    }
  );
});

// إنهاء إيجار
app.delete('/api/bikes/:id', (req, res) => {
  const id = req.params.id;
  db.run(`DELETE FROM bikes WHERE id=?`, [id], function(err){
    if(err) return res.status(500).json({error: err.message});
    res.json({success:true});
  });
});

app.listen(port, () => console.log(`Server running at http://localhost:${port}`));