const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');

const app = express();
app.use(express.json());

// Configuração de CORS mais robusta para o ambiente Codespaces
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  
  // Responde imediatamente a requisições de pre-flight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  database: process.env.POSTGRES_DB || 'enquetedb',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

const rc = redis.createClient({ socket: { host: process.env.REDIS_HOST || 'redis' } });
rc.connect().catch(console.error);

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS votos (
        id SERIAL PRIMARY KEY,
        pergunta_id INT NOT NULL,
        opcao VARCHAR(100) NOT NULL,
        total INT DEFAULT 0,
        UNIQUE(pergunta_id, opcao)
      );
    `);
    console.log('Banco de dados inicializado com sucesso');
  } catch (err) {
    console.error('Erro ao inicializar banco de dados:', err);
  }
}

function getQuestions() {
  const raw = process.env.QUESTIONS || JSON.stringify([
    { id: 1, text: "Qual linguagem você prefere?", options: ["Python","JavaScript","Java","Go"] },
    { id: 2, text: "Qual banco de dados você usa mais?", options: ["Postgres","MySQL","MongoDB","SQLite"] },
    { id: 3, text: "Preferência de container orchestration?", options: ["Kubernetes","Docker Swarm","Nomad","Nenhum"] }
  ]);
  return JSON.parse(raw);
}

app.get('/questions', (req, res) => res.json(getQuestions()));

app.post('/vote', async (req, res) => {
  const { answers } = req.body;
  if (!Array.isArray(answers) || answers.length === 0)
    return res.status(400).json({ error: 'answers array required' });
  
  try {
    await rc.rPush('enquete:respostas', JSON.stringify(answers));
    res.json({ ok: true, queued: true });
  } catch (err) {
    console.error('Erro ao enviar para o Redis:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/results', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT pergunta_id, opcao, total FROM votos ORDER BY pergunta_id, total DESC'
    );

    const questions = getQuestions();
    const mapped = rows.map(r => {
      const q = questions.find(q => q.id === r.pergunta_id);
      return {
        pergunta_id: r.pergunta_id,
        pergunta_texto: q ? q.text : null,
        opcao: r.opcao,
        total: r.total
      };
    });
    res.json(mapped);
  } catch (err) {
    console.error('Erro ao buscar resultados:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/health', (req, res) => res.send('ok'));

// Inicializa o DB e sobe o servidor
setTimeout(async () => {
  await initDb();
  app.listen(5000, '0.0.0.0', () => console.log('API rodando em http://0.0.0.0:5000'));
}, 3000);