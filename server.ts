import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import compression from "compression";
import { createServer as createViteServer } from "vite";

import authRoutes from "./server/auth/routes";
import financialRoutes from "./server/routers/financial";
import nameListsRoutes from "./server/routers/name_lists";
import profilesRoutes from "./server/routers/profiles";
import storageRoutes from "./server/routers/storage";
import notificationsRoutes from "./server/routers/notifications";
import backupRoutes from "./server/routers/backup";
import eventsRoutes from "./server/routers/events";

import "./server/types.d";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Disable Express signature
  app.disable('x-powered-by');

  // Security Headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Server, etc.)
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    res.setHeader('Server', 'Web');
    res.removeHeader('X-Powered-By');
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' https: data: blob:; " +
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https:; " +
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:; " +
      "font-src 'self' data: https://fonts.gstatic.com https:; " +
      "img-src 'self' data: blob: https:; " +
      "connect-src 'self' https: wss: ws: blob: data:; " +
      "media-src 'self' data: blob: https:; " +
      "frame-src 'self' https:; " +
      "frame-ancestors 'self' https: http:;"
    );
    next();
  });

  // Enable compression (gzip/deflate) to drastically reduce transfer size
  app.use(compression());

  // Restrict CORS to explicit allowed origins instead of wildcard '*'
  const allowedOrigins = [
    'https://wsd-app.anajak.cloud',
    'https://sg1.anajak.cloud',
    'http://localhost:3000',
    'http://localhost:5173',
  ];

  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }
      const isAllowed =
        allowedOrigins.includes(origin) ||
        origin.endsWith('.anajak.cloud') ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.google.com') ||
        origin.includes('localhost');

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
  }));
  app.use(express.json());

  app.use("/api/auth", authRoutes);    
  app.use("/api", financialRoutes);
  app.use("/api/name-lists", nameListsRoutes);
  app.use("/api/profiles", profilesRoutes);
  app.use("/api/upload", storageRoutes);
  app.use("/api/notifications", notificationsRoutes);
  app.use("/api/backup", backupRoutes);
  app.use("/api/events", eventsRoutes);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, {
      maxAge: '1y',
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.html')) {
          res.setHeader('Cache-Control', 'no-cache');
        }
      }
    }));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Backend + Vite Frontend is running on port ${PORT}`);
  });
}

startServer();
