import { useState } from 'react';
import DashboardCards from './components/DashboardCards';
import BidsTable from './components/BidsTable';
import BidForm from './components/BidForm';

export default function App() {
  const [editing, setEditing] = useState(null);
  return (
    <>
      <header><h2>Bid Tracker</h2></header>
      <div className="container">
        <DashboardCards />
        <BidForm editing={editing} onSaved={() => setEditing(null)} />
        <BidsTable onEdit={setEditing} />
      </div>
    </>
  );
}