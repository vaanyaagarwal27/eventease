import { useEffect, useState } from 'react';
import { API } from './api';

function AttendeeList({ eventId, seatsTaken }) {
  const [attendees, setAttendees] = useState([]);

  useEffect(() => {
    fetch(`${API}/events/${eventId}/attendees`)
      .then((res) => res.json())
      .then((data) => setAttendees(data));
  }, [eventId, seatsTaken]);

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