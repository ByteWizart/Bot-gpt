const express = require('express');
const app = express();
const port = 3000;

// Definição da API Key
const API_KEY = 'ptlc_7C05TK7KX36EaL7Kf5c6pRr841E6Tt1roWB9lkQPiK3';

// Status do pterodáctilo (simulado)
let status = 'stopped'; // Pode ser: 'running', 'stopped', 'restarting'

app.use(express.json());

// Middleware para checar a API Key
function authMiddleware(req, res, next) {
  const key = req.headers['x-api-key'];
  if (key && key === API_KEY) {
    next();
  } else {
    res.status(401).json({ error: 'API Key inválida ou ausente' });
  }
}

// Página principal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Controle do Pterodáctilo</title>
      <style>
        body { font-family: sans-serif; text-align: center; margin-top: 50px; }
        button { padding: 10px 20px; margin: 10px; font-size: 16px; }
        .status { margin-top: 20px; font-size: 20px; }
        .ball {
          display: inline-block;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          margin-left: 10px;
        }
        .running { background: green; }
        .stopped { background: red; }
        .restarting { background: orange; }
      </style>
    </head>
    <body>
      <h1>Controle do Pterodáctilo</h1>
      <button onclick="start()">Start</button>
      <button onclick="restart()">Restart</button>
      <div class="status">
        Status: <span id="statusText">?</span>
        <span id="statusBall" class="ball stopped"></span>
      </div>

      <script>
        const apiKey = 'ptlc_7C05TK7KX36EaL7Kf5c6pRr841E6Tt1roWB9lkQPiK3';

        async function updateStatus() {
          const res = await fetch('/status');
          const data = await res.json();
          document.getElementById('statusText').innerText = data.status;
          const ball = document.getElementById('statusBall');
          ball.className = 'ball ' + data.status;
        }

        async function start() {
          await fetch('/start', {
            method: 'POST',
            headers: { 'x-api-key': apiKey }
          });
          updateStatus();
        }

        async function restart() {
          await fetch('/restart', {
            method: 'POST',
            headers: { 'x-api-key': apiKey }
          });
          updateStatus();
        }

        setInterval(updateStatus, 2000);
        updateStatus();
      </script>
    </body>
    </html>
  `);
});

// Rota pública para status
app.get('/status', (req, res) => {
  res.json({ status });
});

// Rota protegida: start
app.post('/start', authMiddleware, (req, res) => {
  status = 'running';
  res.json({ status });
});

// Rota protegida: restart
app.post('/restart', authMiddleware, (req, res) => {
  status = 'restarting';
  setTimeout(() => {
    status = 'running';
  }, 2000);
  res.json({ status: 'restarting' });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
