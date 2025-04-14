const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const DATA_FILE = path.join(__dirname, 'docs/data/markerData.json');
const ADMIN_CREDENTIALS = { 
  admin: process.env.ADMIN_PASSWORD || '1' 
};

// Middleware
app.use(express.json());
app.use(express.static('docs'));
app.use('/admin', express.static('admin'));

// Auth
app.use('/admin*', basicAuth({
  users: ADMIN_CREDENTIALS,
  challenge: true
}));

// API Endpoints
app.post('/api/save-markers', (req, res) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 2));
  res.sendStatus(200);
});

app.get('/api/markers', (req, res) => {
  try {
    const data = fs.existsSync(DATA_FILE)
      ? JSON.parse(fs.readFileSync(DATA_FILE))
      : [];
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Routes
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'docs/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
  
  // Ensure data directory exists
  if (!fs.existsSync(path.dirname(DATA_FILE))) {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  }
});