const conexao = require('./banco/conexao');

async function adicionarPromocoesTeste() {
  try {
    console.log('🔄 Adicionando promoções de teste...');
    
    // Verificar produtos existentes
    const produtos = await conexao.executarConsulta('SELECT id, nome FROM produtos LIMIT 3');
    console.log('Produtos encontrados:', produtos);
    
    if (produtos.length === 0) {
      console.log('❌ Nenhum produto encontrado');
      return;
    }
    
    // Adicionar promoção para o primeiro produto
    const promocao1 = await conexao.executarConsulta(`
      INSERT INTO promocoes_relampago (nome, produto_id, desconto_percentual, preco_promocional, data_inicio, data_fim, quantidade_limite, ativo)
      VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 100, 1)
    `, [`${produtos[0].nome} - Oferta Especial`, produtos[0].id, 20, 479.92]);
    
    console.log('✅ Promoção 1 adicionada:', promocao1);
    
    // Adicionar promoção para o segundo produto se existir
    if (produtos.length > 1) {
      const promocao2 = await conexao.executarConsulta(`
        INSERT INTO promocoes_relampago (nome, produto_id, desconto_percentual, preco_promocional, data_inicio, data_fim, quantidade_limite, ativo)
        VALUES (?, ?, ?, ?, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), 50, 1)
      `, [`${produtos[1].nome} - Flash Sale`, produtos[1].id, 15, 509.15]);
      
      console.log('✅ Promoção 2 adicionada:', promocao2);
    }
    
    // Verificar promoções criadas
    const promocoes = await conexao.executarConsulta('SELECT * FROM promocoes_relampago');
    console.log('📋 Promoções cadastradas:', promocoes);
    
  } catch (erro) {
    console.error('❌ Erro ao adicionar promoções:', erro);
  }
  
  process.exit(0);
}

adicionarPromocoesTeste();
