const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware (in case backend needs it)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// Serve static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Route for the main landing page
app.get('/', (req, res) => {
    console.log('Serving landing page');
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for login page
app.get('/login', (req, res) => {
    console.log('Serving login page');
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Route for register page
app.get('/register', (req, res) => {
    console.log('Serving register page');
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Route for app page (dashboard)
app.get('/app', (req, res) => {
    console.log('Serving app page');
    res.sendFile(path.join(__dirname, 'app.html'));
});

// API proxy routes for backend communication
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8080';

// Proxy login requests to backend
app.post('/api/auth/login', async (req, res) => {
    try {
        console.log('Proxying login request to backend:', `${BACKEND_URL}/api/auth/login`);
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.log('Backend login failed:', response.status, data);
            return res.status(response.status).json(data);
        }

        console.log('Login successful, sending response to frontend');
        res.json(data);
    } catch (error) {
        console.error('Login proxy error:', error);
        // Check if it's a connection error (server offline)
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('fetch failed')) {
            res.status(503).json({ 
                message: 'Server is currently offline. Please try again later.',
                serverOffline: true
            });
        } else {
            res.status(500).json({ message: 'Connection failed. Please try again later.' });
        }
    }
});

// Proxy register requests to backend
app.post('/api/auth/register', async (req, res) => {
    try {
        console.log('Proxying registration request to backend:', `${BACKEND_URL}/api/auth/register`);
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.log('Backend registration failed:', response.status, data);
            return res.status(response.status).json(data);
        }

        console.log('Registration successful, sending response to frontend');
        res.status(201).json(data);
    } catch (error) {
        console.error('Register proxy error:', error);
        // Check if it's a connection error (server offline)
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('fetch failed')) {
            res.status(503).json({ 
                message: 'Server is currently offline. Please try again later.',
                serverOffline: true
            });
        } else {
            res.status(500).json({ message: 'Connection failed. Please try again later.' });
        }
    }
});

// Get products
app.get('/api/products', async (req, res) => {
    try {
        console.log('Proxying products request to backend:', `${BACKEND_URL}/api/products`);
        
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(`${BACKEND_URL}/api/products`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization || ''
            }
        });

        const data = await response.json();
        
        if (!response.ok) {
            console.log('Backend products request failed:', response.status, data);
            return res.status(response.status).json(data);
        }

        res.json(data);
    } catch (error) {
        console.error('Products proxy error:', error);
        // Check if it's a connection error (server offline)
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.message.includes('fetch failed')) {
            res.status(503).json({ 
                message: 'Server is currently offline. Please try again later.',
                serverOffline: true
            });
        } else {
            res.status(500).json({ message: 'Connection failed. Please try again later.' });
        }
    }
});

// Handle 404 errors - redirect unknown routes to index
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Backend URL: ${BACKEND_URL}`);
});

module.exports = app;
