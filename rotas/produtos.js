const express = require('express');
const router = express.Router();
const Produto = require('../modelos/Produto');
const { verificarAutenticacao, verificarPermissao } = require('../middleware/autenticacao');
const { middleware, PERMISSOES } = require('../utils/sistema-permissoes');
const conexao = require('../banco/conexao');

// GET /api/produtos - Buscar produtos (público)
router.get('/', async (req, res) => {
  try {
    const filtros = {
      termo_pesquisa: req.query.busca,
      marcas: req.query.marcas ? req.query.marcas.split(',') : undefined,
      categorias: req.query.categorias ? req.query.categorias.split(',') : undefined,
      generos: req.query.generos ? req.query.generos.split(',') : undefined,
      condicao: req.query.condicao,
      preco_min: req.query.preco_min ? parseFloat(req.query.preco_min) : undefined,
      preco_max: req.query.preco_max ? parseFloat(req.query.preco_max) : undefined,
      avaliacao_minima: req.query.avaliacao_minima ? parseFloat(req.query.avaliacao_minima) : undefined,
      apenas_em_estoque: req.query.apenas_em_estoque === 'true',
      ordenar_por: req.query.ordenar_por,
      limite: req.query.limite ? parseInt(req.query.limite) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    };

    const produtos = await Produto.buscarTodos(filtros);
    
    res.json({
      sucesso: true,
      dados: produtos,
      total: produtos.length
    });
  } catch (erro) {
    console.error('Erro ao buscar produtos:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar produtos'
    });
  }
});

// GET /api/produtos/test-query - Teste específico da query problemática
router.get('/test-query', async (req, res) => {
  console.log('🧪 [TEST] Testando query específica...');
  
  try {
    const conexao = require('../banco/conexao');
    
    // Testar cada parte da query progressivamente
    console.log('🧪 [TEST] Passo 1: Verificando tabela produtos');
    const produtos = await conexao.executarConsulta('SELECT COUNT(*) as total FROM produtos');
    console.log('✅ [TEST] Produtos:', produtos[0].total);
    
    console.log('🧪 [TEST] Passo 2: Verificando tabela promocoes_relampago');
    const promocoes = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');
    console.log('✅ [TEST] Promoções:', promocoes[0].total);
    
    console.log('🧪 [TEST] Passo 3: Testando query com alias');
    const comAlias = await conexao.executarConsulta(`
      SELECT pr.id, pr.nome, pr.ativo 
      FROM promocoes_relampago pr 
      LIMIT 3
    `);
    console.log('✅ [TEST] Query com alias funcionou:', comAlias.length);
    
    console.log('🧪 [TEST] Passo 4: Testando WHERE com pr.ativo');
    const comWhere = await conexao.executarConsulta(`
      SELECT pr.id, pr.nome, pr.ativo 
      FROM promocoes_relampago pr 
      WHERE pr.ativo = 1
      LIMIT 3
    `);
    console.log('✅ [TEST] WHERE pr.ativo funcionou:', comWhere.length);
    
    console.log('🧪 [TEST] Passo 5: Testando JOIN completo');
    const joinCompleto = await conexao.executarConsulta(`
      SELECT p.id, p.nome, pr.ativo
      FROM produtos p
      INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
      WHERE pr.ativo = 1
      LIMIT 3
    `);
    console.log('✅ [TEST] JOIN completo funcionou:', joinCompleto.length);
    
    console.log('🧪 [TEST] Passo 6: Query completa original');
    const queryCompleta = await conexao.executarConsulta(`
      SELECT p.* FROM produtos p
      INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
      WHERE pr.ativo = 1 
      AND pr.data_inicio <= UTC_TIMESTAMP() 
      AND pr.data_fim >= UTC_TIMESTAMP()
      AND p.disponivel = 1
      AND p.quantidade_estoque > 0
      ORDER BY p.id ASC
      LIMIT 8
    `);
    console.log('✅ [TEST] Query completa funcionou:', queryCompleta.length);
    
    res.json({
      sucesso: true,
      teste: {
        produtos_total: produtos[0].total,
        promocoes_total: promocoes[0].total,
        com_alias: comAlias.length,
        com_where: comWhere.length,
        join_completo: joinCompleto.length,
        query_completa: queryCompleta.length,
        dados_exemplo: queryCompleta.slice(0, 2)
      }
    });
    
  } catch (erro) {
    console.error('❌ [TEST] Erro no teste:', erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message,
      code: erro.code,
      sqlState: erro.sqlState,
      sqlMessage: erro.sqlMessage
    });
  }
});

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

