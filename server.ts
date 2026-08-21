import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";

import authRoutes from "./server/auth/routes";
import financialRoutes from "./server/routers/financial";
import nameListsRoutes from "./server/routers/name_lists";
import profilesRoutes from "./server/routers/profiles";
import storageRoutes from "./server/routers/storage";
import notificationsRoutes from "./server/routers/notifications";

// Setup Request Type Extension
import "./server/types.d";

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.SERVER_PORT || process.env.PORT || "3000", 10);

  app.use(cors({
    origin: '*', // នៅលើ Production អ្នកគួរដូរទៅជា URL របស់ Netlify ជំនួស '*'
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));
  app.use(express.json());

  // API Routes 
  app.use("/api/auth", authRoutes);    
    app.use("/api", financialRoutes);
  app.use("/api/name-lists", nameListsRoutes);
  app.use("/api/profiles", profilesRoutes);
  app.use("/api/upload", storageRoutes);
  app.use("/api/notifications", notificationsRoutes);

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Backend + Vite Frontend is running on port ${PORT}`);
  });
}

startServer();
