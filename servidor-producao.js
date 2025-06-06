const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const app = express();

// Configuração para produção
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  // Helmet para segurança em produção
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
      },
    },
  }));

  // Rate limiting para produção
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // máximo 100 requests por IP
    message: {
      sucesso: false,
      mensagem: 'Muitas tentativas. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  
  app.use('/api/', limiter);
  
  // Compressão para produção
  app.use(compression());
}

// CORS configurado para produção
const corsOptions = {
  origin: isProduction 
    ? ['https://fgt-ecommerce.vercel.app', 'https://seu-frontend.vercel.app']
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-user-id']
};

app.use(cors(corsOptions));

// Middleware de logging
if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Middleware para parsing JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para servir arquivos estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Importar rotas
const rotasAutenticacao = require('./rotas/autenticacao');
const rotasProdutos = require('./rotas/produtos');
const rotasCarrinho = require('./rotas/carrinho');
const rotasPedidos = require('./rotas/pedidos');
const rotasComentarios = require('./rotas/comentarios');
const rotasAdmin = require('./rotas/admin');
const rotasPromocoes = require('./rotas/promocoes');

// Usar rotas
app.use('/api/auth', rotasAutenticacao);
app.use('/api/produtos', rotasProdutos);
app.use('/api/carrinho', rotasCarrinho);
app.use('/api/pedidos', rotasPedidos);
app.use('/api/comentarios', rotasComentarios);
app.use('/api/admin', rotasAdmin);
app.use('/api/promocoes', rotasPromocoes);

// Rota de informações da API
app.get('/api/info', (req, res) => {
  res.json({
    nome: 'API FGT E-commerce',
    versao: '1.0.0',
    descricao: 'API completa para e-commerce de tênis',
    ambiente: process.env.NODE_ENV || 'development',
    endpoints: {
      autenticacao: [
        'POST /api/auth/login',
        'POST /api/auth/register',
        'GET /api/auth/profile',
        'POST /api/auth/logout'
      ],
      produtos: [
        'GET /api/produtos',
        'GET /api/produtos/:id',
        'GET /api/produtos/categoria/:categoria',
        'GET /api/produtos/busca/:termo'
      ],
      carrinho: [
        'GET /api/carrinho',
        'POST /api/carrinho/adicionar',
        'PUT /api/carrinho/atualizar',
        'DELETE /api/carrinho/remover/:id'
      ],
      pedidos: [
        'GET /api/pedidos',
        'POST /api/pedidos',
        'GET /api/pedidos/:id'
      ]
    }
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro capturado:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      sucesso: false,
      mensagem: 'Dados inválidos',
      detalhes: err.message
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      sucesso: false,
      mensagem: 'Token inválido ou expirado'
    });
  }
  
  res.status(500).json({
    sucesso: false,
    mensagem: isProduction ? 'Erro interno do servidor' : err.message,
    ...(isProduction ? {} : { stack: err.stack })
  });
});

// Rota catch-all para 404
app.use('*', (req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: 'Endpoint não encontrado',
    endpoint: req.originalUrl
  });
});

// Configuração da porta
const PORT = process.env.PORT || 5000;

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
🚀 Servidor FGT E-commerce iniciado!
📍 Ambiente: ${process.env.NODE_ENV || 'development'}
🌐 Porta: ${PORT}
🔗 URL: ${isProduction ? 'https://seu-backend.onrender.com' : `http://localhost:${PORT}`}
📊 Health: ${isProduction ? 'https://seu-backend.onrender.com/health' : `http://localhost:${PORT}/health`}
📋 API Info: ${isProduction ? 'https://seu-backend.onrender.com/api/info' : `http://localhost:${PORT}/api/info`}
  `);
});

module.exports = app;