// GET /api/produtos/debug-railway - Endpoint de diagnóstico temporário
router.get('/debug-railway', async (req, res) => {
  console.log('🔍 [DEBUG] Endpoint de diagnóstico chamado');
  
  try {
    // Verificar variáveis de ambiente
    const env = {
      DB_HOST: process.env.DB_HOST,
      DB_USER: process.env.DB_USER,
      DB_NAME: process.env.DB_NAME,
      NODE_ENV: process.env.NODE_ENV,
      hasPassword: !!process.env.DB_PASSWORD
    };
    
    console.log('🔍 [DEBUG] Variáveis de ambiente:', env);
    
    // Testar conexão básica
    const conexao = require('../banco/conexao');
    console.log('🔍 [DEBUG] Objeto conexão:', typeof conexao);
    
    // Listar tabelas
    const tabelas = await conexao.executarConsulta('SHOW TABLES');
    console.log('🔍 [DEBUG] Tabelas encontradas:', tabelas.length);
    
    // Verificar tabela promocoes_relampago especificamente
    let estruturaPromocoes = null;
    let dadosPromocoes = null;
    
    try {
      estruturaPromocoes = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
      dadosPromocoes = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');
    } catch (erro) {
      console.log('⚠️ [DEBUG] Erro com promocoes_relampago:', erro.message);
    }
    
    // Testar Produto.buscarTodos() básico
    const Produto = require('../modelos/Produto');
    let produtosBasico = null;
    
    try {
      produtosBasico = await Produto.buscarTodos({ limite: 3 });
    } catch (erro) {
      console.log('⚠️ [DEBUG] Erro com Produto.buscarTodos():', erro.message);
    }
    
    res.json({
      sucesso: true,
      debug: {
        timestamp: new Date().toISOString(),
        ambiente: env,
        tabelas: tabelas.map(t => Object.values(t)[0]),
        promocoes_relampago: {
          estrutura_disponivel: !!estruturaPromocoes,
          colunas: estruturaPromocoes ? estruturaPromocoes.length : 0,
          total_registros: dadosPromocoes ? dadosPromocoes[0].total : 0
        },
        produtos_basico: {
          funcionou: !!produtosBasico,
          quantidade: produtosBasico ? produtosBasico.length : 0
        }
      }
    });
    
  } catch (erro) {
    console.error('❌ [DEBUG] Erro no diagnóstico:', erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message,
      stack: erro.stack
    });
  }
});

