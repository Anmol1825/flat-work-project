// server/server.js

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000; // Our server will run on this port

app.use(cors()); // Allows your website to talk to this server
app.use(express.json()); // Allows server to understand JSON data

// Central database (for this example, it's a simple in-memory array)
// In a real app, you would connect to a database like MongoDB here.
let tasks = [
    { id: 1, text: "Initial task from server", assignee: "Alex Johnson", completed: false, timestamp: Date.now() }
];
let currentId = 2;

// --- API Endpoints ---

// GET /tasks: Send the full list of tasks to any device that asks
app.get('/tasks', (req, res) => {
    res.json(tasks);
});

// POST /tasks: Add a new task to the central list
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
    res.status(201).json(newTask); // Send back the new task
});

// PATCH /tasks/:id: Update a task's status (e.g., mark as complete)
app.patch('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    const task = tasks.find(t => t.id === taskId);
    if (task) {
        task.completed = !task.completed; // Toggle the status
        res.json(task);
    } else {
        res.status(404).json({ message: "Task not found" });
    }
});

// DELETE /tasks/:id: Remove a task from the list
app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    tasks = tasks.filter(t => t.id !== taskId);
    res.status(204).send(); // No content to send back
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});