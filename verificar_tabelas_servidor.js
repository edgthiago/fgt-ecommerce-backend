// Usando o sistema de conexão existente
const conexao = require('./banco/conexao');

(async () => {
  try {
    console.log('🔍 Verificando tabelas no servidor...');

    // Verificar tabelas existentes
    console.log('\n📋 Verificando tabelas...');
    const tables = await conexao.executarConsulta('SHOW TABLES');
    console.log('Tabelas encontradas:', tables.map(t => Object.values(t)[0]));

    // Verificar se existem produtos
    console.log('\n📦 Produtos na tabela:');
    const products = await conexao.executarConsulta('SELECT id, nome, marca, disponivel, quantidade_estoque FROM produtos LIMIT 5');
    console.log(products);

    // Verificar promoções ativas
    console.log('\n🎯 Promoções ativas:');
    const activePromos = await conexao.executarConsulta('SELECT * FROM promocoes_relampago WHERE ativo = 1');
    console.log('Número de promoções ativas:', activePromos.length);
    console.log(activePromos);

    // Testar a query específica de produtos em destaque
    console.log('\n🌟 Testando query de produtos em destaque:');
    const destacados = await conexao.executarConsulta(`
      SELECT p.id, p.nome, p.marca, p.preco_atual, pr.desconto_percentual
      FROM produtos p
      INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
      WHERE pr.ativo = 1 AND pr.data_inicio <= NOW() AND pr.data_fim >= NOW()
    `);
    console.log('Produtos em destaque encontrados:', destacados.length);
    console.log(destacados);

    // Testar query com EXISTS (como está no código)
    console.log('\n🔍 Testando query com EXISTS:');
    const existsQuery = await conexao.executarConsulta(`
      SELECT id, nome, marca FROM produtos 
      WHERE EXISTS (
        SELECT 1 FROM promocoes_relampago pr 
        WHERE pr.produto_id = produtos.id 
        AND pr.ativo = 1 
        AND pr.data_inicio <= NOW() 
        AND pr.data_fim >= NOW()
      )
    `);
    console.log('Produtos com EXISTS encontrados:', existsQuery.length);
    console.log(existsQuery);

    // Verificar se todas as colunas necessárias existem
    console.log('\n🔍 Verificando estrutura da tabela produtos:');
    const productsStructure = await conexao.executarConsulta('DESCRIBE produtos');
    const columnNames = productsStructure.map(col => col.Field);
    console.log('Colunas da tabela produtos:', columnNames);

    console.log('\n✅ Verificação completa!');

  } catch (erro) {
    console.error('❌ Erro durante verificação:', erro);
  }
  process.exit(0);
})();
