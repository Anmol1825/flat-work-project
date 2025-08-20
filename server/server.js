const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// This tells the server to serve files from the current directory
app.use(express.static(path.join(__dirname)));

// This tells the server to send index.html when someone visits the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Central database
let tasks = [
    { id: 1, text: "Initial task from server", assignee: "Alex Johnson", completed: false, timestamp: Date.now() }
];
let currentId = 2;

// --- API Endpoints ---
app.get('/tasks', (req, res) => {
    res.json(tasks);
});

app.post('/tasks', (req, res) => {
    const { text, assignee } = req.body;
    if (!text || !assignee) {
        return res.status(400).json({ message: "Task and assignee are required." });
    }
    const newTask = {
        id: currentId++,
        text,
        assignee,
        completed: false,
        timestamp: Date.now()
    };
    tasks.unshift(newTask);
    res.status(201).json(newTask);
});

app.patch('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed;
        res.json(task);
    } else {
        res.status(404).json({ message: "Task not found" });
    }
});

app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    tasks = tasks.filter(t => t.id !== taskId);
    res.status(204).send();
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});