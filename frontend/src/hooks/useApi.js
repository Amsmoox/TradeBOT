const BASE_URL = 'http://127.0.0.1:8000/api/telegram';

const fetchData = async (endpoint) => {
  try {
    const response = await fetch(`${BASE_URL}/${endpoint}/`);
    if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error(error);
    return [];
  }
};

export const fetchSignals = () => fetchData('signals');
export const fetchEvents = () => fetchData('events');