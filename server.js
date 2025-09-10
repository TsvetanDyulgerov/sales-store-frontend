/**
 * Sales Store Frontend Server
 * Main server file with modular organization
 */
require('dotenv').config();

const express = require('express');
const path = require('path');

// Import middleware
const corsMiddleware = require('./server/middleware/cors');

// Import route setup functions
const setupPageRoutes = require('./server/routes/pages');
const setupAuthRoutes = require('./server/routes/auth');
const setupUserRoutes = require('./server/routes/users');
const setupProductRoutes = require('./server/routes/products');
const setupOrderRoutes = require('./server/routes/orders');
const setupReportsRoutes = require('./server/routes/reports');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

// Serve static files from organized structure
app.use('/css', express.static(path.join(__dirname, 'src/css')));
app.use('/js', express.static(path.join(__dirname, 'src/js')));
app.use('/assets', express.static(path.join(__dirname, 'assets'))); // For future assets

// Setup API routes
setupAuthRoutes(app);
setupUserRoutes(app);
setupProductRoutes(app);
setupOrderRoutes(app);
setupReportsRoutes(app);

// Setup page routes (should be last to handle catch-all)
setupPageRoutes(app);

// Start the server

const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
    console.log(`Backend URL: ${process.env.BACKEND_URL || 'http://localhost:8080'}`);
    console.log('Serving files from organized structure:');
    console.log('  - Pages: src/pages/');
    console.log('  - JavaScript: src/js/');
    console.log('  - CSS: src/css/');
});

function shutdown(signal) {
    console.log(`Received ${signal}. Shutting down server...`);
    server.close(() => {
        console.log('Server closed. Exiting process.');
        process.exit(0);
    });
    // Force exit if not closed in 5 seconds
    setTimeout(() => {
        console.error('Force exiting after timeout.');
        process.exit(1);
    }, 5000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;
