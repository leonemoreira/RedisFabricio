const express = require('express');
const redis = require('redis');
const { nanoid } = require('nanoid');

const app = express();
const client = redis.createClient({ url: process.env.REDIS_URL });

app.use(express.json());

client.on('error', (err) => console.error('Redis error:', err));

app.post('/encurtar', async (req, res) => {
    const { url, expiraEm } = req.body;
    if (!url) return res.status(400).json({ error: 'URL é obrigatória' });

    const codigo = nanoid(6);
    await client.set(codigo, url);
    if (expiraEm) await client.expire(codigo, expiraEm);

    res.json({ encurtado: `https://seu-dominio.com/${codigo}` });
});

app.get('/:codigo', async (req, res) => {
    const url = await client.get(req.params.codigo);
    if (!url) return res.status(404).json({ error: 'URL não encontrada' });

    await client.incr(`stats:${req.params.codigo}`);
    res.redirect(url);
});

app.get('/stats/:codigo', async (req, res) => {
    const url = await client.get(req.params.codigo);
    const acessos = await client.get(`stats:${req.params.codigo}`) || 0;

    if (!url) return res.status(404).json({ error: 'Código não encontrado' });

    res.json({ url, acessos: parseInt(acessos, 10) });
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
