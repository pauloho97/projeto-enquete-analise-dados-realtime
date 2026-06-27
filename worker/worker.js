const { Pool } = require('pg');
const redis = require('redis');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  database: process.env.POSTGRES_DB || 'enquetedb',
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
});

const rc = redis.createClient({ socket: { host: process.env.REDIS_HOST || 'redis' } });

async function run() {
  await rc.connect();
  console.log('Worker iniciado — aguardando votos...');

  while (true) {
    try {
      const result = await rc.blPop('enquete:respostas', 0);
      if (!result) continue;

      const answers = JSON.parse(result.element);
      // answers = [{pergunta_id: 1, opcao: "Python"}, ...]
      for (const { pergunta_id, opcao } of answers) {
        await pool.query(`
          INSERT INTO votos (pergunta_id, opcao, total) VALUES ($1, $2, 1)
          ON CONFLICT (pergunta_id, opcao) DO UPDATE SET total = votos.total + 1
        `, [pergunta_id, opcao]);
      }
      console.log(`Processou ${answers.length} resposta(s)`);
    } catch (e) {
      console.error('Erro:', e.message);
      await new Promise(r => setTimeout(r, 2000));
    }
  }
}

run();