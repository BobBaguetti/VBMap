const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = 3000;

// Admin credentials (store these securely in production!)
const users = { admin: process.env.ADMIN_PASSWORD || 'your_secure_password' };

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Admin routes with authentication
app.use('/admin*', basicAuth({ users, challenge: true }));

// API endpoint to save markers
app.post('/api/save-markers', (req, res) => {
  fs.writeFileSync(
    path.join(__dirname, 'data/markerData.json'),
    JSON.stringify(req.body, null, 2)
  );
  res.sendStatus(200);
});

// Serve different frontends based on route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
