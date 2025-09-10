const express = require("express");
const mysql = require("mysql2/promise");

const app = express();

// Middleware
app.use(express.json());

// ✅ Use Railway environment variables
const dbConfig = {
  host: process.env.MYSQLHOST || "localhost",
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "root",
  database: process.env.MYSQLDATABASE || "MyDatabase",
  port: process.env.MYSQLPORT || 3306,
};

// GET all records
app.get("/personal_information", async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM personal_information");
    await connection.end();
    res.status(200).json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET record by ID
app.get("/personal_information/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute("SELECT * FROM personal_information WHERE id = ?", [id]);
    await connection.end();

    if (rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// CREATE new record
app.post("/personal_information", async (req, res) => {
  try {
    const { first_name, last_name, date_of_birth, gender } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "INSERT INTO personal_information (first_name, last_name, date_of_birth, gender) VALUES (?, ?, ?, ?)",
      [first_name, last_name, date_of_birth, gender]
    );
    await connection.end();

    res.status(201).json({
      id: result.insertId,
      first_name,
      last_name,
      date_of_birth,
      gender,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// FULL UPDATE (PUT)
app.put("/personal_information/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { first_name, last_name, date_of_birth, gender } = req.body;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      "UPDATE personal_information SET first_name = ?, last_name = ?, date_of_birth = ?, gender = ? WHERE id = ?",
      [first_name, last_name, date_of_birth, gender, id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ id, first_name, last_name, date_of_birth, gender });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// PARTIAL UPDATE (PATCH)
app.patch("/personal_information/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const fields = req.body;

    if (Object.keys(fields).length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    const setClause = Object.keys(fields).map((key) => `${key} = ?`).join(", ");
    const values = Object.values(fields);

    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute(
      `UPDATE personal_information SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ id, ...fields });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE record by ID
app.delete("/personal_information/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const connection = await mysql.createConnection(dbConfig);
    const [result] = await connection.execute("DELETE FROM personal_information WHERE id = ?", [id]);
    await connection.end();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    res.status(200).json({ message: `Record with ID ${id} deleted` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000; // ✅ Railway assigns its own port
app.listen(PORT, () => {
  console.log(`🚀 API running on port ${PORT}`);
});
