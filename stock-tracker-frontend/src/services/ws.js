// src/services/ws.js
export default class WSClient {
  constructor(url) {
    this.url = url;
    this.ws = null;
    this.onTick = () => {};
    this.queue = [];
    this.subscribed = new Set();
    this.connect();
  }

  connect() {
    try {
      this.ws = new WebSocket(this.url);
    } catch (err) {
      console.error('WebSocket constructor failed', err);
      setTimeout(() => this.connect(), 1000);
      return;
    }
    this.ws.addEventListener('open', () => {
      // resubscribe
      this.subscribed.forEach(t => this.send({ type: 'subscribe', ticker: t }));
      // flush queue
      while (this.queue.length) {
        const s = this.queue.shift();
        this.ws.send(s);
      }
    });
    this.ws.addEventListener('message', (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'tick') this.onTick(data);
      } catch (err) {
        console.error('failed parse ws message', err);
      }
    });
    this.ws.addEventListener('close', () => {
      setTimeout(() => this.connect(), 1000);
    });
    this.ws.addEventListener('error', () => {
      this.ws.close();
    });
  }

  send(obj) {
    const s = JSON.stringify(obj);
    if (this.ws && this.ws.readyState === WebSocket.OPEN) this.ws.send(s);
    else this.queue.push(s);
  }

  subscribe(ticker) {
    ticker = ticker.toUpperCase();
    this.subscribed.add(ticker);
    this.send({ type: 'subscribe', ticker });
  }

  unsubscribe(ticker) {
    ticker = ticker.toUpperCase();
    this.subscribed.delete(ticker);
    this.send({ type: 'unsubscribe', ticker });
  }
}
