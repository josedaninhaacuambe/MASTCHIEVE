const http = require('http');

const data = JSON.stringify({ email: 'assistente@mastchieve.com', password: 'assistente123' });

const options = {
  hostname: 'localhost',
  port: 4301,
  path: '/api/v1/auth/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
  },
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    try {
      const json = JSON.parse(body);
      console.log(JSON.stringify(json));
    } catch (e) {
      console.log(body);
    }
  });
});

req.on('error', (e) => {
  console.error('Request error', e);
});

req.write(data);
req.end();
