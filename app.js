// server.js
const express = require('express');
var cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const app = express();
const port = 3000;

// ตั้งค่าคีย์ลับสำหรับ JWT
const JWT_SECRET_KEY = 'i love nunyu';

// ตั้งค่าการเก็บข้อมูลผู้ใช้ (สำหรับการทดสอบ)
const users = [];

// Middleware
app.use(bodyParser.json());

// Route สำหรับการลงทะเบียนผู้ใช้
app.post('/register', async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  // ตรวจสอบว่าผู้ใช้มีอยู่แล้วหรือไม่
  const existingUser = users.find(user => user.email === email);

  if (existingUser) {
    return res.status(400).json({ message: 'Email already in use' });
  }

  // แฮชรหัสผ่าน
  const hashedPassword = await bcrypt.hash(password, 10);

  // สร้างข้อมูลผู้ใช้ใหม่
  const newUser = { email, password: hashedPassword, firstName, lastName };
  users.push(newUser);

  // สร้าง accessToken
  const accessToken = jwt.sign(
    { email: newUser.email },
    JWT_SECRET_KEY,
    { expiresIn: '1h' } // กำหนดระยะเวลาให้ accessToken หมดอายุ
  );

  // ส่งข้อมูลผู้ใช้และ accessToken กลับไป
  res.status(201).json({ 
    message: 'User registered successfully',
    accessToken 
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
