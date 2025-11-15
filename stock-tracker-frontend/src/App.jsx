import React, { useEffect, useState } from 'react';
import axios from 'axios';
import WSClient from './services/ws';
import Chart from './components/Chart';

const ws = new WSClient(window.__WS_URL__ || 'ws://localhost:4000');

function App() {
  const [ticker, setTicker] = useState('AAPL');
  const [data, setData] = useState([]);
  const [watchlist, setWatchlist] = useState(['AAPL','TSLA']);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await axios.get(`${window.__API_URL__ || 'http://localhost:4000'}/api/history/${ticker}`);
        if (mounted) setData(res.data);
        ws.subscribe(ticker);
      } catch (err) {
        console.error('Failed to load history', err);
      }
    }
    load();
    ws.onTick = (msg) => {
      if (msg.ticker === ticker) {
        setData(prev => [...prev.slice(-299), msg.point]);
      }
    };
    return () => {
      mounted = false;
      ws.unsubscribe(ticker);
    };
  }, [ticker]);

  return (
    <div className="p-4 font-sans">
      <h1 className="text-2xl font-bold mb-4">Real‑Time Stock Tracker</h1>
      <div className="flex gap-4">
        <div className="w-1/4 border rounded p-3">
          <h2 className="font-semibold mb-2">Watchlist</h2>
          {watchlist.map(t => (
            <div key={t} className="flex justify-between items-center mb-1">
              <button onClick={() => setTicker(t)} className="underline">{t}</button>
              <button onClick={() => setWatchlist(w => w.filter(x=>x!==t))} className="text-sm">Remove</button>
            </div>
          ))}
          <div className="mt-2 flex">
            <input placeholder="Add ticker" id="addTicker" className="border p-1 flex-1" />
            <button onClick={() => {
              const el = document.getElementById('addTicker');
              const v = el.value.trim().toUpperCase();
              if (v && !watchlist.includes(v)) setWatchlist(w=>[...w,v]);
              el.value='';
            }} className="ml-2 px-3 py-1 bg-gray-100 rounded">Add</button>
          </div>
        </div>
        <div className="flex-1 border rounded p-3">
          <div className="mb-2">Selected: <strong>{ticker}</strong></div>
          <Chart data={data} />
        </div>
      </div>
    </div>
  );
}

export default App;
