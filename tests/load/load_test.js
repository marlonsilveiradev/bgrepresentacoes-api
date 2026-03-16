import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '10s', target: 20 }, 
    { duration: '20s', target: 20 },
    { duration: '10s', target: 0 },
  ],
};

export default function () {
  const url = 'http://localhost:3000/api/v1/auth/login';
  
  // Enviando um POST com dados propositalmente errados para testar a lógica
  const payload = JSON.stringify({
    email: 'teste@teste.com',
    password: 'senha_errada',
  });

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  const res = http.post(url, payload, params);

  check(res, {
    // Aqui esperamos 401 (Não autorizado) ou 400 (Erro de validação)
    // O importante é que NÃO SEJA 404 (Não encontrada)
    'Conectou na API (não é 404)': (r) => r.status !== 404,
    'Resposta rápida (< 200ms)': (r) => r.timings.duration < 200,
  });

  sleep(1);
}