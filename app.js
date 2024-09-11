const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise'); // ใช้ mysql2/promise เพื่อรองรับ async/await
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// ตั้งค่าคีย์ลับสำหรับ JWT
const JWT_SECRET_KEY = 'i love you nunyu';

var app = express();
var jsonParser = bodyParser.json();

app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/register', jsonParser, async function (req, res, next) {
  try {
    let { email, password, firstName, lastName } = req.body; // รับข้อมูลจาก request body
    console.log({ email, password, firstName, lastName });

    // สร้างการเชื่อมต่อกับฐานข้อมูล
    const connection = await mysql.createConnection({
      host: 'thsv89.hostatom.com',
      user: 'green_test1',
      password: '?Nq33c7f9',
      database: 'green_test1',
    });

    // ตรวจสอบว่ามีอีเมลล์ที่ซ้ำกันหรือไม่
    const [rows] = await connection.execute(
      'SELECT email FROM userLogin WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      // อีเมลล์มีอยู่แล้ว
      await connection.end();
      return res.status(400).json({ error: 'Duplicate email' });
    }

    // แฮชรหัสผ่าน
    const hashedPassword = await bcrypt.hash(password, 10);

    // อีเมลล์ไม่มีอยู่แล้ว, ดำเนินการเพิ่มข้อมูล
    const [result] = await connection.execute(
      'INSERT INTO userLogin (email, password, firstName, lastName) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName]
    );

    // สร้าง accessToken
    const accessToken = jwt.sign(
      { userId: result.insertId, email: email, firstName: firstName, lastName: lastName },
      JWT_SECRET_KEY,
      { expiresIn: '1h' } // กำหนดระยะเวลาให้ accessToken หมดอายุ
    );

    // ปิดการเชื่อมต่อ
    await connection.end();

    // ส่งผลลัพธ์กลับไปให้ client
    res.json({
      msg: 'User registered successfully!',
      accessToken,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// เพิ่ม endpoint สำหรับการเข้าสู่ระบบ
app.post('/login', jsonParser, async function (req, res, next) {
  try {
    let { email, password } = req.body; // รับข้อมูลจาก request body
    console.log({ email, password });

    // สร้างการเชื่อมต่อกับฐานข้อมูล
    const connection = await mysql.createConnection({
      host: 'thsv89.hostatom.com',
      user: 'green_test1',
      password: '?Nq33c7f9',
      database: 'green_test1',
    });

    // ตรวจสอบอีเมลล์
    const [rows] = await connection.execute(
      'SELECT id, password, firstName, lastName FROM userLogin WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      // อีเมลล์ไม่พบ
      await connection.end();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];

    // ตรวจสอบรหัสผ่าน
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      // รหัสผ่านไม่ถูกต้อง
      await connection.end();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // สร้าง accessToken
    const accessToken = jwt.sign(
      { userId: user.id, email: email, firstName: user.firstName, lastName: user.lastName },
      JWT_SECRET_KEY,
      { expiresIn: '1h' } // กำหนดระยะเวลาให้ accessToken หมดอายุ
    );

    // ปิดการเชื่อมต่อ
    await connection.end();

    // ส่งผลลัพธ์กลับไปให้ client
    res.json({
      msg: 'Login successful!',
      accessToken,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// New endpoint to get all users
app.post('/users', jsonParser, async function (req, res, next) {
  try {
    // Create the connection to database
    const connection = await mysql.createConnection({
      host: 'thsv89.hostatom.com',
      user: 'green_test1',
      password: '?Nq33c7f9',
      database: 'green_test1',
    });

    // Query to get all users
    const [rows] = await connection.execute('SELECT * FROM userLogin');

    // Close the connection
    await connection.end();

    // Send the user data back to client
    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.listen(3333, function () {
  console.log('CORS-enabled web server listening on port 3333');
});
