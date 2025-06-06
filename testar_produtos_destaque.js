const Produto = require('./modelos/Produto');

async function testarProdutosDestaque() {
  try {
    console.log('🔍 Testando busca por produtos em destaque...');
    
    const produtosDestaque = await Produto.buscarTodos({
      apenas_destaques: true,
      limite: 10
    });
    
    console.log('📦 Produtos em destaque encontrados:');
    console.log(`Total: ${produtosDestaque.length}`);
    produtosDestaque.forEach(produto => {
      console.log(`- ID: ${produto.id}, Nome: ${produto.nome}, Preço: R$ ${produto.preco_atual}`);
    });
    
  } catch (erro) {
    console.error('❌ Erro ao buscar produtos em destaque:', erro);
  }
  
  process.exit(0);
}

testarProdutosDestaque();
