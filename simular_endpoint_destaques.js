// Teste que simula exatamente o endpoint /api/produtos/destaques
const Produto = require('./modelos/Produto');

(async () => {
  try {
    console.log('🎯 Simulando chamada do endpoint /api/produtos/destaques...');
    
    // Exatamente os mesmos filtros que a rota usa
    const filtros = {
      apenas_destaques: true,
      apenas_em_estoque: true,
      limite: 8
    };

    console.log('📋 Filtros aplicados:', filtros);

    console.log('\n🔍 Chamando Produto.buscarTodos()...');
    const produtos = await Produto.buscarTodos(filtros);
    
    console.log('✅ Sucesso! Produtos encontrados:', produtos.length);
    
    // Simular a resposta da API
    const resposta = {
      sucesso: true,
      dados: produtos,
      total: produtos.length
    };
    
    console.log('\n📦 Resposta simulada da API:');
    console.log('Sucesso:', resposta.sucesso);
    console.log('Total:', resposta.total);
    console.log('Produtos:', produtos.map(p => ({
      id: p.id,
      nome: p.nome,
      marca: p.marca,
      preco_atual: p.preco_atual,
      estoque: p.estoque
    })));

  } catch (erro) {
    console.error('❌ Erro ao simular endpoint:', erro);
    console.error('Stack trace:', erro.stack);
  }
  process.exit(0);
})();
