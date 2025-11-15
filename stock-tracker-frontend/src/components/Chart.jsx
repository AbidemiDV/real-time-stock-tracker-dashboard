import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Chart({ data = [] }) {
  const formatted = data.map(d => ({ time: new Date(d.t).toLocaleTimeString(), price: d.p }));
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={formatted}>
        <XAxis dataKey="time" minTickGap={20} />
        <YAxis domain={[dataMin => dataMin * 0.98, dataMax => dataMax * 1.02]} />
        <Tooltip />
        <Line type="monotone" dataKey="price" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
