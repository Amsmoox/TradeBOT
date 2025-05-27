const BASE_URL = "http://127.0.0.1:8000/api/telegram";

export async function fetchSignals() {
  const res = await fetch(`${BASE_URL}/send-signals/`);
  if (!res.ok) throw new Error("Failed to fetch signals");
  const data = await res.json();
  return data.signals || []; // adjust depending on your backend response
}

export async function fetchEvents() {
  const res = await fetch(`${BASE_URL}/send-events/`);
  if (!res.ok) throw new Error("Failed to fetch events");
  const data = await res.json();
  return data.events || []; // adjust depending on backend
}
