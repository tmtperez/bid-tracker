import { useEffect, useState } from 'react';
import { getDashboard } from '../api';

export default function DashboardCards() {
  const [d, setD] = useState(null);
  useEffect(() => { getDashboard().then(setD); }, []);
  if (!d) return <div className="card">Loading dashboard…</div>;
  const fmt = (n) => Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 });
  return (
    <div className="grid">
      <div className="card"><h3>Active pipeline value</h3><div style={{fontSize:28,fontWeight:700}}>₱ {fmt(d.active_pipeline_value)}</div></div>
      <div className="card"><h3>Total won</h3><div style={{fontSize:28,fontWeight:700}}>₱ {fmt(d.total_won)}</div></div>
      <div className="card"><h3>Win/Loss Ratio</h3><div style={{fontSize:28,fontWeight:700}}>{fmt(d.win_loss_ratio)}</div></div>
    </div>
  );
}