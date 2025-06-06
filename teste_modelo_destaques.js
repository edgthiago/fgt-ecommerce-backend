const Produto = require('./modelos/Produto');

(async () => {
  try {
    console.log('🔍 Testando buscarTodos com apenas_destaques...');
    
    const produtosDestaque = await Produto.buscarTodos({ 
      apenas_destaques: true 
    });
    
    console.log('✅ Produtos em destaque encontrados:', produtosDestaque.length);
    console.log('Produtos:', produtosDestaque.map(p => ({
      id: p.id,
      nome: p.nome,
      marca: p.marca,
      preco_atual: p.preco_atual
    })));
    
  } catch (erro) {
    console.error('❌ Erro ao buscar produtos em destaque:', erro);
  }
  process.exit(0);
})();
