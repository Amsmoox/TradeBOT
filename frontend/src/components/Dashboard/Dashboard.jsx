
import React, { useEffect, useState } from 'react';
import { fetchSignals, fetchEvents, fetchNews } from '../../hooks/api';

const Dashboard = () => {
  const [signals, setSignals] = useState([]);
  const [events, setEvents] = useState([]);
  const [news, setNews] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [signalsData, eventsData, newsData] = await Promise.all([
          fetchSignals(),
          fetchEvents(),
          fetchNews(),
        ]);
        setSignals(signalsData);
        setEvents(eventsData);
        setNews(newsData);
      } catch (error) {
        console.error('API load error:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Total Signals" value={signals.length} />
        <Card title="Total Events" value={events.length} />
        <Card title="Total News" value={news.length} />
      </div>

      <section>
        <h2 className="text-xl font-semibold mt-6">Signals</h2>
        <List items={signals} type="signal" />
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6">Events</h2>
        <List items={events} type="event" />
      </section>

      <section>
        <h2 className="text-xl font-semibold mt-6">News</h2>
        <List items={news} type="news" />
      </section>
    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="p-4 bg-white shadow-md rounded-md text-center">
    <h3 className="text-sm text-gray-500">{title}</h3>
    <p className="text-xl font-bold">{value}</p>
  </div>
);

const List = ({ items, type }) => {
  if (items.length === 0) return <p className="text-gray-400">No {type}s found.</p>;

  return (
    <ul className="divide-y divide-gray-200">
      {items.map((item, index) => (
        <li key={index} className="py-2">
          {type === 'signal' && (
            <>
              <b>{item.pair}</b> - {item.action} | SL: {item.sl} | TP: {item.tp}
            </>
          )}
          {type === 'event' && (
            <>
              <b>{item.title}</b> - {item.date}
            </>
          )}
          {type === 'news' && (
            <>
              <b>{item.headline}</b> - {item.source}
            </>
          )}
        </li>
      ))}
    </ul>
  );
};

export default Dashboard;
