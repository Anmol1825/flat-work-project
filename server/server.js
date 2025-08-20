const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

let tasks = [
    { id: 1, text: "Initial task from server", assignee: "Alex Johnson", completed: false, timestamp: Date.now(), deadline: null }
];
let currentId = 2;

// --- API Endpoints ---

app.get('/tasks', (req, res) => {
    const now = Date.now();
    const overdueTasks = tasks.filter(task => !task.completed && task.deadline && task.deadline < now && !task.overdueProcessed);

    if (overdueTasks.length > 0) {
        overdueTasks.forEach(overdueTask => {
            const delinquentAssignee = overdueTask.assignee;
            const potentialTasksToReassign = tasks.filter(t => !t.completed && t.assignee !== delinquentAssignee);

            if (potentialTasksToReassign.length > 0) {
                const randomTask = potentialTasksToReassign[Math.floor(Math.random() * potentialTasksToReassign.length)];
                randomTask.assignee = delinquentAssignee;
            }

            overdueTask.overdueProcessed = true;
        });
    }
    res.json(tasks);
});

app.post('/tasks', (req, res) => {
    const { text, assignee, deadline } = req.body;
    if (!text || !assignee) {
        return res.status(400).json({ message: "Task and assignee are required." });
    }
    const newTask = {
        id: currentId++,
        text,
        assignee,
        completed: false,
        timestamp: Date.now(),
        deadline: deadline || null,
        overdueProcessed: false
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