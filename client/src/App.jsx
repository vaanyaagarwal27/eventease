import { useEffect, useState } from 'react';
import { API } from './api';
import CreateEventForm from './CreateEventForm';
import AttendeeList from './AttendeeList';
import './App.css';

function formatDate(date) {
  return new Date(date).toLocaleString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function App() {
  const [mode, setMode] = useState('register');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [adminKey, setAdminKey] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState('');

  const selected = events.find((event) => event._id === selectedId);

  function loadEvents() {
    fetch(`${API}/events`)
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        setLoading(false);
      });
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function switchMode(newMode) {
    setMode(newMode);
    setSelectedId(null);
    setMessage('');
  }

  function openEvent(id) {
    setSelectedId(id);
    setMessage('');
  }

  async function handleUnlock(e) {
    e.preventDefault();
    const res = await fetch(`${API}/admin/check`, {
      headers: { 'x-admin-key': keyInput },
    });
    if (res.ok) {
      setAdminKey(keyInput);
      setKeyError('');
    } else {
      setKeyError('That admin key is not correct.');
    }
  }

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
    <div className="app">
      <header className="header">
        <h1>EventEase</h1>
        <nav className="tabs">
          <button
            className={mode === 'register' ? 'tab active' : 'tab'}
            onClick={() => switchMode('register')}
          >
            Register
          </button>
          <button
            className={mode === 'organise' ? 'tab active' : 'tab'}
            onClick={() => switchMode('organise')}
          >
            Organise
          </button>
        </nav>
      </header>

      {mode === 'organise' && !adminKey ? (
        <form className="create-form" onSubmit={handleUnlock}>
          <h2>Organiser access</h2>
          <p className="muted">Enter the admin key to create events and see attendee lists.</p>
          <input
            type="password"
            placeholder="Admin key"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
          />
          <button type="submit">Unlock</button>
          {keyError && <p className="notice">{keyError}</p>}
        </form>
      ) : (
        <>
          {mode === 'organise' && <CreateEventForm onCreated={loadEvents} adminKey={adminKey} />}

          <main className="layout">
            <section className="event-list">
              <h2>{mode === 'register' ? 'Upcoming workshops' : 'All events'}</h2>

              {loading && (
                <p className="muted">Waking up the server… this can take up to a minute.</p>
              )}

              {events.map((event) => {
                const full = event.seatsTaken >= event.capacity;
                return (
                  <button
                    key={event._id}
                    className={event._id === selectedId ? 'event-card selected' : 'event-card'}
                    onClick={() => openEvent(event._id)}
                  >
                    <span className="event-title">{event.title}</span>
                    <span className="event-meta">
                      {event.venue} · {formatDate(event.date)}
                    </span>
                    <span className={full ? 'seats full' : 'seats'}>
                      {full ? 'Full' : `${event.capacity - event.seatsTaken} seats left`}
                    </span>
                  </button>
                );
              })}
            </section>

            {selected ? (
              <section className="panel">
                <h2>{selected.title}</h2>
                <p className="event-meta">
                  {selected.venue} · {formatDate(selected.date)}
                </p>
                {selected.description && <p>{selected.description}</p>}
                <p className="seat-count">
                  {selected.seatsTaken} / {selected.capacity} seats taken
                </p>

                {mode === 'register' &&
                  (selected.seatsTaken >= selected.capacity ? (
                    <p className="notice">This event is full.</p>
                  ) : (
                    <form className="form" onSubmit={handleRegister}>
                      <input
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                      <input
                        type="email"
                        placeholder="Your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                      <button type="submit">Register</button>
                    </form>
                  ))}

                {message && <p className="notice">{message}</p>}

                {mode === 'organise' && (
                  <AttendeeList
                    eventId={selected._id}
                    seatsTaken={selected.seatsTaken}
                    adminKey={adminKey}
                  />
                )}
              </section>
            ) : (
              <section className="panel empty">
                <p>Pick an event to see its details.</p>
              </section>
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;