// Servidor customizado Next.js para cPanel (Phusion Passenger)
// O cPanel injeta automaticamente a PORT via variável de ambiente
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(port, '0.0.0.0', () => {
    console.log(`Mastchieve Web ready on port ${port}`);
  });
});
