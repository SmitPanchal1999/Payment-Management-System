const express = require('express');
const path = require('path');
const app = express();

// Serve static files
app.use(express.static('./dist/payment-management-system'));

// Send all requests to index.html
app.get('/*', function(req, res) {
  res.sendFile('index.html', {root: 'dist/payment-management-system/'});
});

// Start the app by listening on the default Heroku port
app.listen(process.env.PORT || 8080);