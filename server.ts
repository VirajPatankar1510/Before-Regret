import express from "express";
import path from "path";
import fs from "fs";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Extremely robust check to determine if the server is running in production mode
  const isProd = 
    process.env.NODE_ENV === "production" || 
    !fs.existsSync(path.join(process.cwd(), "server.ts")) ||
    (typeof __filename !== "undefined" && (__filename.includes("dist") || __filename.endsWith(".cjs"))) ||
    (fs.existsSync(path.join(process.cwd(), "dist")) && process.env.VITE_DEV !== "true");

  if (!isProd) {
    console.log("Starting server in development mode with Vite middleware...");
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode, serving built static assets...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT} (isProd=${isProd})`);
  });
}

startServer();
