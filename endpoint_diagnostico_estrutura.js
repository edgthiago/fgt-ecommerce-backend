// Endpoint para diagnóstico da estrutura da tabela no Railway
router.get('/diagnostico-estrutura', async (req, res) => {
  const diagnostico = {
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV || 'unknown',
    host: process.env.DB_HOST || 'unknown',
    resultados: {}
  };
  
  try {
    console.log('🔍 [DIAG] Iniciando diagnóstico completo da estrutura...');
    
    // 1. Verificar estrutura da tabela
    console.log('📋 [DIAG] Verificando estrutura da tabela...');
    const estrutura = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
    diagnostico.resultados.estrutura = {
      total_colunas: estrutura.length,
      colunas: estrutura.map(col => ({
        nome: col.Field,
        tipo: col.Type,
        null: col.Null,
        default: col.Default
      }))
    };
    
    // 2. Verificar se coluna ativo existe
    const colunaAtivo = estrutura.find(col => col.Field === 'ativo');
    diagnostico.resultados.coluna_ativo = {
      existe: !!colunaAtivo,
      detalhes: colunaAtivo || null
    };
    
    // 3. Testar queries com ativo
    console.log('🧪 [DIAG] Testando queries com coluna ativo...');
    const testesAtivo = {};
    
    try {
      const teste1 = await conexao.executarConsulta('SELECT ativo FROM promocoes_relampago LIMIT 1');
      testesAtivo.select_ativo = { sucesso: true, resultado: teste1 };
    } catch (erro) {
      testesAtivo.select_ativo = { sucesso: false, erro: erro.message };
    }
    
    try {
      const teste2 = await conexao.executarConsulta('SELECT * FROM promocoes_relampago WHERE ativo = 1 LIMIT 1');
      testesAtivo.where_ativo = { sucesso: true, registros: teste2.length };
    } catch (erro) {
      testesAtivo.where_ativo = { sucesso: false, erro: erro.message };
    }
    
    try {
      const teste3 = await conexao.executarConsulta('SELECT pr.ativo FROM promocoes_relampago pr LIMIT 1');
      testesAtivo.alias_ativo = { sucesso: true, resultado: teste3 };
    } catch (erro) {
      testesAtivo.alias_ativo = { sucesso: false, erro: erro.message };
    }
    
    diagnostico.resultados.testes_ativo = testesAtivo;
    
    // 4. Testar JOIN
    console.log('🔗 [DIAG] Testando JOIN...');
    const testesJoin = {};
    
    try {
      const join1 = await conexao.executarConsulta(`
        SELECT p.id, p.nome, pr.ativo 
        FROM produtos p 
        INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id 
        LIMIT 2
      `);
      testesJoin.join_basico = { sucesso: true, registros: join1.length };
    } catch (erro) {
      testesJoin.join_basico = { sucesso: false, erro: erro.message };
    }
    
    try {
      const join2 = await conexao.executarConsulta(`
        SELECT p.id, p.nome, pr.ativo 
        FROM produtos p 
        INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id 
        WHERE pr.ativo = 1
        LIMIT 2
      `);
      testesJoin.join_com_where = { sucesso: true, registros: join2.length };
    } catch (erro) {
      testesJoin.join_com_where = { sucesso: false, erro: erro.message };
    }
    
    diagnostico.resultados.testes_join = testesJoin;
    
    // 5. Informações do banco
    console.log('📊 [DIAG] Coletando informações do banco...');
    try {
      const versao = await conexao.executarConsulta('SELECT VERSION() as versao');
      diagnostico.resultados.versao_mysql = versao[0].versao;
    } catch (erro) {
      diagnostico.resultados.versao_mysql = 'erro: ' + erro.message;
    }
    
    try {
      const sqlMode = await conexao.executarConsulta('SELECT @@sql_mode as sql_mode');
      diagnostico.resultados.sql_mode = sqlMode[0].sql_mode;
    } catch (erro) {
      diagnostico.resultados.sql_mode = 'erro: ' + erro.message;
    }
    
    // 6. Estatísticas
    const totalPromocoes = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');
    const promocoesAtivas = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago WHERE ativo = 1');
    
    diagnostico.resultados.estatisticas = {
      total_promocoes: totalPromocoes[0].total,
      promocoes_ativas: promocoesAtivas[0].total
    };
    
    console.log('✅ [DIAG] Diagnóstico completo finalizado');
    res.json({
      sucesso: true,
      diagnostico: diagnostico
    });
    
  } catch (erro) {
    console.error('❌ [DIAG] Erro no diagnóstico:', erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message,
      diagnostico_parcial: diagnostico
    });
  }
});
