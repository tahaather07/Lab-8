const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory data storage
const users = [];
const events = [];

// Helper function to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied' });

  jwt.verify(token, 'secret_key', (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid token' });
    req.user = user;
    next();
  });
};

// User Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: users.length + 1,
      username,
      password: hashedPassword
    };
    
    users.push(user);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, 'secret_key');
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Event Routes
app.post('/api/events', authenticateToken, (req, res) => {
  const { name, description, date, time, category } = req.body;
  const event = {
    id: events.length + 1,
    userId: req.user.id,
    name,
    description,
    date,
    time,
    category,
    createdAt: new Date()
  };
  
  events.push(event);
  res.status(201).json(event);
});

app.get('/api/events', authenticateToken, (req, res) => {
  const userEvents = events.filter(event => event.userId === req.user.id);
  
  // Sort by date
  const { sort, category } = req.query;
  let filteredEvents = [...userEvents];

  if (category) {
    filteredEvents = filteredEvents.filter(event => event.category === category);
  }

  if (sort === 'date') {
    filteredEvents.sort((a, b) => new Date(a.date) - new Date(b.date));
  } else if (sort === 'category') {
    filteredEvents.sort((a, b) => a.category.localeCompare(b.category));
  }

  res.json(filteredEvents);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 