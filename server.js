const express = require('express');
const fs = require('fs');
const path = require('path');
const basicAuth = require('express-basic-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const DATA_FILE = path.join(__dirname, 'data/markerData.json'); // Using your existing filename
const ADMIN_CREDENTIALS = { 
  admin: process.env.ADMIN_PASSWORD || '1' 
};

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static Files (organized to avoid duplication)
app.use(express.static('docs'));
app.use('/admin', express.static('admin'));

// Authentication
app.use('/admin*', basicAuth({
  users: ADMIN_CREDENTIALS,
  challenge: true,
  realm: 'VBMap Admin Area'
}));

// API Endpoints
app.post('/api/save-markers', (req, res) => {
  try {
    // Read existing data
    let existingData = [];
    if (fs.existsSync(DATA_FILE)) {
      existingData = JSON.parse(fs.readFileSync(DATA_FILE));
    }

    // Handle both single marker and bulk updates
    const newData = Array.isArray(req.body) ? req.body : [req.body];
    
    // Merge data
    newData.forEach(marker => {
      const index = existingData.findIndex(m => m.id === marker.id);
      if (index >= 0) {
        existingData[index] = marker; // Update existing
      } else {
        existingData.push(marker); // Add new
      }
    });

    // Save back to file
    fs.writeFileSync(DATA_FILE, JSON.stringify(existingData, null, 2));
    res.status(200).json({ success: true, count: newData.length });
  } catch (err) {
    console.error('Error saving markers:', err);
    res.status(500).json({ error: 'Failed to save markers' });
  }
});

// Get all markers (for public map)
app.get('/api/markers', (req, res) => {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return res.json([]);
    }
    const data = JSON.parse(fs.readFileSync(DATA_FILE));
    res.json(data);
  } catch (err) {
    console.error('Error loading markers:', err);
    res.status(500).json({ error: 'Failed to load markers' });
  }
});

// Route Handling
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin/index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Server Initialization
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin interface: http://localhost:${PORT}/admin`);
  
  // Ensure data directory exists
  if (!fs.existsSync(path.join(__dirname, 'data'))) {
    fs.mkdirSync(path.join(__dirname, 'data'));
  }
  
  // Initialize empty marker file if needed
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]');
    console.log('Created new marker data file');
  }
});
