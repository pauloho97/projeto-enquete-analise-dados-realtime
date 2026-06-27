const express = require('express');
const app = express();

const API = process.env.API_URL || 'http://localhost:5000';

// Proxy — o Node busca os dados (dentro da rede Docker) e repassa ao browser
app.get('/api/questions', async (req, res) => {
  const data = await fetch(`${API}/questions`).then(r => r.json());
  res.json(data);
});

app.get('/api/results', async (req, res) => {
  const data = await fetch(`${API}/results`).then(r => r.json());
  res.json(data);
});

app.get('/', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><meta charset="UTF-8">
  <title>Resultados da Enquete</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>body{font-family:sans-serif;padding:2rem;max-width:900px;margin:0 auto}
  .chart-wrap{margin-bottom:2rem;border:1px solid #eee;padding:1rem;border-radius:8px}</style>
  </head><body>
  <h1>Resultados da Enquete</h1>
  <div id="charts"></div>
  <script>
  async function load() {
    const [qs, rs] = await Promise.all([
      fetch('/api/questions').then(r=>r.json()),
      fetch('/api/results').then(r=>r.json())
    ]);
    const container = document.getElementById('charts');
    container.innerHTML = '';
    qs.forEach(q => {
      const div = document.createElement('div');
      div.className = 'chart-wrap';
      div.innerHTML = \`<h3>\${q.text}</h3><canvas id="c\${q.id}"></canvas>\`;
      container.appendChild(div);
      const data = q.options.map(opt => {
        const r = rs.find(x => x.pergunta_id == q.id && x.opcao === opt);
        return r ? parseInt(r.total) : 0;
      });
      new Chart(document.getElementById('c'+q.id), {
        type: 'bar',
        data: { labels: q.options, datasets: [{ data, backgroundColor: '#7F77DD' }] },
        options: { plugins: { legend: { display: false } } }
      });
    });
  }
  load();
  setInterval(load, 5000);
  </script></body></html>`);
});

app.listen(3000, () => console.log('Dashboard em :3000'));