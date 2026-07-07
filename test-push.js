fetch('http://localhost:3000/api/send-push-all', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: "Test", body: "Test" })
})
.then(r => r.json().then(j => ({status: r.status, body: j})))
.then(console.log)
.catch(console.error);
