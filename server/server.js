const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-super-secret-key-that-should-be-long-and-random';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- PAGE SERVING ROUTES ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- NEW INSTRUCTIONS FOR LOGIN AND REGISTER PAGES ---
app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/register.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});
// ---------------------------------------------------


// --- DATABASES ---
let users = [];
let tasks = [];
let currentUserId = 1;
let currentTaskId = 1;

// --- USER AUTHENTICATION ROUTES ---
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send('Email and password are required.');
        }
        if (users.find(user => user.email === email)) {
            return res.status(400).send('User with this email already exists.');
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { id: currentUserId++, email: email, password: hashedPassword };
        users.push(newUser);
        res.status(201).send('User registered successfully.');
    } catch (error) {
        res.status(500).send('Server error during registration.');
    }
});

app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).send('Invalid credentials.');
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials.');
        }
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(500).send('Server error during login.');
    }
});

// --- MIDDLEWARE TO PROTECT ROUTES ---
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};

// --- TASK ROUTES (PROTECTED) ---
app.get('/tasks', authenticateToken, (req, res) => {
    const userTasks = tasks.filter(task => task.assignee === req.user.email);
    res.json(userTasks);
});

app.post('/tasks', authenticateToken, (req, res) => {
    const { text, deadline } = req.body;
    const assignee = req.body.assignee || req.user.email;
    if (!text || !assignee) {
        return res.status(400).json({ message: "Task and assignee are required." });
    }
    const newTask = {
        id: currentTaskId++, text, assignee, completed: false,
        timestamp: Date.now(), deadline: deadline || null, ownerId: req.user.userId
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

app.patch('/tasks/:id', authenticateToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (task && task.assignee === req.user.email) {
        task.completed = !task.completed;
        res.json(task);
    } else {
        res.status(404).send('Task not found or you do not have permission.');
    }
});

app.delete('/tasks/:id', authenticateToken, (req, res) => {
    const taskId = parseInt(req.params.id);
    const initialLength = tasks.length;
    tasks = tasks.filter(t => !(t.id === taskId && t.ownerId === req.user.userId));
    if (tasks.length < initialLength) {
        res.status(204).send();
    } else {
        res.status(404).send('Task not found or you do not have permission.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});