// frontend/src/api.js
const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export async function getDashboard() {
  const r = await fetch(`${API}/dashboard`);
  return r.json();
}

export async function getBids() {
  const r = await fetch(`${API}/bids`);
  return r.json();
}

export async function getCompanies() {
  const r = await fetch(`${API}/companies`);
  return r.json();
}

export async function createBid(data) {
  const r = await fetch(`${API}/bids`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return r.json();
}

export async function updateBid(id, data) {
  const r = await fetch(`${API}/bids/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return r.json();
}

export async function deleteBid(id) {
  await fetch(`${API}/bids/${id}`, { method: 'DELETE' });
}

export async function getScopes(bidId) {
  const r = await fetch(`${API}/bids/${bidId}/scopes`);
  return r.json();
}

export async function createScope(bidId, data) {
  const r = await fetch(`${API}/bids/${bidId}/scopes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return r.json();
}
