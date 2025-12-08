require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const connectDB = require('./config/database');
const routes = require('./routes');

const app = express();

// Conectar ao MongoDB
connectDB();

// Middlewares de segurança
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' }
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parser
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Rotas da API
app.use('/api', routes);

// Tratamento de erros global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);

  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: `Arquivo muito grande. Tamanho máximo: ${process.env.MAX_FILE_SIZE_MB || 50}MB`
      });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({
    error: process.env.NODE_ENV === 'development'
      ? err.message
      : 'Erro interno do servidor.'
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada.' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Ambiente: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
