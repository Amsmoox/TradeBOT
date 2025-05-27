import React, { useEffect, useState } from "react";
import { fetchSignals, fetchEvents } from "../../hooks/useApi";
import SignalCard from "../signal/SignalCard";

const Dashboard = () => {
  const [signals, setSignals] = useState([]);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [signalsData, eventsData] = await Promise.all([
          fetchSignals(),
          fetchEvents()
        ]);
        setSignals(signalsData);
        setEvents(eventsData);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    loadData();
  }, []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Dashboard</h1>

      <p>Total Signals: {signals.length}</p>
      <p>Total Events: {events.length}</p>

      <h2 className="text-lg font-semibold mt-6 mb-2">Signals</h2>
      <div className="space-y-2">
        {signals.map((signal, index) => (
          <SignalCard key={index} signal={signal} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
