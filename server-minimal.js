const express = require('express');
const app = express();

// Middleware básico
app.use(express.json());

// Health check principal - Railway espera isso
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'FGT E-commerce Backend funcionando!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check adicional
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
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

app.listen(PORT, HOST, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`❤️ Health check disponível em: http://localhost:${PORT}/`);
});

module.exports = app;
