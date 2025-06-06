// Teste final do endpoint usando Node.js
const https = require('https');

console.log('🔍 Testando endpoint /api/produtos/destaques...');

const options = {
  hostname: 'fgt-ecommerce-backend-production.up.railway.app',
  port: 443,
  path: '/api/produtos/destaques',
  method: 'GET',
  headers: {
    'User-Agent': 'Node.js Test Client'
  }
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      if (json.sucesso === true) {
        console.log('🎉 SUCESSO! ENDPOINT FUNCIONANDO!');
        console.log(`✅ Total de produtos encontrados: ${json.total}`);
        console.log('📦 Produtos em destaque:');
        json.dados.forEach(produto => {
          console.log(`   - ${produto.nome} (${produto.marca}) - R$ ${produto.preco_atual}`);
        });
      } else {
        console.log('❌ Resposta com erro:');
        console.log('Mensagem:', json.mensagem);
      }
    } catch (error) {
      console.log('❌ Erro ao processar JSON:');
      console.log('Resposta bruta:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
});

req.setTimeout(10000, () => {
  console.log('❌ Timeout na requisição');
  req.abort();
});

req.end();
