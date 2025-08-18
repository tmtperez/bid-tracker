import { useEffect, useState } from 'react';
import { getCompanies, createBid, updateBid } from '../api';

export default function BidForm({ editing, onSaved }) {
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({ company_id: '', project: '', status: 'active', value: 0, date_sent: '', last_contact: '' });

  useEffect(() => { getCompanies().then(setCompanies); }, []);
  useEffect(() => { if (editing) setForm({
    company_id: editing.company_id || '', project: editing.project || '', status: editing.status || 'active', value: editing.value || 0, date_sent: editing.date_sent || '', last_contact: editing.last_contact || ''
  }); }, [editing]);

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, value: parseFloat(form.value || '0') };
    if (editing) await updateBid(editing.id, payload); else await createBid(payload);
    onSaved?.();
    setForm({ company_id: '', project: '', status: 'active', value: 0, date_sent: '', last_contact: '' });
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <div className="card">
      <h3>{editing ? 'Edit Bid' : 'New Bid'}</h3>
      <form onSubmit={submit} className="grid">
        <div>
          <label>Company</label>
          <select value={form.company_id} onChange={set('company_id')}>
            <option value="">— None —</option>
            {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label>Project</label>
          <input value={form.project} onChange={set('project')} placeholder="Project name" required />
        </div>
        <div>
          <label>Status</label>
          <select value={form.status} onChange={set('status')}>
            <option value="active">active</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
            <option value="pending">pending</option>
          </select>
        </div>
        <div>
          <label>Value</label>
          <input type="number" step="0.01" value={form.value} onChange={set('value')} />
        </div>
        <div>
          <label>Date Sent</label>
          <input type="date" value={form.date_sent} onChange={set('date_sent')} />
        </div>
        <div>
          <label>Last Contact</label>
          <input type="date" value={form.last_contact} onChange={set('last_contact')} />
        </div>
        <div style={{alignSelf:'end'}}>
          <button className="primary" type="submit">{editing ? 'Save' : 'Create'}</button>
        </div>
      </form>
    </div>
  );
}