// GET /api/produtos/destaques - Buscar produtos em destaque (público)
router.get('/destaques', async (req, res) => {
  console.log('🚀 [DESTAQUES] Endpoint chamado - Timestamp:', new Date().toISOString());
  console.log('🚀 [DESTAQUES] Headers:', req.headers);
  console.log('🚀 [DESTAQUES] Query params:', req.query);
  
  try {
    console.log('🔍 [DESTAQUES] Iniciando busca por produtos em destaque...');
    
    // Verificar se o modelo Produto está carregado
    console.log('🔍 [DESTAQUES] Verificando modelo Produto:', typeof Produto);
    console.log('🔍 [DESTAQUES] Método buscarProdutosDestaque existe:', typeof Produto.buscarProdutosDestaque);
    
    const limite = req.query.limite ? parseInt(req.query.limite) : 8;
    console.log('🔍 [DESTAQUES] Limite definido:', limite);
    
    console.log('🔍 [DESTAQUES] Tentando chamar Produto.buscarProdutosDestaque...');
    const produtos = await Produto.buscarProdutosDestaque(limite);
    
    console.log('✅ [DESTAQUES] Produtos encontrados:', produtos ? produtos.length : 'null/undefined');
    console.log('✅ [DESTAQUES] Dados dos produtos:', JSON.stringify(produtos, null, 2));
    
    res.json({
      sucesso: true,
      dados: produtos,
      total: produtos ? produtos.length : 0,
      debug: {
        timestamp: new Date().toISOString(),
        limite: limite,
        metodosDisponeis: Object.getOwnPropertyNames(Produto)
      }
    });
  } catch (erro) {
    console.error('❌ [DESTAQUES] Erro detalhado:', erro);
    console.error('❌ [DESTAQUES] Nome do erro:', erro.name);
    console.error('❌ [DESTAQUES] Mensagem:', erro.message);
    console.error('❌ [DESTAQUES] Stack trace:', erro.stack);
    console.error('❌ [DESTAQUES] Código do erro:', erro.code);
    console.error('❌ [DESTAQUES] SQL State:', erro.sqlState);
    console.error('❌ [DESTAQUES] SQL Message:', erro.sqlMessage);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar produtos em destaque',
      erro: erro.message,
      debug: {
        timestamp: new Date().toISOString(),
        errorName: erro.name,
        sqlCode: erro.code,
        sqlState: erro.sqlState,
        metodosDisponiveis: Object.getOwnPropertyNames(Produto)
      }
    });
  }
});

// GET /api/produtos/categoria/:categoria - Buscar produtos por categoria (público)
router.get('/categoria/:categoria', async (req, res) => {
  try {
    const categoria = req.params.categoria;
    const filtros = {
      categorias: [categoria],
      apenas_em_estoque: true,
      limite: req.query.limite ? parseInt(req.query.limite) : 20,
      offset: req.query.offset ? parseInt(req.query.offset) : 0,
      ordenar_por: req.query.ordenar_por || 'nome'
    };

    const produtos = await Produto.buscarTodos(filtros);
    
    res.json({
      sucesso: true,
      dados: produtos,
      categoria: categoria,
      total: produtos.length
    });
  } catch (erro) {
    console.error('Erro ao buscar produtos por categoria:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar produtos por categoria'
    });
  }
});

// GET /api/produtos/admin/estatisticas - Obter estatísticas (apenas colaborador+)
router.get('/admin/estatisticas', verificarAutenticacao, middleware.verificarAcessoAdmin(PERMISSOES.VERIFICAR_ESTOQUE), async (req, res) => {
  try {
    const estatisticas = await Produto.obterEstatisticas();
    
    res.json({
      sucesso: true,
      dados: estatisticas
    });
  } catch (erro) {
    console.error('Erro ao obter estatísticas:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao obter estatísticas'
    });  }
});

