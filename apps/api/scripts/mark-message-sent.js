const http = require('http');

function postJson(path, data) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(data);
    const options = {
      hostname: 'localhost',
      port: 4301,
      path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    };
    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', (c) => (resp += c));
      res.on('end', () => resolve({ status: res.statusCode, body: resp }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function put(path, token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 4301,
      path,
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
    const req = http.request(options, (res) => {
      let resp = '';
      res.on('data', (c) => (resp += c));
      res.on('end', () => resolve({ status: res.statusCode, body: resp }));
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  // login
  const login = await postJson('/api/v1/auth/login', { email: 'assistente@mastchieve.com', password: 'assistente123' });
  const parsed = JSON.parse(login.body);
  const token = parsed.accessToken || (parsed.data && parsed.data.accessToken) || parsed.data?.access_token || parsed.access_token;
  console.log('Obtained token, length:', token.length);

  // mark as sent (use the id created earlier)
  const messageId = 'ebd8ed79-47d2-4120-b30e-b5b5501653e0';
  const res = await put(`/api/v1/whatsapp/${messageId}/enviada`, token);
  console.log('PUT response status:', res.status);
  console.log('PUT body:', res.body);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
