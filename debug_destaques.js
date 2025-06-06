const conexao = require('./banco/conexao');

(async () => {
  try {
    console.log('🔍 Verificando promoções ativas...');
    const promocoes = await conexao.executarConsulta('SELECT * FROM promocoes_relampago WHERE ativo = 1');
    console.log('Promoções ativas:', promocoes);
    
    console.log('\n🔍 Testando query de produtos em destaque...');
    const query = `
      SELECT p.* FROM produtos p
      INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
      WHERE pr.ativo = 1 AND pr.data_inicio <= NOW() AND pr.data_fim >= NOW()
    `;
    const produtos = await conexao.executarConsulta(query);
    console.log('Produtos em destaque encontrados:', produtos.length);
    console.log('Produtos:', produtos);
    
    console.log('\n🔍 Verificando dados específicos...');
    const promocaoAtual = await conexao.executarConsulta(`
      SELECT pr.*, p.nome, p.preco_atual 
      FROM promocoes_relampago pr 
      LEFT JOIN produtos p ON pr.produto_id = p.id 
      WHERE pr.ativo = 1
    `);
    console.log('Promoções com produtos:', promocaoAtual);
    
  } catch (erro) {
    console.error('❌ Erro:', erro);
  }
  process.exit(0);
})();
