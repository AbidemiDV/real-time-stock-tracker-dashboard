// server.js
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Simple in-memory store for historical points per ticker
const HISTORY_LEN = 300; // 300 points
const history = {}; // { TICKER: [{t:timestamp, p:price}, ...] }

function ensureTicker(ticker) {
  if (!history[ticker]) {
    // seed with a gentle random walk
    const now = Date.now();
    const base = 100 + Math.random() * 50;
    history[ticker] = [];
    for (let i = HISTORY_LEN - 1; i >= 0; i--) {
      history[ticker].push({ t: now - i * 1000, p: +(base + (Math.random() - 0.5) * 2).toFixed(2) });
    }
  }
}

// HTTP endpoint to fetch history
app.get('/api/history/:ticker', (req, res) => {
  const t = req.params.ticker.toUpperCase();
  ensureTicker(t);
  res.json(history[t]);
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', function connection(ws) {
  ws.subscriptions = new Set();

  ws.on('message', function incoming(msg) {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'subscribe') {
        const ticker = data.ticker.toUpperCase();
        ws.subscriptions.add(ticker);
        ensureTicker(ticker);
        ws.send(JSON.stringify({ type: 'subscribed', ticker }));
      } else if (data.type === 'unsubscribe') {
        ws.subscriptions.delete(data.ticker.toUpperCase());
      }
    } catch (err) {
      console.error('invalid message', err);
    }
  });

  ws.on('close', () => {
    ws.subscriptions.clear();
  });
});

// Periodically update all tickers and broadcast to subscribers
setInterval(() => {
  const now = Date.now();
  Object.keys(history).forEach(ticker => {
    // random walk
    const last = history[ticker][history[ticker].length - 1].p;
    const change = (Math.random() - 0.5) * 0.5; // small change
    const price = +(last + change).toFixed(2);
    const point = { t: now, p: price };
    history[ticker].push(point);
    if (history[ticker].length > HISTORY_LEN) history[ticker].shift();

    // broadcast to clients subscribed to this ticker
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN && client.subscriptions && client.subscriptions.has(ticker)) {
        client.send(JSON.stringify({ type: 'tick', ticker, point }));
      }
    });
  });
}, 1000);

// seed a couple of tickers so users see something
['AAPL', 'TSLA', 'MSFT', 'GOOG'].forEach(ensureTicker);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log('Server listening on', PORT));
