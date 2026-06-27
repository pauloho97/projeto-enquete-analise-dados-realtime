import React, { useState, useEffect } from 'react';

// Define a base da API. No Codespaces, precisamos da URL completa da porta 5000.
let API = '/api'; 
if (typeof window !== 'undefined' && window.location.hostname.includes('github.dev')) {
  // Se o frontend está em port-5001.app.github.dev, a API está em port-5000.app.github.dev
  API = window.location.origin.replace('-5000.', '-3000.');
}

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    fetch(`${API}/questions`)
      .then(r => r.json())
      .then(setQuestions)
      .catch(err => console.error("Erro ao buscar perguntas:", err));
  }, []);

  const select = (qId, opt) => setAnswers(a => ({ ...a, [qId]: opt }));

  const submit = async () => {
    const payload = Object.entries(answers).map(([pergunta_id, opcao]) =>
      ({ pergunta_id: parseInt(pergunta_id), opcao })
    );
    try {
      const res = await fetch(`${API}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: payload })
      });
      if (res.ok) setSent(true);
    } catch (err) {
      console.error("Erro ao enviar voto:", err);
      alert("Erro ao enviar voto. Verifique a conexão com a API.");
    }
  };

  if (sent) return <div style={{padding:'2rem'}}><h2>Obrigado pelo voto!</h2></div>;

  return (
    <div style={{maxWidth:600,margin:'2rem auto',padding:'1rem'}}>
      <h1>Enquete ADS</h1>
      {questions.length === 0 && <p>Carregando perguntas...</p>}
      {questions.map(q => (
        <div key={q.id} style={{marginBottom:'1.5rem',border:'1px solid #eee',padding:'1rem',borderRadius:8}}>
          <h3>{q.text}</h3>
          {q.options.map(opt => (
            <label key={opt} style={{display:'block',margin:'0.5rem 0',cursor:'pointer'}}>
              <input type="radio" name={`q${q.id}`} value={opt}
                onChange={() => select(q.id, opt)} /> {opt}
            </label>
          ))}
        </div>
      ))}
      <button onClick={submit}
        disabled={Object.keys(answers).length === 0}
        style={{
          padding:'0.6rem 1.5rem',
          background: Object.keys(answers).length === 0 ? '#ccc' : '#7F77DD',
          color:'white',
          border:'none',
          borderRadius:6,
          cursor: Object.keys(answers).length === 0 ? 'not-allowed' : 'pointer'
        }}>
        Enviar Voto
      </button>
    </div>
  );
}