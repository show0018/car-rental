const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path"); 

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/Images', express.static(path.join(__dirname, "public", "Images")));
app.use(express.static(path.join(__dirname, "public")));

// const db = mysql.createConnection({
//   host: "localhost",
//   user: "root",
//   password: "show-uts",          
//   database: "carrental_system",
//   port: 3306                     
// });

const db = mysql.createConnection({
  host: process.env.RDS_HOSTNAME,
  user: process.env.RDS_USERNAME,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DB_NAME,
  port: process.env.RDS_PORT || 3306
});


db.connect((err) => {
  if (err) {
    console.error("Database connection error:", err);
  } else {
    console.log("Connected to MySQL database");
  }
});

app.get("/api/cars", (req, res) => {
  const query = "SELECT * FROM cars";
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(results);
  });
});

app.get("/api/cars/:vin", (req, res) => {
  const vin = req.params.vin.trim().toUpperCase();
  const query = "SELECT * FROM cars WHERE UPPER(vin) = ?";
  db.query(query, [vin], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(404).json({ error: "Car not found" });
    res.json(results[0]);
  });
});

app.post("/api/reservations", (req, res) => {
  const {
    vin, customerName, phoneNumber, email,
    driversLicenseNumber, startDate, rentalPeriod,
    totalPrice, orderDate
  } = req.body;

  if (!vin || !customerName || !phoneNumber || !email || !driversLicenseNumber || !startDate || !rentalPeriod || !totalPrice || !orderDate) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const insertQuery = `
    INSERT INTO orders (
      vin, customerName, phoneNumber, email, driversLicenseNumber,
      startDate, rentalPeriod, totalPrice, orderDate, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
  `;

  db.query(insertQuery, [
    vin, customerName, phoneNumber, email,
    driversLicenseNumber, startDate, rentalPeriod,
    totalPrice, orderDate
  ], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });

    const updateQuery = "UPDATE cars SET available = 0 WHERE vin = ?";
    db.query(updateQuery, [vin], (err2) => {
      if (err2) return res.status(500).json({ message: "Reservation saved, but availability update failed." });
      res.status(201).json({ message: "Reservation successful" });
    });
  });
});


app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/reservation", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "reservation.html"));
});


app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
