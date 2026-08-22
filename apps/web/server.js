// Servidor customizado Next.js para cPanel (Phusion Passenger)
// O cPanel injeta automaticamente a PORT via variável de ambiente
const { createServer } = require('http');
const next = require('next');

// Forçado a `false`: o Phusion Passenger nem sempre propaga NODE_ENV=production
// ao processo Node, e o Next.js cairia silenciosamente em modo dev (compilação
// sob-demanda lenta para cada visitante) se isso acontecesse.
const dev = false;
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(port, '0.0.0.0', () => {
      console.log(`Mastchieve Web PRODUCTION ativo na porta ${port}`);
    });
  })
  .catch((err) => {
    console.error('Erro ao iniciar Mastchieve Web:', err);
    process.exit(1);
  });
