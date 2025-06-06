// Endpoint temporário para testar a query de produtos em destaque
router.get('/teste-destaques', async (req, res) => {
  console.log('🚀 [TESTE] Endpoint teste-destaques chamado');
  
  try {
    // Teste 1: Verificar se a tabela promocoes_relampago existe e tem dados
    console.log('🔍 [TESTE] Verificando tabela promocoes_relampago...');
    const promocoes = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');
    console.log('✅ [TESTE] Total de promoções:', promocoes[0].total);
    
    // Teste 2: Verificar se há promoções ativas
    console.log('🔍 [TESTE] Verificando promoções ativas...');
    const promocoesAtivas = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago WHERE ativo = 1');
    console.log('✅ [TESTE] Total de promoções ativas:', promocoesAtivas[0].total);
    
    // Teste 3: Testar a query exata que está falhando
    console.log('🔍 [TESTE] Testando query exata do modelo...');
    const sql = `
      SELECT p.* FROM produtos p
      INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
      WHERE pr.ativo = 1 
      AND pr.data_inicio <= UTC_TIMESTAMP() 
      AND pr.data_fim >= UTC_TIMESTAMP()
      AND p.disponivel = 1
      AND p.quantidade_estoque > 0
      ORDER BY p.id ASC
      LIMIT 8
    `;
    
    const produtosDestaque = await conexao.executarConsulta(sql);
    console.log('✅ [TESTE] Produtos em destaque encontrados:', produtosDestaque.length);
    
    // Teste 4: Query simplificada para debug
    console.log('🔍 [TESTE] Query simplificada...');
    const querySImples = 'SELECT pr.*, p.nome FROM promocoes_relampago pr LEFT JOIN produtos p ON pr.produto_id = p.id WHERE pr.ativo = 1 LIMIT 5';
    const resultadoSimples = await conexao.executarConsulta(querySImples);
    
    res.json({
      sucesso: true,
      teste: {
        total_promocoes: promocoes[0].total,
        promocoes_ativas: promocoesAtivas[0].total,
        produtos_destaque: produtosDestaque.length,
        query_simples: resultadoSimples,
        ambiente: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (erro) {
    console.error('❌ [TESTE] Erro no teste:', erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message,
      codigo: erro.code,
      sql_state: erro.sqlState
    });
  }
});
