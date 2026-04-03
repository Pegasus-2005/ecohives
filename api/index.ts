import express from "express";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_vQMqrxB0S8nj@ep-cool-shadow-a1nkj4ot.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});

const app = express();
app.use(express.json({ limit: "50mb" }));

// API Routes
app.post("/api/auth/register", async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const result = await pool.query(
      "INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, points",
      [email, password, name]
    );
    res.json({ user: result.rows[0] });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query(
      "SELECT id, email, name, points FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );
    if (result.rows.length > 0) {
      res.json({ user: result.rows[0] });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reports", async (req, res) => {
  try {
    const { user_id, lat, lng, address, waste_type, image_base64, points } = req.body;
    const locationStr = address || `${lat}, ${lng}`;
    const amount = req.body.amount || 1;

    const result = await pool.query(
      "INSERT INTO reports (user_id, lat, lng, address, waste_type, image_base64, points, location, amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
      [user_id, lat, lng, address, waste_type, image_base64, points, locationStr, amount, 'Pending']
    );
    await pool.query("UPDATE users SET points = points + $1 WHERE id = $2", [points, user_id]);
    res.json({ report: result.rows[0] });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reports", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM reports ORDER BY created_at DESC");
    res.json({ reports: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reports/:id/collect", async (req, res) => {
  try {
    const reportId = req.params.id;
    const { collector_id, image_base64 } = req.body;
    
    await pool.query("UPDATE reports SET status = 'Collected' WHERE id = $1", [reportId]);
    await pool.query(
      "INSERT INTO collected_waste (report_id, collector_id, image_base64) VALUES ($1, $2, $3)",
      [reportId, collector_id, image_base64]
    );
    await pool.query("UPDATE users SET points = points + 50 WHERE id = $1", [collector_id]);

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/leaderboard", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, name, points FROM users ORDER BY points DESC LIMIT 10");
    res.json({ leaderboard: result.rows });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default app;
