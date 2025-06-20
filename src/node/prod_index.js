const express = require("express");
const app = express();
app.use(express.urlencoded({ extended: true }));

const port = 4183;

const cors = require("cors");
app.use(cors());

const { Pool } = require("pg");
const pool = new Pool({
  user: "user_4183", // PostgreSQLのユーザー名に置き換えてください
  host: "localhost",
  database: "crm_4183", // PostgreSQLのデータベース名に置き換えてください
  password: "pass_4183", // PostgreSQLのパスワードに置き換えてください
  port: 5432,
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

// 顧客一覧取得
app.get("/customers", async (req, res) => {
  try {
    const customerData = await pool.query("SELECT * FROM customers");
    res.send(customerData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

// 顧客詳細取得
app.get("/customers/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const customerDetailData = await pool.query(
      "SELECT * FROM customers WHERE customer_id = $1",
      [id]
    );
    res.json(customerDetailData.rows[0]);
    // res.send(customerDetailData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.post("/add-customer", async (req, res) => {
  try {
    const { companyName, industry, contact, location } = req.body;
    const newCustomer = await pool.query(
      "INSERT INTO customers (company_name, industry, contact, location) VALUES ($1, $2, $3, $4) RETURNING *",
      [companyName, industry, contact, location]
    );
    res.json({ success: true, customer: newCustomer.rows[0] });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.use(express.static("public"));

// 顧客削除
app.delete("/delete-customer/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM customers WHERE customer_id = $1", [id]);

    res.sendStatus(204);
    // res.send(customerDetailData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});

// 顧客情報更新
app.put("/update-customer/:id", async (req, res) => {
  try {
    console.log(req.body);

    const { company_name, industry, contact, location } = req.body;
    const { id } = req.params;
    const customerDetailData = await pool.query(
      "UPDATE customers SET (company_name, industry, contact, location) = ($1, $2, $3, $4) WHERE customer_id = $5",
      [company_name, industry, contact, location, id]
    );

    // res.sendStatus(204);
    res.send(customerDetailData.rows);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
});
