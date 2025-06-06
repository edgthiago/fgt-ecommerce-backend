const express = require('express');
const router = express.Router();
const Produto = require('../modelos/Produto');
const { verificarAutenticacao, verificarPermissao } = require('../middleware/autenticacao');
const { middleware, PERMISSOES } = require('../utils/sistema-permissoes');

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

module.exports = router;
