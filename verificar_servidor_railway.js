const mysql = require('mysql2/promise');

(async () => {
  try {
    console.log('🔍 Conectando ao banco Railway...');
    
    // Usando as mesmas configurações do arquivo conexao.js
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'junction.proxy.rlwy.net',
      port: process.env.DB_PORT || 56292,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'kScsOIYGGdlQJYcyXdSRQNLLcGaFNnle',
      database: process.env.DB_NAME || 'railway',
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('✅ Conectado ao MySQL Railway!');

    // Verificar tabelas existentes
    console.log('\n📋 Verificando tabelas...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('Tabelas encontradas:', tables.map(t => Object.values(t)[0]));

    // Verificar estrutura da tabela produtos
    console.log('\n🔍 Estrutura da tabela produtos:');
    const [productsStructure] = await connection.execute('DESCRIBE produtos');
    console.log(productsStructure);

    // Verificar se existem produtos
    console.log('\n📦 Produtos na tabela:');
    const [products] = await connection.execute('SELECT id, nome, marca, disponivel, quantidade_estoque FROM produtos LIMIT 5');
    console.log(products);

    // Verificar estrutura da tabela promocoes_relampago
    console.log('\n🔍 Estrutura da tabela promocoes_relampago:');
    const [promosStructure] = await connection.execute('DESCRIBE promocoes_relampago');
    console.log(promosStructure);

    // Verificar promoções ativas
    console.log('\n🎯 Promoções ativas:');
    const [activePromos] = await connection.execute('SELECT * FROM promocoes_relampago WHERE ativo = 1');
    console.log(activePromos);

    // Testar a query específica de produtos em destaque
    console.log('\n🌟 Testando query de produtos em destaque:');
    const [destacados] = await connection.execute(`
      SELECT p.id, p.nome, p.marca, p.preco_atual, pr.desconto_percentual
      FROM produtos p
      INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
      WHERE pr.ativo = 1 AND pr.data_inicio <= NOW() AND pr.data_fim >= NOW()
    `);
    console.log('Produtos em destaque encontrados:', destacados.length);
    console.log(destacados);

    // Testar query com EXISTS (como está no código)
    console.log('\n🔍 Testando query com EXISTS:');
    const [existsQuery] = await connection.execute(`
      SELECT * FROM produtos 
      WHERE EXISTS (
        SELECT 1 FROM promocoes_relampago pr 
        WHERE pr.produto_id = produtos.id 
        AND pr.ativo = 1 
        AND pr.data_inicio <= NOW() 
        AND pr.data_fim >= NOW()
      )
    `);
    console.log('Produtos com EXISTS encontrados:', existsQuery.length);
    console.log(existsQuery.map(p => ({ id: p.id, nome: p.nome, marca: p.marca })));

    await connection.end();
    console.log('\n✅ Verificação completa!');

  } catch (erro) {
    console.error('❌ Erro ao conectar ao Railway:', erro);
  }
  process.exit(0);
})();
