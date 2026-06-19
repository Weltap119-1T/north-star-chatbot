"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const chatbot_1 = require("./chatbot");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
// Create or validate session
app.post('/api/session', (_req, res) => {
    const sessionId = (0, chatbot_1.createSession)();
    res.json({ sessionId });
});
// Process chat message
app.post('/api/chat', (req, res) => {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) {
        return res.status(400).json({ error: 'sessionId and message are required' });
    }
    const response = (0, chatbot_1.processMessage)(sessionId, message);
    return res.json(response);
});
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Fallback to index.html for SPA
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, '../public/index.html'));
});
app.listen(PORT, () => {
    console.log(`\n🌲 North Star Support Bot running at http://localhost:${PORT}\n`);
});
exports.default = app;
