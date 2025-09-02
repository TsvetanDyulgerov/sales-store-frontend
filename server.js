/**
 * Sales Store Frontend Server
 * Main server file with modular organization
 */

const express = require('express');
const path = require('path');

// Import middleware
const corsMiddleware = require('./server/middleware/cors');

// Import route handlers
const setupAuthRoutes = require('./server/routes/auth');
const setupUserRoutes = require('./server/routes/users');
const setupProductRoutes = require('./server/routes/products');
const setupPageRoutes = require('./server/routes/pages');

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

// Setup page routes (should be last to handle catch-all)
setupPageRoutes(app);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Backend URL: ${process.env.BACKEND_URL || 'http://localhost:8080'}`);
    console.log('Serving files from organized structure:');
    console.log('  - Pages: src/pages/');
    console.log('  - JavaScript: src/js/');
    console.log('  - CSS: src/css/');
});

module.exports = app;
