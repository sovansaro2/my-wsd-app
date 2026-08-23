const express = require('express');
const app = express();
app.get('*', (req, res) => res.send('*'));
app.get('/*', (req, res) => res.send('/*'));
app.get('*all', (req, res) => res.send('*all'));
