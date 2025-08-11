//Used For Local Testing and Development
var express = require('express');
var path = require('path');

var app = express();
var server = app.listen(3000);

// Serve static files from public directory
app.use(express.static('public'));

// Serve level files from levels directory
app.use('/levels', express.static('levels'));

console.log("Singularity game server is running on http://localhost:3000");
