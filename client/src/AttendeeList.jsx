import { useEffect, useState } from 'react';
import { API } from './api';

function AttendeeList({ eventId, seatsTaken, adminKey }) {
  const [attendees, setAttendees] = useState([]);

  useEffect(() => {
    fetch(`${API}/events/${eventId}/attendees`, {
      headers: { 'x-admin-key': adminKey },
    })
      .then((res) => res.json())
      .then((data) => setAttendees(Array.isArray(data) ? data : []));
  }, [eventId, seatsTaken, adminKey]);

  return (
    <div>
      <h3>Attendees ({attendees.length})</h3>
      {attendees.length === 0 ? (
        <p>No one has registered yet.</p>
      ) : (
        <ol>
          {attendees.map((a) => (
            <li key={a._id}>
              {a.name} · {a.email}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export default AttendeeList;