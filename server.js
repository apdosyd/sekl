const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static('public'));

const bikeCount = 12;

// بيانات العجلات مخزنة على السيرفر
let bikes = [];
for(let i=1;i<=bikeCount;i++){
  bikes.push({id:i, person:'', bikeName:'', startTime:0, endTime:0});
}

io.on('connection', socket=>{
  console.log('مستخدم اتصل');

  // أرسل له البيانات الحالية
  socket.emit('updateBikes', bikes);

  // بدء إيجار
  socket.on('startRent', data=>{
    const b = bikes[data.id-1];
    b.person = data.person;
    b.bikeName = data.bikeName;
    b.startTime = data.startTime;
    b.endTime = data.endTime;
    io.emit('updateBikes', bikes);
  });

  // إنهاء إيجار
  socket.on('stopRent', id=>{
    const b = bikes[id-1];
    b.person = '';
    b.bikeName = '';
    b.startTime = 0;
    b.endTime = 0;
    io.emit('stopBike', id);
  });

  socket.on('disconnect', ()=>console.log('مستخدم انفصل'));
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, ()=>console.log(`السيرفر شغال على http://localhost:${PORT}`));
