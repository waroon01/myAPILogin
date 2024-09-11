const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mysql = require('mysql2/promise');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET_KEY = 'i love you nunyu';

const app = express();
const jsonParser = bodyParser.json();

app.use(cors());

// Middleware ตรวจสอบ JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).json({ error: 'Token is missing' });

  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.post('/register', jsonParser, async function (req, res, next) {
  try {
    let { email, password, firstName, lastName } = req.body;
    console.log({ email, password, firstName, lastName });

    const connection = await mysql.createConnection({
      host: 'thsv89.hostatom.com',
      user: 'green_test1',
      password: '?Nq33c7f9',
      database: 'green_test1',
    });

    const [rows] = await connection.execute(
      'SELECT email FROM userLogin WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      await connection.end();
      return res.status(400).json({ error: 'Duplicate email' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await connection.execute(
      'INSERT INTO userLogin (email, password, firstName, lastName) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName]
    );

    const accessToken = jwt.sign(
      { userId: result.insertId, email, firstName, lastName },
      JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    await connection.end();

    res.json({
      msg: 'User registered successfully!',
      accessToken,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.post('/login', jsonParser, async function (req, res, next) {
  try {
    let { email, password } = req.body;
    console.log({ email, password });

    const connection = await mysql.createConnection({
      host: 'thsv89.hostatom.com',
      user: 'green_test1',
      password: '?Nq33c7f9',
      database: 'green_test1',
    });

    const [rows] = await connection.execute(
      'SELECT id, password, firstName, lastName, role FROM userLogin WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      await connection.end();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = rows[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      await connection.end();
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const accessToken = jwt.sign(
      { userId: user.id, email, firstName: user.firstName, lastName: user.lastName, role: user.role },
      JWT_SECRET_KEY,
      { expiresIn: '1h' }
    );

    await connection.end();

    res.json({
      msg: 'Login successful!',
      accessToken,
    });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.post('/users', jsonParser, async function (req, res, next) {
  try {
    const connection = await mysql.createConnection({
      host: 'thsv89.hostatom.com',
      user: 'green_test1',
      password: '?Nq33c7f9',
      database: 'green_test1',
    });

    const [rows] = await connection.execute('SELECT * FROM userLogin');

    await connection.end();

    res.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

// New endpoint to get profile information
app.get('/profile', authenticateToken, async function (req, res, next) {
  try {
    const userId = req.user.userId;

    const connection = await mysql.createConnection({
      host: 'thsv89.hostatom.com',
      user: 'green_test1',
      password: '?Nq33c7f9',
      database: 'green_test1',
    });

    const [rows] = await connection.execute(
      'SELECT email, firstName, lastName, role FROM userLogin WHERE id = ?',
      [userId]
    );

    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.listen(3333, function () {
  console.log('CORS-enabled web server listening on port 3333');
});