// Endpoint para corrigir estrutura da tabela no Railway
router.get('/corrigir-estrutura', async (req, res) => {
  console.log('🔧 [CORRIGIR] Iniciando correção de estrutura...');
  
  const relatorio = {
    timestamp: new Date().toISOString(),
    ambiente: process.env.NODE_ENV,
    etapas: {}
  };
  
  try {
    // 1. Verificar estrutura atual
    console.log('📋 [CORRIGIR] Verificando estrutura atual...');
    const estruturaAtual = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
    relatorio.etapas.estrutura_inicial = {
      total_colunas: estruturaAtual.length,
      colunas: estruturaAtual.map(col => col.Field)
    };
    
    // 2. Verificar colunas essenciais
    const colunasEssenciais = ['nome', 'ativo', 'quantidade_limite', 'quantidade_vendida', 'criado_por', 'data_criacao'];
    const colunasFaltantes = [];
    
    colunasEssenciais.forEach(coluna => {
      const existe = estruturaAtual.find(col => col.Field === coluna);
      if (!existe) {
        colunasFaltantes.push(coluna);
      }
    });
    
    relatorio.etapas.analise = {
      colunas_faltantes: colunasFaltantes
    };
    
    // 3. Adicionar colunas faltantes
    if (colunasFaltantes.length > 0) {
      console.log('🔧 [CORRIGIR] Adicionando colunas faltantes...');
      const resultadosAlteracao = {};
      
      for (const coluna of colunasFaltantes) {
        try {
          let sql = '';
          switch (coluna) {
            case 'nome':
              sql = 'ALTER TABLE promocoes_relampago ADD COLUMN nome VARCHAR(255) NOT NULL DEFAULT "Promoção"';
              break;
            case 'ativo':
              sql = 'ALTER TABLE promocoes_relampago ADD COLUMN ativo TINYINT(1) DEFAULT 1';
              break;
            case 'quantidade_limite':
              sql = 'ALTER TABLE promocoes_relampago ADD COLUMN quantidade_limite INT DEFAULT NULL';
              break;
            case 'quantidade_vendida':
              sql = 'ALTER TABLE promocoes_relampago ADD COLUMN quantidade_vendida INT DEFAULT 0';
              break;
            case 'criado_por':
              sql = 'ALTER TABLE promocoes_relampago ADD COLUMN criado_por INT DEFAULT NULL';
              break;
            case 'data_criacao':
              sql = 'ALTER TABLE promocoes_relampago ADD COLUMN data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
              break;
          }
          
          if (sql) {
            await conexao.executarConsulta(sql);
            resultadosAlteracao[coluna] = 'sucesso';
            console.log(`✅ [CORRIGIR] ${coluna} adicionada`);
          }
        } catch (erro) {
          resultadosAlteracao[coluna] = erro.message;
          console.log(`❌ [CORRIGIR] Erro em ${coluna}:`, erro.message);
        }
      }
      
      relatorio.etapas.alteracoes = resultadosAlteracao;
    }
    
    // 4. Verificar estrutura final
    const estruturaFinal = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
    relatorio.etapas.estrutura_final = {
      total_colunas: estruturaFinal.length,
      colunas: estruturaFinal.map(col => col.Field)
    };
    
    // 5. Testar query problemática
    try {
      const teste = await conexao.executarConsulta(`
        SELECT p.id, p.nome, pr.ativo 
        FROM produtos p 
        INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id 
        WHERE pr.ativo = 1
        LIMIT 1
      `);
      relatorio.etapas.teste_query = {
        sucesso: true,
        registros: teste.length
      };
    } catch (erro) {
      relatorio.etapas.teste_query = {
        sucesso: false,
        erro: erro.message
      };
    }
    
    // 6. Inserir dados se necessário
    const totalRegistros = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');
    if (totalRegistros[0].total === 0) {
      try {
        await conexao.executarConsulta(`
          INSERT INTO promocoes_relampago 
          (nome, produto_id, desconto_percentual, preco_promocional, data_inicio, data_fim, ativo) 
          VALUES 
          ('Flash Sale Nike', 1, 40, 299.99, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 1),
          ('Oferta Especial Adidas', 2, 35, 349.99, NOW(), DATE_ADD(NOW(), INTERVAL 25 DAY), 1)
        `);
        relatorio.etapas.dados_inseridos = true;
      } catch (erro) {
        relatorio.etapas.dados_inseridos = erro.message;
      }
    }
    
    res.json({
      sucesso: true,
      relatorio: relatorio
    });
    
  } catch (erro) {
    console.error('❌ [CORRIGIR] Erro geral:', erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message,
      relatorio_parcial: relatorio
    });
  }
});

// GET /api/produtos/:id - Buscar produto específico (público)
router.get('/:id', async (req, res) => {
  try {
    const produto = await Produto.buscarPorId(req.params.id);
    
    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }

    // Temporariamente vamos retornar o produto sem os relacionados para testar
    try {
      const produtosRelacionados = await produto.buscarRelacionados();
      res.json({
        sucesso: true,
        dados: {
          produto,
          produtos_relacionados: produtosRelacionados
        }
      });
    } catch (erro) {
      console.warn('⚠️ Erro ao buscar produtos relacionados, retornando produto sem relacionados:', erro.message);
      // Retornar produto sem relacionados se houver erro
      res.json({
        sucesso: true,
        dados: {
          produto,
          produtos_relacionados: []
        }
      });
    }
  } catch (erro) {
    console.error('Erro ao buscar produto:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar produto'
    });
  }
});

