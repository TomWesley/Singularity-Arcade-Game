//Used For Local Testing and Development
var express = require('express');

var app = express();
var server = app.listen(3000);
app.use(express.static('public'));

console.log("My socket server is running");
