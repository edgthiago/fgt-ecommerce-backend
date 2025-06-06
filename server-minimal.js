const express = require('express');
const app = express();

// Middleware básico
app.use(express.json());

// Health check principal - Railway espera isso
app.get('/', (req, res) => {
  console.log('Health check acessado:', new Date().toISOString());
  res.status(200).json({
    status: 'OK',
    message: 'FGT E-commerce Backend funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    port: process.env.PORT || 3000,
    host: '0.0.0.0'
  });
});

// Health check adicional
app.get('/health', (req, res) => {
  console.log('Health endpoint acessado:', new Date().toISOString());
  res.status(200).json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({
    success: true,
    message: 'API funcionando',
    environment: process.env.NODE_ENV || 'development',
    port: process.env.PORT || 3000
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint não encontrado',
    available: ['/', '/health', '/api/test']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Erro interno do servidor'
  });
});

// Start server
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

console.log('🔧 Configurações de inicialização:');
console.log(`  - PORT: ${PORT}`);
console.log(`  - HOST: ${HOST}`);
console.log(`  - NODE_ENV: ${process.env.NODE_ENV || 'development'}`);

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`❤️ Health check disponível em: http://localhost:${PORT}/`);
  console.log(`📊 Processo PID: ${process.pid}`);
  console.log(`⏰ Iniciado em: ${new Date().toISOString()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor encerrado com sucesso');
    process.exit(0);
  });
});

module.exports = app;
