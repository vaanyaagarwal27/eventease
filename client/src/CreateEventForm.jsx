import { useState } from 'react';
import { API } from './api';

const emptyForm = { title: '', venue: '', date: '', capacity: '', description: '' };

function CreateEventForm({ onCreated }) {
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState('');

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await fetch(`${API}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        capacity: Number(form.capacity),
        date: form.date ? new Date(form.date).toISOString() : '',
      }),
    });
    const data = await res.json();

    if (res.ok) {
      setMessage(`Created "${data.title}"`);
      setForm(emptyForm);
      onCreated();
    } else {
      setMessage(data.error);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2>Create an event</h2>
      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} />
      <input name="venue" placeholder="Venue" value={form.venue} onChange={handleChange} />
      <input name="date" type="datetime-local" value={form.date} onChange={handleChange} />
      <input
        name="capacity"
        type="number"
        min="1"
        placeholder="Capacity"
        value={form.capacity}
        onChange={handleChange}
      />
      <textarea
        name="description"
        placeholder="Description (optional)"
        value={form.description}
        onChange={handleChange}
      />
      <button type="submit">Create</button>
      {message && <p>{message}</p>}
    </form>
  );
}

export default CreateEventForm;