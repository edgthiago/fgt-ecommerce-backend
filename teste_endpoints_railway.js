const axios = require('axios');

const BASE_URL = 'https://fgt-ecommerce-backend-production.up.railway.app';

const endpoints = [
  '/api/health',
  '/api/produtos',
  '/api/produtos/destaques',
  '/api/auth/status'
];

(async () => {
  console.log('🧪 TESTE COMPLETO DE ENDPOINTS - RAILWAY BACKEND\n');
  
  for (const endpoint of endpoints) {
    try {
      console.log(`🔍 Testando: ${endpoint}`);
      const response = await axios.get(`${BASE_URL}${endpoint}`, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Backend-Test-Script'
        }
      });
      
      console.log(`✅ Status: ${response.status}`);
      console.log(`📊 Dados: ${JSON.stringify(response.data).substring(0, 100)}...`);
      
    } catch (error) {
      console.log(`❌ Erro no endpoint ${endpoint}:`);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Dados: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        console.log(`   Erro de rede: ${error.message}`);
      } else {
        console.log(`   Erro: ${error.message}`);
      }
    }
    console.log('─'.repeat(50));
  }
  
  console.log('\n🏁 Teste finalizado');
})();
