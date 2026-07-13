import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Midddleware for JSON and urlencoded data
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // API Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "BeforeRegret", niche: "Neighborhoods in India" });
  });

  // Placeholder for expert list
  app.get("/api/experts/featured", (req, res) => {
    res.json([
      { id: "exp_01", name: "Rohan Sharma", area: "Indiranagar", city: "Bengaluru", rating: 4.9, activeRequests: 3 },
      { id: "exp_02", name: "Ananya Iyer", area: "HSR Layout", city: "Bengaluru", rating: 4.8, activeRequests: 1 },
      { id: "exp_03", name: "Vikram Malhotra", area: "Bandra West", city: "Mumbai", rating: 4.7, activeRequests: 5 }
    ]);
  });

  // Vite Integration for Hot Module Replacement in dev or Static Assets in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BeforeRegret] Server running on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
});
