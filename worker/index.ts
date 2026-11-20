import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { HonoBindings } from './types';
import authRoutes from './routes/auth';
import financialRoutes from './routes/financial';
import nameListsRoutes from './routes/nameLists';
import profilesRoutes from './routes/profiles';
import storageRoutes from './routes/storage';
import notificationsRoutes from './routes/notifications';
import backupRoutes from './routes/backup';
import eventsRoutes from './routes/events';
import pushRoutes, { dispatchScheduledReminders } from './routes/push';
import type { WorkerEnv } from './types';

const app = new Hono<HonoBindings>();

const STATIC_ALLOWED_ORIGINS = new Set([
  'https://watsnaydouch.site',
  'http://watsnaydouch.site',
  'https://wsd-app.anajak.cloud',
  'https://sg1.anajak.cloud',
  'http://localhost:3000',
  'http://localhost:5173',
]);

app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  c.res.headers.set('X-Frame-Options', 'SAMEORIGIN');
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  c.res.headers.set(
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
});

app.use(
  '/api/*',
  cors({
    origin: (origin) => {
      if (!origin) return '*';
      const isAllowed =
        STATIC_ALLOWED_ORIGINS.has(origin) ||
        origin.endsWith('watsnaydouch.site') ||
        origin.endsWith('.anajak.cloud') ||
        origin.endsWith('.run.app') ||
        origin.endsWith('.google.com') ||
        origin.endsWith('.onrender.com') ||
        origin.endsWith('.pages.dev') ||
        origin.endsWith('.workers.dev') ||
        origin.endsWith('.cloudflare.com') ||
        origin.includes('localhost');
      return isAllowed ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Cache-Control'],
    credentials: true,
    maxAge: 86400,
  })
);

app.get('/api/health', (c) => {
  return c.json({
    status: 'ok',
    runtime: 'cloudflare-workers',
    timestamp: new Date().toISOString(),
  });
});

app.route('/api/auth', authRoutes);
app.route('/api', financialRoutes);
app.route('/api/name-lists', nameListsRoutes);
app.route('/api/profiles', profilesRoutes);
app.route('/api/upload', storageRoutes);
app.route('/api/notifications', notificationsRoutes);
app.route('/api/backup', backupRoutes);
app.route('/api/events', eventsRoutes);
app.route('/api/push', pushRoutes);

app.all('*', async (c) => {
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  return c.text('Not Found', 404);
});

export default {
  fetch: app.fetch,
  async scheduled(_controller: any, env: WorkerEnv, ctx: { waitUntil: (promise: Promise<any>) => void }) {
    ctx.waitUntil(
      dispatchScheduledReminders(env).catch((err) => {
        console.error('[Cron Push Reminder Error]', err);
      })
    );
  },
};
