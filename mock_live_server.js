const express = require('express');
const app = express();

app.get('/', (req, res) => res.sendFile(__dirname + '/test_live_js.html'));
app.get('/live_assets.js', (req, res) => res.sendFile(__dirname + '/live_assets2.js'));

app.listen(5003, () => console.log('Mock server on 5003'));
