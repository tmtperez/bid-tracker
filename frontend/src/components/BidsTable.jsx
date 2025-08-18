import { useEffect, useState } from 'react';
import { getBids, deleteBid, getScopes, createScope } from '../api';

export default function BidsTable({ onEdit }) {
  const [rows, setRows] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const refresh = () => getBids().then(setRows);
  useEffect(() => { refresh(); }, []);

  const toggle = (id) => setExpanded(expanded === id ? null : id);

  const addScope = async (bidId) => {
    const name = prompt('Scope name?');
    const cost = parseFloat(prompt('Cost?') || '0');
    if (!name) return;
    await createScope(bidId, { name, cost });
    refresh();
  };

  return (
    <div className="card">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <h3>Bids</h3>
        <button onClick={refresh}>Refresh</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Company</th>
            <th>Project</th>
            <th>Status</th>
            <th>Value</th>
            <th>Sent</th>
            <th>Last Contact</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <>
              <tr key={r.id}>
                <td>{r.id}</td>
                <td>{r.company_name || '—'}</td>
                <td>{r.project}</td>
                <td><span className="badge">{r.status}</span></td>
                <td>₱ {Number(r.value).toLocaleString()}</td>
                <td>{r.date_sent || ''}</td>
                <td>{r.last_contact || ''}</td>
                <td style={{whiteSpace:'nowrap'}}>
                  <button onClick={() => toggle(r.id)}>Scopes</button>{' '}
                  <button onClick={() => onEdit(r)}>Edit</button>{' '}
                  <button onClick={async () => { if (confirm('Delete bid?')) { await deleteBid(r.id); refresh(); } }}>Delete</button>
                </td>
              </tr>
              {expanded === r.id && (
                <tr>
                  <td colSpan={8}>
                    <Scopes bidId={r.id} />
                    <button className="primary" onClick={() => addScope(r.id)}>Add Scope</button>
                  </td>
                </tr>
              )}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Scopes({ bidId }) {
  const [data, setData] = useState([]);
  useEffect(() => { getScopes(bidId).then(setData); }, [bidId]);
  return (
    <div style={{marginTop:8}}>
      <strong>Scopes</strong>
      <table>
        <thead><tr><th>Name</th><th>Cost</th><th>Status</th></tr></thead>
        <tbody>
          {data.map(s => (
            <tr key={s.id}>
              <td>{s.name}</td>
              <td>₱ {Number(s.cost).toLocaleString()}</td>
              <td><span className="badge">{s.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}