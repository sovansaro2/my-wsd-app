const express = require('express');
const app = express();
app.get('*all', (req, res) => {
  res.send('Caught by *all');
});
app.get('/(.*)', (req, res) => {
  res.send('Caught by /(.*)');
});
const req = { method: 'GET', url: '/test' };
const res = { send: (msg) => console.log('Result:', msg) };
app.handle(req, res, () => console.log('404 Not Found'));