// POST /api/produtos - Criar produto (apenas colaborador+)
router.post('/', verificarAutenticacao, middleware.verificarAcessoAdmin(PERMISSOES.ADICIONAR_PRODUTOS), async (req, res) => {
  try {
    const produtoData = {
      marca: req.body.marca,
      nome: req.body.nome,
      imagem: req.body.imagem,
      preco_antigo: parseFloat(req.body.preco_antigo),
      preco_atual: parseFloat(req.body.preco_atual),
      desconto: req.body.desconto ? parseFloat(req.body.desconto) : undefined,
      avaliacao: req.body.avaliacao ? parseFloat(req.body.avaliacao) : undefined,
      numero_avaliacoes: req.body.numero_avaliacoes ? parseInt(req.body.numero_avaliacoes) : undefined,
      categoria: req.body.categoria,
      genero: req.body.genero,
      condicao: req.body.condicao,
      estoque: parseInt(req.body.estoque) || 0,
      descricao: req.body.descricao,
      tamanhos_disponiveis: req.body.tamanhos_disponiveis,
      cores_disponiveis: req.body.cores_disponiveis,
      peso: req.body.peso ? parseFloat(req.body.peso) : undefined,
      material: req.body.material,
      origem: req.body.origem,
      garantia_meses: req.body.garantia_meses ? parseInt(req.body.garantia_meses) : undefined
    };

    // Validações básicas
    if (!produtoData.marca || !produtoData.nome || !produtoData.preco_atual || !produtoData.categoria || !produtoData.genero) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Campos obrigatórios: marca, nome, preco_atual, categoria, genero'
      });
    }

    const produto = await Produto.criar(produtoData);
    
    // Log da ação
    req.logAcao('produto_criado', { produto_id: produto.id, dados: produtoData });
    
    res.status(201).json({
      sucesso: true,
      dados: produto,
      mensagem: 'Produto criado com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao criar produto:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor ao criar produto'
    });
  }
});

// PUT /api/produtos/:id - Atualizar produto (apenas colaborador+)
router.put('/:id', verificarAutenticacao, verificarPermissao('colaborador'), async (req, res) => {
  try {
    const produto = await Produto.buscarPorId(req.params.id);
    
    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }

    const dadosAtualizacao = {};
    
    // Campos que podem ser atualizados
    const camposPermitidos = [
      'marca', 'nome', 'imagem', 'preco_antigo', 'preco_atual', 'desconto',
      'avaliacao', 'numero_avaliacoes', 'categoria', 'genero', 'condicao',
      'estoque', 'descricao', 'tamanhos_disponiveis', 'cores_disponiveis',
      'peso', 'material', 'origem', 'garantia_meses'
    ];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        dadosAtualizacao[campo] = req.body[campo];
      }
    });

    const produtoAtualizado = await produto.atualizar(dadosAtualizacao);
    
    // Log da ação
    req.logAcao('produto_atualizado', { produto_id: produto.id, dados: dadosAtualizacao });
    
    res.json({
      sucesso: true,
      dados: produtoAtualizado,
      mensagem: 'Produto atualizado com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao atualizar produto:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor ao atualizar produto'
    });
  }
});

// PATCH /api/produtos/:id/estoque - Atualizar estoque (apenas colaborador+)
router.patch('/:id/estoque', verificarAutenticacao, middleware.verificarAcessoAdmin(PERMISSOES.ATUALIZAR_ESTOQUE), async (req, res) => {
  try {
    const produto = await Produto.buscarPorId(req.params.id);
    
    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }

    const novaQuantidade = parseInt(req.body.estoque);
    
    if (isNaN(novaQuantidade) || novaQuantidade < 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Quantidade de estoque deve ser um número válido e não negativo'
      });
    }

    const produtoAtualizado = await produto.atualizarEstoque(novaQuantidade);
    
    // Log da ação
    req.logAcao('estoque_atualizado', { 
      produto_id: produto.id, 
      estoque_anterior: produto.estoque,
      estoque_novo: novaQuantidade 
    });
    
    res.json({
      sucesso: true,
      dados: produtoAtualizado,
      mensagem: 'Estoque atualizado com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao atualizar estoque:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor ao atualizar estoque'
    });
  }
});

