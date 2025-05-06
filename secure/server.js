const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = 3001;
const JWT_SECRET = 'secure-secret-key';

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory database for demonstration
const users = [
    { id: 101, username: 'alice', password: 'alice123', role: 'student', name: 'Alice Smith' },
    { id: 102, username: 'bob', password: 'bob123', role: 'student', name: 'Bob Johnson' },
    { id: 103, username: 'admin', password: 'admin123', role: 'admin', name: 'Admin User' }
];

const grades = [
    { id: 1, userId: 101, course: 'Mathematics', grade: 85 },
    { id: 2, userId: 101, course: 'Science', grade: 92 },
    { id: 3, userId: 102, course: 'Mathematics', grade: 78 },
    { id: 4, userId: 102, course: 'Science', grade: 88 }
];

// Authentication endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = jwt.sign(
        { userId: user.id, username: user.username, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h' }
    );
    
    res.json({ token, user: { id: user.id, username: user.username, role: user.role, name: user.name } });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ message: 'Access denied. No token provided.' });
    }
    
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ message: 'Invalid token.' });
    }
};

// SECURE ENDPOINT - Authorization check for userId
// Get user profile - Protected against BOLA
app.get('/api/users/:userId', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.userId);
    const user = users.find(u => u.id === userId);
    
    if (!user) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // SECURE: Check if the logged-in user is requesting their own profile or is an admin
    if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You can only view your own profile.' });
    }
    
    const userProfile = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role
    };
    
    res.json(userProfile);
});

// SECURE ENDPOINT - Authorization check for userId
// Update user profile - Protected against BOLA
app.put('/api/users/:userId', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.userId);
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
        return res.status(404).json({ message: 'User not found' });
    }
    
    // SECURE: Check if the logged-in user is updating their own profile or is an admin
    if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You can only update your own profile.' });
    }
    
    const { name } = req.body;
    users[userIndex].name = name;
    
    res.json({ message: 'User updated successfully', user: users[userIndex] });
});

// Get student grades - Protected against BOLA
app.get('/api/grades/:userId', authenticateToken, (req, res) => {
    const userId = parseInt(req.params.userId);
    const userGrades = grades.filter(g => g.userId === userId);
    
    if (userGrades.length === 0) {
        return res.status(404).json({ message: 'No grades found for this user' });
    }
    
    // SECURE: Check if the logged-in user is requesting their own grades or is an admin
    if (req.user.userId !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. You can only view your own grades.' });
    }
    
    res.json(userGrades);
});

// Update student grade - Protected against BOLA
app.put('/api/grades/:gradeId', authenticateToken, (req, res) => {
    const gradeId = parseInt(req.params.gradeId);
    const gradeIndex = grades.findIndex(g => g.id === gradeId);
    
    if (gradeIndex === -1) {
        return res.status(404).json({ message: 'Grade not found' });
    }
    
    // SECURE: Check if user is admin
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can update grades' });
    }
    
    const { grade } = req.body;
    grades[gradeIndex].grade = grade;
    
    res.json({ message: 'Grade updated successfully', grade: grades[gradeIndex] });
});

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Secure server running on http://localhost:${PORT}`);
    console.log('SECURE VERSION - Protected against BOLA vulnerabilities');
});