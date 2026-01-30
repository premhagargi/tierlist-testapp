import express from 'express';
import { createServer, getServerPort } from '@devvit/web/server';
import { authRouter } from './routes/auth';
import { tiersRouter } from './routes/tiers';
import { categoriesRouter } from './routes/categories';
import { modsRouter } from './routes/mods';
import { suggestionsRouter } from './routes/suggestions';
import { listingsRouter } from './routes/listings';
import { reportsRouter } from './routes/reports';
import { appRouter } from './routes/app';
import { miscRouter } from './routes/misc';
import { initRouter } from './routes/init';
import { schedulerJobRouter } from './routes/schedulerJobs';

// Import Devvit configuration and scheduler jobs
// This ensures Devvit jobs are registered when the server starts

// --- Express Server Setup ---

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use(authRouter);
app.use(appRouter);
app.use(initRouter);
app.use(schedulerJobRouter);
app.use('/api', tiersRouter);
app.use('/api', categoriesRouter);
app.use('/api', modsRouter);
app.use('/api', suggestionsRouter);
app.use('/api', listingsRouter);
app.use('/api', reportsRouter);
app.use('/api', miscRouter);

// Error handling
app.use((_req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// Start server
const port = getServerPort();
const server = createServer(app);
server.on('error', (err) => console.error('Server error:', err.stack));
server.listen(port);
