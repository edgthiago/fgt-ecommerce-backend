const Produto = require('./modelos/Produto');

(async () => {
  try {
    console.log('🔍 Testando novo método buscarProdutosDestaque...');
    
    const produtos = await Produto.buscarProdutosDestaque(8);
    
    console.log('✅ Sucesso! Produtos encontrados:', produtos.length);
    console.log('Produtos:', produtos.map(p => ({
      id: p.id,
      nome: p.nome,
      marca: p.marca,
      preco_atual: p.preco_atual
    })));

  } catch (erro) {
    console.error('❌ Erro:', erro);
  }
  process.exit(0);
})();
