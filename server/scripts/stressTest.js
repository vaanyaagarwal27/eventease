const BASE = 'http://localhost:3000/api';

async function main() {
  const res = await fetch(`${BASE}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Stress Test',
      venue: 'Test Hall',
      date: '2026-12-01T10:00:00',
      capacity: 10,
    }),
  });
  const event = await res.json();

  const requests = [];
  for (let i = 1; i <= 50; i++) {
    requests.push(
      fetch(`${BASE}/events/${event._id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: `User ${i}`, email: `user${i}@test.com` }),
      })
    );
  }
  const responses = await Promise.all(requests);

  const succeeded = responses.filter((r) => r.status === 201).length;
  const rejected = responses.filter((r) => r.status === 409).length;

  const final = await (await fetch(`${BASE}/events/${event._id}`)).json();
  const attendees = await (await fetch(`${BASE}/events/${event._id}/attendees`)).json();

  console.log(`Capacity:            ${event.capacity}`);
  console.log(`Requests sent:       50 (simultaneously)`);
  console.log(`Succeeded (201):     ${succeeded}`);
  console.log(`Rejected (409):      ${rejected}`);
  console.log(`seatsTaken in DB:    ${final.seatsTaken}`);
  console.log(`Registrations in DB: ${attendees.length}`);
  console.log(
    final.seatsTaken <= event.capacity && attendees.length === final.seatsTaken
      ? 'PASS: no overbooking'
      : 'FAIL: overbooked!'
  );
}

main();