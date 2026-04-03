import express from "express";
import { createServer as createViteServer } from "vite";
import { Pool } from "pg";
import path from "path";

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_vQMqrxB0S8nj@ep-cool-shadow-a1nkj4ot.ap-southeast-1.aws.neon.tech/neondb?sslmode=require",
});

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        points INTEGER DEFAULT 0
      );
      
      -- Add columns if they don't exist (for existing databases)
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255);
      ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
      
      -- If password was added, we might need to set a default for existing rows to avoid NOT NULL constraint issues later,
      -- but since we just added it without NOT NULL in the ALTER, it's fine.
      -- Let's make sure it's not null for new rows, but we can't easily enforce NOT NULL on existing rows with nulls.
      
      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        lat FLOAT,
        lng FLOAT,
        address TEXT,
        waste_type VARCHAR(255),
        image_base64 TEXT,
        status VARCHAR(50) DEFAULT 'Pending',
        points INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Add columns if they don't exist (for existing databases)
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS lat FLOAT;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS lng FLOAT;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS address TEXT;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS location TEXT;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS waste_type VARCHAR(255);
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS image_base64 TEXT;
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Pending';
      ALTER TABLE reports ADD COLUMN IF NOT EXISTS points INTEGER;
      
      CREATE TABLE IF NOT EXISTS collected_waste (
        id SERIAL PRIMARY KEY,
        report_id INTEGER REFERENCES reports(id),
        collector_id INTEGER REFERENCES users(id),
        image_base64 TEXT,
        collected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  }
}

async function startServer() {
  await initDb();

  const app = express();
  const PORT = 3000;

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
      const amount = req.body.amount || 1; // Default amount to satisfy DB constraint

      const result = await pool.query(
        "INSERT INTO reports (user_id, lat, lng, address, waste_type, image_base64, points, location, amount, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
        [user_id, lat, lng, address, waste_type, image_base64, points, locationStr, amount, 'Pending']
      );
      // Add points to user
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
      
      // Update report status
      await pool.query("UPDATE reports SET status = 'Collected' WHERE id = $1", [reportId]);
      
      // Insert into collected_waste
      await pool.query(
        "INSERT INTO collected_waste (report_id, collector_id, image_base64) VALUES ($1, $2, $3)",
        [reportId, collector_id, image_base64]
      );

      // Award points to collector (e.g., 50 points for collecting)
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
