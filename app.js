var express = require('express');
var cors = require('cors');
var app = express();
var bodyParser = require('body-parser');
var mysql = require('mysql2/promise'); // ใช้ mysql2/promise เพื่อรองรับ async/await

// create application/json parser
var jsonParser = bodyParser.json();

app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!')
})


app.post('/register', jsonParser, async function (req, res, next) {
  try {
    let { email, password, firstName, lastName } = req.body; // รับข้อมูลจาก request body
    console.log({ email, password, firstName, lastName });

    // Create the connection to database
    const connection = await mysql.createConnection({
      host: 'thsv89.hostatom.com',
      user: 'green_test1',
      password: '?Nq33c7f9',
      database: 'green_test1',
    });

    // Run a query to insert data into userLogin table
    const [result] = await connection.execute(
      'INSERT INTO userLogin (email, password, firstName, lastName) VALUES (?, ?, ?, ?)',
      [email, password, firstName, lastName]
    );

    // Close the connection
    await connection.end();

    // ส่งผลลัพธ์กลับไปให้ client
    res.json({ msg: 'User registered successfully!', userId: result.insertId });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection error' });
  }
});

app.listen(3333, function () {
  console.log('CORS-enabled web server listening on port 3333');
});
