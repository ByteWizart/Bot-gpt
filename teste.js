const express = require('express');
const axios = require('axios');
const os = require('os');
const app = express();
const port = process.env.PORT || 3000;

// Definição da API Key e URL do painel Pterodactyl
const PANEL_URL = 'https://backend.magmanode.com'; // URL do seu painel Pterodactyl
const API_KEY = 'sua_api_key_aqui'; // Sua chave API do painel Pterodactyl

// Status do pterodáctilo (inicialmente desconhecido)
let status = 'desconhecido';

// Função para obter todos os servidores
async function getAllServers() {
  try {
    const response = await axios.get(`${PANEL_URL}/api/client/servers`, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      }
    });
    return response.data.data; // Retorna a lista de servidores
  } catch (err) {
    console.error('Erro ao obter lista de servidores:', err.response?.data || err.message);
    return [];
  }
}

// Função para ligar um servidor Minecraft
async function startServer(serverId) {
  try {
    const response = await axios.post(`${PANEL_URL}/api/client/servers/${serverId}/power`, {
      signal: 'start'
    }, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
      }
    });
    console.log(`Servidor ${serverId} ligado com sucesso!`);
  } catch (err) {
    console.error(`Erro ao ligar o servidor ${serverId}:`, err.response?.data || err.message);
  }
}

// Função para atualizar o status de todos os servidores
async function updateStatus() {
  const servers = await getAllServers();
  if (servers.length === 0) {
    status = 'sem servidores';
    return;
  }

  // Verifica o status de cada servidor
  let allServersRunning = true;
  for (let server of servers) {
    const serverId = server.attributes.identifier;
    try {
      const response = await axios.get(`${PANEL_URL}/api/client/servers/${serverId}/resources`, {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
        }
      });
      const serverStatus = response.data.attributes.current_state;
      if (serverStatus !== 'running') {
        allServersRunning = false;
        break;
      }
    } catch (err) {
      console.error(`Erro ao verificar status do servidor ${serverId}:`, err.response?.data || err.message);
      allServersRunning = false;
      break;
    }
  }

  status = allServersRunning ? 'running' : 'offline';
}

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
      <button onclick="startAll()">Ligar Todos</button>
      <div class="status">
        Status: <span id="statusText">?</span>
        <span id="statusBall" class="ball stopped"></span>
      </div>
      <div class="ip">
        <p>IP da Máquina: <span id="ipAddress">Aguarde...</span></p>
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

        async function startAll() {
          await fetch('/start-all', {
            method: 'POST',
            headers: { 'x-api-key': apiKey }
          });
          updateStatus();
        }

        // Exibe o IP da máquina
        async function displayLocalIP() {
          const res = await fetch('/get-ip');
          const data = await res.json();
          document.getElementById('ipAddress').innerText = data.ip;
        }

        setInterval(updateStatus, 2000);
        updateStatus();
        displayLocalIP();
      </script>
    </body>
    </html>
  `);
});

// Rota pública para status
app.get('/status', async (req, res) => {
  await updateStatus();
  res.json({ status });
});

// Rota protegida para ligar todos os servidores
app.post('/start-all', authMiddleware, async (req, res) => {
  const servers = await getAllServers();
  if (servers.length === 0) {
    return res.status(404).json({ error: 'Nenhum servidor encontrado.' });
  }

  // Itera sobre todos os servidores e envia o comando para ligar cada um
  for (let server of servers) {
    const serverId = server.attributes.identifier;
    await startServer(serverId);
  }

  res.json({ message: 'Todos os servidores estão sendo ligados.' });
});

// Função para pegar o IP da máquina
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let ipAddress = 'não encontrado';
  for (const name in interfaces) {
    for (const net of interfaces[name]) {
      if (net.family === 'IPv4' && !net.internal) {
        ipAddress = net.address;
        break;
      }
    }
  }
  return ipAddress;
}

// Rota para retornar o IP da máquina
app.get('/get-ip', (req, res) => {
  const ipAddress = getLocalIP();
  res.json({ ip: ipAddress });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
  console.log(`IP da máquina: ${getLocalIP()}`);
});
