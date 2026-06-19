import express, { Request, Response } from 'express';
import path from 'path';
import { processMessage, createSession } from './chatbot';
import { ChatRequest } from './types';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Create or validate session
app.post('/api/session', (_req: Request, res: Response) => {
  const sessionId = createSession();
  res.json({ sessionId });
});

// Process chat message
app.post('/api/chat', (req: Request, res: Response) => {
  const { sessionId, message } = req.body as ChatRequest;

  if (!sessionId || !message) {
    return res.status(400).json({ error: 'sessionId and message are required' });
  }

  const response = processMessage(sessionId, message);
  return res.json(response);
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback to index.html for SPA
app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🌲 North Star Support Bot running at http://localhost:${PORT}\n`);
});

export default app;
