const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const path = require('path');

// Configurar variáveis de ambiente
require('dotenv').config();

const app = express();

// Middleware básico
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// CORS para produção
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));

// Helmet para segurança
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Health check para Railway
app.get('/', (req, res) => {
  res.json({
    sucesso: true,
    mensagem: 'FGT E-commerce Backend está funcionando!',
    timestamp: new Date().toISOString(),
    versao: '1.0.0',
    ambiente: process.env.NODE_ENV || 'development'
  });
});

// Health check adicional
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota de informações da API
app.get('/api/info', (req, res) => {
  res.json({
    sucesso: true,
    dados: {
      nome: 'API Loja de Tênis FGT',
      versao: '1.0.0',
      descricao: 'Backend completo para loja de tênis',
      endpoints: {
        produtos: '/api/produtos',
        autenticacao: '/api/auth',
        carrinho: '/api/carrinho',
        pedidos: '/api/pedidos',
        promocoes: '/api/promocoes',
        admin: '/api/admin'
      }
    }
  });
});

// Middleware para tentar conectar ao banco apenas se as variáveis existirem
app.use(async (req, res, next) => {
  // Se não tiver variáveis de banco, pular middleware de banco
  if (!process.env.DB_HOST && !process.env.DATABASE_URL && !process.env.MYSQLHOST) {
    req.semBanco = true;
  }
  next();
});

// Carregamento seguro das rotas da API
const carregarRotas = () => {
  try {
    // Verificar se os arquivos de rota existem antes de carregar
    const fs = require('fs');
    const rotasDisponiveis = [];
    
    const rotas = [
      { path: '/api/produtos', file: './rotas/produtos' },
      { path: '/api/auth', file: './rotas/autenticacao' },
      { path: '/api/carrinho', file: './rotas/carrinho' },
      { path: '/api/pedidos', file: './rotas/pedidos' },
      { path: '/api/promocoes', file: './rotas/promocoes' },
      { path: '/api/comentarios', file: './rotas/comentarios' },
      { path: '/api/admin', file: './rotas/admin' }
    ];
    
    rotas.forEach(rota => {
      try {
        if (fs.existsSync(rota.file + '.js')) {
          app.use(rota.path, require(rota.file));
          rotasDisponiveis.push(rota.path);
          console.log(`✅ Rota carregada: ${rota.path}`);
        } else {
          console.log(`⚠️ Arquivo não encontrado: ${rota.file}.js`);
        }
      } catch (erro) {
        console.log(`❌ Erro ao carregar ${rota.path}:`, erro.message);
      }
    });
    
    console.log(`📝 Total de rotas carregadas: ${rotasDisponiveis.length}`);
    return rotasDisponiveis;
    
  } catch (erro) {
    console.log('⚠️ Erro geral ao carregar rotas:', erro.message);
    return [];
  }
};

// Carregar rotas
const rotasCarregadas = carregarRotas();

// Rota de teste sem banco
app.get('/api/test', (req, res) => {
  res.json({
    sucesso: true,
    mensagem: 'API funcionando - teste sem banco',
    variaveis_ambiente: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      tem_db_host: !!process.env.DB_HOST,
      tem_database_url: !!process.env.DATABASE_URL,
      tem_mysql_host: !!process.env.MYSQLHOST,
      tem_jwt_secret: !!process.env.JWT_SECRET
    },
    rotas_carregadas: rotasCarregadas || []
  });
});

// Rota de diagnóstico completo
app.get('/api/diagnostico', (req, res) => {
  const fs = require('fs');
  
  res.json({
    sucesso: true,
    timestamp: new Date().toISOString(),
    servidor: {
      versao_node: process.version,
      plataforma: process.platform,
      uptime: Math.floor(process.uptime()),
      memoria: process.memoryUsage()
    },
    variaveis_ambiente: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      tem_variaveis_banco: !!(process.env.DB_HOST || process.env.DATABASE_URL || process.env.MYSQLHOST),
      tem_jwt_secret: !!process.env.JWT_SECRET
    },
    arquivos: {
      existe_pasta_rotas: fs.existsSync('./rotas'),
      existe_pasta_modelos: fs.existsSync('./modelos'),
      existe_pasta_banco: fs.existsSync('./banco'),
      package_json: fs.existsSync('./package.json')
    },
    rotas_carregadas: rotasCarregadas || []
  });
});

// Middleware de erro 404
app.use('*', (req, res) => {
  res.status(404).json({
    sucesso: false,
    mensagem: 'Endpoint não encontrado',
    endpoint_solicitado: req.originalUrl,    endpoints_disponiveis: [
      'GET /',
      'GET /health',
      'GET /api/info',
      'GET /api/test',
      'GET /api/diagnostico'
    ]
  });
});

// Middleware de tratamento de erros
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({
    sucesso: false,
    mensagem: 'Erro interno do servidor',
    erro: process.env.NODE_ENV === 'development' ? err.message : 'Erro interno'
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Importante para Railway

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`❤️ Health check: http://localhost:${PORT}/health`);
  
  // Log de variáveis importantes (sem valores sensíveis)
  console.log('📊 Variáveis de ambiente:');
  console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'não definido'}`);
  console.log(`  - PORT: ${process.env.PORT || 'não definido'}`);
  console.log(`  - DB_HOST: ${process.env.DB_HOST ? 'definido' : 'não definido'}`);
  console.log(`  - DATABASE_URL: ${process.env.DATABASE_URL ? 'definido' : 'não definido'}`);
  console.log(`  - JWT_SECRET: ${process.env.JWT_SECRET ? 'definido' : 'não definido'}`);
});

module.exports = app;
