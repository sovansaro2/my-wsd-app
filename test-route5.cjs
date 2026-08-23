const express = require('express');
const app = express();
app.get('*all', (req, res) => {
  res.send('Caught by *all');
});
const req = { method: 'GET', url: '/test' };
const res = { 
  setHeader: () => {}, 
  send: (msg) => console.log('Result:', msg),
  end: () => {}
};
app.handle(req, res, () => console.log('404 Not Found'));
