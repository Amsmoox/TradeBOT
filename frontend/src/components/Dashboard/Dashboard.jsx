import React, { useEffect, useState } from 'react';
import { fetchSignals, fetchEvents } from '../../hooks/useApi';
import SignalCard from '../Signals/SignalCard';

const Dashboard = () => {
  const [signals, setSignals] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setSignals(await fetchSignals());
      setEvents(await fetchEvents());
    };

    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📊 Trading Dashboard</h1>
          <p className="text-gray-600">
            Stay updated with the latest <span className="font-medium">signals</span> and <span className="font-medium">events</span>.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-gray-700">📈 Total Signals</h2>
            <p className="text-2xl font-bold text-blue-600">{signals.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl shadow">
            <h2 className="text-lg font-semibold text-gray-700">📅 Total Events</h2>
            <p className="text-2xl font-bold text-indigo-600">{events.length}</p>
          </div>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Live Signals</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {signals.map((signal, i) => (
              <SignalCard key={i} signal={signal} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;