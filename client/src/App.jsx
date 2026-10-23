import { useEffect, useState } from 'react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

function App() {
  const [events, setEvents] = useState([]);
  const [selected, setSelected] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function loadEvents() {
    fetch(`${API}/events`)
      .then((res) => res.json())
      .then((data) => setEvents(data));
  }

  useEffect(() => {
    loadEvents();
  }, []);

  async function handleRegister(e) {
    e.preventDefault();
    const res = await fetch(`${API}/events/${selected._id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage(`You're registered for ${selected.title}!`);
      setName('');
      setEmail('');
      loadEvents();
    } else {
      setMessage(data.error);
    }
  }

  return (
    <div>
      <h1>EventEase</h1>

      <ul>
        {events.map((event) => (
          <li key={event._id}>
            {event.title} · {event.venue} · {new Date(event.date).toLocaleString()} (
            {event.seatsTaken}/{event.capacity} seats)
           <button
  disabled={event.seatsTaken >= event.capacity}
  onClick={() => {
    setSelected(event);
    setMessage('');
  }}
>
  {event.seatsTaken >= event.capacity ? 'Full' : 'Register'}
</button>
          </li>
        ))}
      </ul>

      {selected && (
        <form onSubmit={handleRegister}>
          <h2>Register for {selected.title}</h2>
          <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Register</button>
          {message && <p>{message}</p>}
        </form>
      )}
    </div>
  );
}

export default App;