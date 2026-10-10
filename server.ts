import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { authRouter } from './server/routes/auth';
import { donationsRouter } from './server/routes/donations';
import { ngosRouter } from './server/routes/ngos';
import { tripsRouter } from './server/routes/trips';
import { routingRouter } from './server/routes/routing';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // JSON middleware
  app.use(express.json());

  // Mount API routers
  app.use('/api/auth', authRouter);
  app.use('/api/donations', donationsRouter);
  app.use('/api/ngos', ngosRouter);
  app.use('/api/trips', tripsRouter);
  app.use('/api/routing', routingRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'FOODPOOL',
      state: 'Tamil Nadu Route Pooling Active',
      timestamp: new Date().toISOString()
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    // Mount Vite in middleware mode for dev
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[FOODPOOL Backend] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