// DELETE /api/produtos/:id - Deletar produto (apenas colaborador+)
router.delete('/:id', verificarAutenticacao, middleware.verificarAcessoAdmin(PERMISSOES.REMOVER_PRODUTOS), async (req, res) => {
  try {
    const produto = await Produto.buscarPorId(req.params.id);
    
    if (!produto) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }

    await produto.deletar();
    
    // Log da ação
    req.logAcao('produto_deletado', { produto_id: produto.id, produto_nome: produto.nome });
    
    res.json({
      sucesso: true,
      mensagem: 'Produto deletado com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao deletar produto:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor ao deletar produto'
    });
  }
});

// === ROTAS DE COMENTÁRIOS ===

// GET /api/produtos/:id/comentarios - Buscar comentários de um produto (público)
router.get('/:id/comentarios', async (req, res) => {
  try {
    const { id: produtoId } = req.params;
    const Comentario = require('../modelos/Comentario');
    
    const resultado = await Comentario.buscarPorProduto(produtoId);
    
    if (resultado.sucesso) {
      res.json({
        sucesso: true,
        dados: resultado.dados
      });
    } else {
      res.status(500).json({
        sucesso: false,
        mensagem: resultado.mensagem
      });
    }
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar comentários'
    });
  }
});

// POST /api/produtos/:id/comentarios - Criar novo comentário (requer autenticação e compra)
router.post('/:id/comentarios', 
  verificarAutenticacao, 
  middleware.verificarComentario,
  async (req, res) => {
    try {
      const { id: produtoId } = req.params;
      const { comentario, avaliacao } = req.body;
      const usuarioId = req.usuario.id;
      const Comentario = require('../modelos/Comentario');

      // Validações básicas
      if (!comentario || comentario.trim().length < 10) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Comentário deve ter pelo menos 10 caracteres'
        });
      }

      if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Avaliação deve ser entre 1 e 5 estrelas'
        });
      }

      // Verificar se usuário já comentou
      const jaComentou = await Comentario.jaComentou(usuarioId, produtoId);
      if (jaComentou.jaComentou) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Você já comentou este produto'
        });
      }

      // Verificar se usuário comprou o produto
      const podeAvaliar = await Comentario.podeAvaliar(usuarioId, produtoId);
      if (!podeAvaliar.podeAvaliar) {
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Apenas usuários que compraram o produto podem comentar'
        });
      }

      // Criar comentário
      const dadosComentario = {
        usuario_id: usuarioId,
        produto_id: produtoId,
        comentario: comentario.trim(),
        avaliacao: parseInt(avaliacao),
        compra_verificada: true
      };

      const resultado = await Comentario.criar(dadosComentario);

      if (resultado.sucesso) {
        // Log da ação
        req.logAcao('comentario_criado', {
          produto_id: produtoId,
          usuario_id: usuarioId,
          avaliacao: avaliacao
        });

        res.status(201).json({
          sucesso: true,
          dados: { id: resultado.id },
          mensagem: 'Comentário criado com sucesso'
        });
      } else {
        res.status(500).json({
          sucesso: false,
          mensagem: resultado.mensagem
        });
      }
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      res.status(500).json({
        sucesso: false,
        mensagem: 'Erro interno do servidor ao criar comentário'
      });
    }
  }
);

// GET /api/produtos/:id/estatisticas-comentarios - Obter estatísticas de comentários
router.get('/:id/estatisticas-comentarios', async (req, res) => {
  try {
    const { id: produtoId } = req.params;
    const Comentario = require('../modelos/Comentario');
    
    const resultado = await Comentario.estatisticasAvaliacao(produtoId);
    
    if (resultado.sucesso) {
      res.json({
        sucesso: true,
        dados: resultado.dados
      });
    } else {
      res.status(500).json({
        sucesso: false,
        mensagem: resultado.mensagem
      });
    }
  } catch (error) {
    console.error('Erro ao obter estatísticas de comentários:', error);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao obter estatísticas'
    });
  }
});

