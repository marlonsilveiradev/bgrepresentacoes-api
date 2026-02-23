

import http from 'k6/http';
import { sleep, check } from 'k6';

// 1. CONFIGURAÇÕES DO TESTE
export const options = {
    stages: [
        { duration: '20s', target: 50 },  // Sobe rápido para forçar o bloqueio
        { duration: '40s', target: 100 }, // Mantém carga alta para ver o Rate Limit segurando
        { duration: '20s', target: 0 },   // Desce
    ],
    thresholds: {
        // Removemos o threshold de falha global (http_req_failed), 
        // pois agora esperamos que muitas requisições sejam bloqueadas (429).
        http_req_duration: ['p(95)<1000'], // Login é lento (Bcrypt), aumentamos para 1s
    },
};

// 2. LÓGICA DO TESTE
export default function () {
    const url = 'http://localhost:3000/api/auth/login';

    const payload = JSON.stringify({
        email: 'admin@teste.com',
        password: 'senha_de_teste_muito_longa',
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(url, payload, params);

    // 3. VALIDAÇÕES (Aqui está o segredo para testar o bloqueio)
    check(res, {
        // Validamos se o servidor responde 200 (OK) OU 429 (Bloqueado pelo Rate Limit)
        // Se retornar 500 ou 0 (Conexão recusada), aí sim é uma falha real do servidor
        'Status esperado (200 ou 429)': (r) => r.status === 200 || r.status === 429,

        // Verifica se o Rate Limit foi acionado pelo menos uma vez
        'Rate Limit ativado (429)': (r) => r.status === 429,

        // Só verifica o corpo se a requisição não foi bloqueada
        'Sucesso no Login (quando permitido)': (r) => r.status !== 200 || (r.body && r.body.includes('success')),
    });

    // Diminuímos o sleep para forçar o estouro do limite mais rápido
    sleep(0.5);
}