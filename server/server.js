const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt'); // <-- NEW SECURITY TOOL
const jwt = require('jsonwebtoken'); // <-- NEW SECURITY TOOL
const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'your-super-secret-key-that-should-be-long-and-random'; // Secret key for tokens

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// --- TEMPORARY IN-MEMORY DATABASES ---
// In a real app, this would be a real database like MongoDB.
let users = []; // New database for users
let tasks = []; // Task database
let currentUserId = 1;
let currentTaskId = 1;

// --- USER AUTHENTICATION ROUTES ---

// POST /register: Create a new user account
app.post('/register', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send('Email and password are required.');
        }

        // Check if user already exists
        if (users.find(user => user.email === email)) {
            return res.status(400).send('User with this email already exists.');
        }

        // Hash the password for security
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            id: currentUserId++,
            email: email,
            password: hashedPassword
        };
        users.push(newUser);
        console.log('New user registered:', newUser);
        res.status(201).send('User registered successfully.');

    } catch (error) {
        res.status(500).send('Server error during registration.');
    }
});

// POST /login: Log in a user and give them a token
app.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(400).send('Invalid credentials.');
        }

        // Check if password is correct
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).send('Invalid credentials.');
        }

        // Create a JWT access pass
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ token });

    } catch (error) {
        res.status(500).send('Server error during login.');
    }
});


// --- MIDDLEWARE TO PROTECT ROUTES ---
// This is a security check that runs before any task-related request.
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) return res.sendStatus(401); // No token, no access

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403); // Token is invalid, no access
        req.user = user; // Add the user info to the request
        next(); // User is verified, proceed to the requested route
    });
};


// --- TASK ROUTES (NOW PROTECTED) ---

// Serve the main index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// GET /tasks: Now only returns tasks for the logged-in user
app.get('/tasks', authenticateToken, (req, res) => {
    // Note: The original overdue logic is removed for simplicity now. 
    // We can add it back later. This version focuses on user accounts.
    const userTasks = tasks.filter(task => task.assignee === req.user.email);
    res.json(userTasks);
});

// POST /tasks: Now uses the logged-in user's email
app.post('/tasks', authenticateToken, (req, res) => {
    const { text, deadline } = req.body;
    const assignee = req.body.assignee || req.user.email; // Assign to someone else or self

    if (!text || !assignee) {
        return res.status(400).json({ message: "Task and assignee are required." });
    }

    const newTask = {
        id: currentTaskId++,
        text,
        assignee,
        completed: false,
        timestamp: Date.now(),
        deadline: deadline || null,
        ownerId: req.user.userId
    };
    tasks.push(newTask);
    res.status(201).json(newTask);
});

// (The PATCH and DELETE routes would also need the 'authenticateToken' middleware)
app.patch('/tasks/:id', authenticateToken, (req, res) => {
    // Logic to update a task
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (task && task.assignee === req.user.email) { // Ensure user can only complete their own task
        task.completed = !task.completed;
        res.json(task);
    } else {
        res.status(404).send('Task not found or you do not have permission.');
    }
});

app.delete('/tasks/:id', authenticateToken, (req, res) => {
    // Logic to delete a task
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