// ENDPOINT TEMPORÁRIO PARA DEBUG - REMOVER APÓS CORREÇÃO
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
    const querySimples = 'SELECT pr.*, p.nome FROM promocoes_relampago pr LEFT JOIN produtos p ON pr.produto_id = p.id WHERE pr.ativo = 1 LIMIT 5';
    const resultadoSimples = await conexao.executarConsulta(querySimples);
    
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

// Endpoint temporário para produtos destaque com colunas corretas
router.get('/destaques-corrigido', async (req, res) => {
  console.log('🚀 [DESTAQUES-CORRIGIDO] Endpoint chamado');
  
  try {
    const limite = parseInt(req.query.limite) || 8;
    
    // Query corrigida usando as colunas corretas (inicio/fim ao invés de data_inicio/data_fim)
    const sql = `
      SELECT p.* FROM produtos p
      INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
      WHERE pr.ativo = 1 
      AND pr.inicio <= UTC_TIMESTAMP() 
      AND pr.fim >= UTC_TIMESTAMP()
      AND p.disponivel = 1
      AND p.quantidade_estoque > 0
      ORDER BY p.id ASC
      LIMIT ?
    `;
    
    console.log('🔍 [DESTAQUES-CORRIGIDO] Executando query:', sql);
    console.log('🔍 [DESTAQUES-CORRIGIDO] Parâmetros:', [limite]);
    
    const resultados = await conexao.executarConsulta(sql, [limite]);
    
    console.log('✅ [DESTAQUES-CORRIGIDO] Produtos encontrados:', resultados.length);
    
    res.json({
      sucesso: true,
      total: resultados.length,
      produtos: resultados
    });
    
  } catch (erro) {
    console.error('❌ [DESTAQUES-CORRIGIDO] Erro:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao buscar produtos em destaque',
      erro: erro.message
    });
  }
});

// Endpoint para inserir dados de teste nas promoções
router.get('/inserir-promocoes-teste', async (req, res) => {
  console.log('📝 [INSERIR-PROMOCOES] Iniciando inserção de dados de teste...');
  
  try {
    // Primeiro, verificar se já existem promoções
    const promocoesExistentes = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');
    
    if (promocoesExistentes[0].total > 0) {
      return res.json({
        sucesso: true,
        mensagem: 'Dados de promoção já existem',
        total_existentes: promocoesExistentes[0].total
      });
    }
    
    // Inserir promoções de teste usando as colunas corretas
    const sqlInsert = `
      INSERT INTO promocoes_relampago 
      (nome, produto_id, preco_original, preco_promocional, desconto_percentual, inicio, fim, ativa, ativo, criado_em, quantidade_limite, quantidade_vendida, criado_por, data_criacao) 
      VALUES 
      ('Flash Sale Nike Air Max', 1, 499.99, 299.99, 40, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_ADD(NOW(), INTERVAL 30 DAY), 1, 1, NOW(), 100, 5, 1, NOW()),
      ('Oferta Especial Adidas', 2, 549.99, 349.99, 35, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_ADD(NOW(), INTERVAL 25 DAY), 1, 1, NOW(), 50, 3, 1, NOW()),
      ('Promoção Puma Running', 3, 399.99, 249.99, 30, NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY), 1, 1, NOW(), 75, 10, 1, NOW())
    `;
    
    await conexao.executarConsulta(sqlInsert);
    
    // Verificar se os dados foram inseridos
    const promocoesInseridas = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago WHERE ativo = 1');
    
    res.json({
      sucesso: true,
      mensagem: 'Promoções de teste inseridas com sucesso',
      total_inseridas: promocoesInseridas[0].total
    });
    
  } catch (erro) {
    console.error('❌ [INSERIR-PROMOCOES] Erro:', erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message,
      codigo: erro.code
    });
  }
});



module.exports = router;
