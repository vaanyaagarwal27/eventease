import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(`${API}/events`)
      .then((res) => res.json())
      .then((data) => setEvents(data));
  }, []);

  return (
    <div>
      <h1>EventEase</h1>
      <ul>
        {events.map((event) => (
          <li key={event._id}>
            {event.title} ({event.seatsTaken}/{event.capacity} seats)
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;