import { useEffect, useState } from 'react';
import { API } from './api';
import CreateEventForm from './CreateEventForm';
import AttendeeList from './AttendeeList';

function App() {
  const [events, setEvents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const selected = events.find((event) => event._id === selectedId);

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

      <CreateEventForm onCreated={loadEvents} />

      <ul>
        {events.map((event) => (
          <li key={event._id}>
            {event.title} · {event.venue} · {new Date(event.date).toLocaleString()} (
            {event.seatsTaken}/{event.capacity} seats)
            <button
              onClick={() => {
                setSelectedId(event._id);
                setMessage('');
              }}
            >
              View
            </button>
          </li>
        ))}
      </ul>

      {selected && (
        <div>
          <h2>{selected.title}</h2>
          {selected.description && <p>{selected.description}</p>}

          {selected.seatsTaken >= selected.capacity ? (
            <p>This event is full.</p>
          ) : (
            <form onSubmit={handleRegister}>
              <input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <button type="submit">Register</button>
            </form>
          )}

          {message && <p>{message}</p>}

          <AttendeeList eventId={selected._id} seatsTaken={selected.seatsTaken} />
        </div>
      )}
    </div>
  );
}

export default App;