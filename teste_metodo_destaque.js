const Produto = require('./modelos/Produto');

(async () => {
  try {
    console.log('🎯 Testando método buscarProdutosDestaque...');
    const produtos = await Produto.buscarProdutosDestaque(8);
    console.log(`✅ Encontrados: ${produtos.length} produtos`);
    produtos.forEach(p => console.log(`   - ${p.nome} (${p.marca})`));
  } catch (erro) {
    console.error('❌ Erro:', erro);
  }
  process.exit(0);
})();
