const express = require('express');
const cors = require('cors');
const path = require('path'); // <-- This is one of the new lines
const app = express();
const PORT = process.env.PORT || 3000; // Use Render's port or 3000 locally

app.use(cors());
app.use(express.json());

// --- THESE ARE THE NEW LINES TO SERVE YOUR WEBSITE ---
// This part tells the server to make the folder public
app.use(express.static(path.join(__dirname)));

// This part tells the server to send the index.html file when someone visits the main URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
// ----------------------------------------------------

// Central database (in-memory array)
let tasks = [
    { id: 1, text: "Initial task from server", assignee: "Alex Johnson", completed: false, timestamp: Date.now() }
];
let currentId = 2;

// --- API Endpoints (No change here) ---

// GET /tasks: Send the full list of tasks
app.get('/tasks', (req, res) => {
    res.json(tasks);
});

// POST /tasks: Add a new task
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

// PATCH /tasks/:id: Update a task's status
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

// DELETE /tasks/:id: Remove a task
app.delete('/tasks/:id', (req, res) => {
    const taskId = parseInt(req.params.id);
    tasks = tasks.filter(t => t.id !== taskId);
    res.status(204).send();
});


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});