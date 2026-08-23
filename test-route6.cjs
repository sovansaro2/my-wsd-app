const express = require('express');
const app = express();
app.get('*all', (req, res) => {
  console.log('Caught by *all');
  res.end();
});
const req = { method: 'GET', url: '/test', headers: {} };
const res = { 
  setHeader: () => {}, 
  send: (msg) => console.log('Result:', msg),
  end: () => console.log('End called')
};
app.handle(req, res, () => console.log('404 Not Found'));
