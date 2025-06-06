const express = require('express');
const router = express.Router();
const PromocaoRelampago = require('../modelos/PromocaoRelampago');
const { verificarAutenticacao, verificarPermissao } = require('../middleware/autenticacao');

// GET /api/promocoes - Buscar promoções (público - apenas ativas e visíveis)
router.get('/', async (req, res) => {
  try {
    const promocoes = await PromocaoRelampago.buscarAtivas();
    
    res.json({
      sucesso: true,
      dados: promocoes
    });
  } catch (erro) {
    console.error('Erro ao buscar promoções:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar promoções'
    });
  }
});

// GET /api/promocoes/:id - Buscar promoção específica (público)
router.get('/:id', async (req, res) => {
  try {
    const promocao = await PromocaoRelampago.buscarPorId(req.params.id);
    
    if (!promocao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Promoção não encontrada'
      });
    }

    // Se não for um usuário autenticado, só mostrar se estiver ativa e visível
    if (!req.usuario && (!promocao.ativa || !promocao.visivel || !promocao.estaVigente())) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Promoção não encontrada'
      });
    }
    
    res.json({
      sucesso: true,
      dados: promocao
    });
  } catch (erro) {
    console.error('Erro ao buscar promoção:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar promoção'
    });
  }
});

// GET /api/promocoes/admin/todas - Buscar todas as promoções (apenas supervisor+)
router.get('/admin/todas', verificarAutenticacao, verificarPermissao('supervisor'), async (req, res) => {
  try {
    const filtros = {
      apenas_ativas: req.query.apenas_ativas === 'true',
      apenas_visiveis: req.query.apenas_visiveis === 'true',
      produto_id: req.query.produto_id ? parseInt(req.query.produto_id) : undefined,
      data_inicio: req.query.data_inicio,
      data_fim: req.query.data_fim,
      limite: req.query.limite ? parseInt(req.query.limite) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    };

    const promocoes = await PromocaoRelampago.buscarTodas(filtros);
    
    res.json({
      sucesso: true,
      dados: promocoes
    });
  } catch (erro) {
    console.error('Erro ao buscar todas as promoções:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar promoções'
    });
  }
});

// POST /api/promocoes - Criar nova promoção (apenas supervisor+)
router.post('/', verificarAutenticacao, verificarPermissao('supervisor'), async (req, res) => {
  try {
    const dadosPromocao = {
      nome: req.body.nome,
      descricao: req.body.descricao,
      produto_id: parseInt(req.body.produto_id),
      desconto_percentual: req.body.desconto_percentual ? parseFloat(req.body.desconto_percentual) : undefined,
      preco_promocional: req.body.preco_promocional ? parseFloat(req.body.preco_promocional) : undefined,
      quantidade_disponivel: req.body.quantidade_disponivel ? parseInt(req.body.quantidade_disponivel) : undefined,
      data_inicio: req.body.data_inicio,
      data_fim: req.body.data_fim,
      ativa: req.body.ativa !== false,
      visivel: req.body.visivel !== false
    };

    // Validações básicas
    if (!dadosPromocao.nome || !dadosPromocao.produto_id || !dadosPromocao.data_inicio || !dadosPromocao.data_fim) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Campos obrigatórios: nome, produto_id, data_inicio, data_fim'
      });
    }

    if (!dadosPromocao.desconto_percentual && !dadosPromocao.preco_promocional) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'É necessário informar desconto_percentual ou preco_promocional'
      });
    }

    // Validar datas
    const dataInicio = new Date(dadosPromocao.data_inicio);
    const dataFim = new Date(dadosPromocao.data_fim);
    
    if (dataFim <= dataInicio) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Data fim deve ser posterior à data início'
      });
    }

    const promocao = await PromocaoRelampago.criar(dadosPromocao, req.usuario.id);
    
    // Log da ação
    req.logAcao('promocao_criada', { 
      promocao_id: promocao.id, 
      produto_id: dadosPromocao.produto_id,
      dados: dadosPromocao 
    });
    
    res.status(201).json({
      sucesso: true,
      dados: promocao,
      mensagem: 'Promoção criada com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao criar promoção:', erro);
    
    if (erro.message === 'Produto não encontrado') {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }
    
    if (erro.message === 'Já existe uma promoção ativa para este produto') {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Já existe uma promoção ativa para este produto'
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor ao criar promoção'
    });
  }
});

// PUT /api/promocoes/:id - Atualizar promoção (apenas supervisor+)
router.put('/:id', verificarAutenticacao, verificarPermissao('supervisor'), async (req, res) => {
  try {
    const promocao = await PromocaoRelampago.buscarPorId(req.params.id);
    
    if (!promocao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Promoção não encontrada'
      });
    }

    const dadosAtualizacao = {};
    
    // Campos que podem ser atualizados
    const camposPermitidos = [
      'nome', 'descricao', 'desconto_percentual', 'preco_promocional',
      'quantidade_disponivel', 'data_inicio', 'data_fim', 'ativa', 'visivel'
    ];

    camposPermitidos.forEach(campo => {
      if (req.body[campo] !== undefined) {
        dadosAtualizacao[campo] = req.body[campo];
      }
    });

    // Validar datas se fornecidas
    if (dadosAtualizacao.data_inicio && dadosAtualizacao.data_fim) {
      const dataInicio = new Date(dadosAtualizacao.data_inicio);
      const dataFim = new Date(dadosAtualizacao.data_fim);
      
      if (dataFim <= dataInicio) {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Data fim deve ser posterior à data início'
        });
      }
    }

    const promocaoAtualizada = await promocao.atualizar(dadosAtualizacao);
    
    // Log da ação
    req.logAcao('promocao_atualizada', { 
      promocao_id: promocao.id, 
      dados: dadosAtualizacao 
    });
    
    res.json({
      sucesso: true,
      dados: promocaoAtualizada,
      mensagem: 'Promoção atualizada com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao atualizar promoção:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor ao atualizar promoção'
    });
  }
});

// PATCH /api/promocoes/:id/status - Ativar/desativar promoção (apenas supervisor+)
router.patch('/:id/status', verificarAutenticacao, verificarPermissao('supervisor'), async (req, res) => {
  try {
    const promocao = await PromocaoRelampago.buscarPorId(req.params.id);
    
    if (!promocao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Promoção não encontrada'
      });
    }

    const { ativa } = req.body;
    
    if (typeof ativa !== 'boolean') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Campo ativa deve ser true ou false'
      });
    }

    const promocaoAtualizada = await promocao.alterarStatus(ativa);
    
    // Log da ação
    req.logAcao('promocao_status_alterado', { 
      promocao_id: promocao.id, 
      status_anterior: promocao.ativa,
      status_novo: ativa 
    });
    
    res.json({
      sucesso: true,
      dados: promocaoAtualizada,
      mensagem: `Promoção ${ativa ? 'ativada' : 'desativada'} com sucesso`
    });
  } catch (erro) {
    console.error('Erro ao alterar status da promoção:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao alterar status da promoção'
    });
  }
});

// DELETE /api/promocoes/:id - Deletar promoção (apenas diretor)
router.delete('/:id', verificarAutenticacao, verificarPermissao('diretor'), async (req, res) => {
  try {
    const promocao = await PromocaoRelampago.buscarPorId(req.params.id);
    
    if (!promocao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Promoção não encontrada'
      });
    }

    await promocao.deletar();
    
    // Log da ação
    req.logAcao('promocao_deletada', { 
      promocao_id: promocao.id, 
      promocao_nome: promocao.nome 
    });
    
    res.json({
      sucesso: true,
      mensagem: 'Promoção deletada com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao deletar promoção:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao deletar promoção'
    });
  }
});

// POST /api/promocoes/:id/comprar - Comprar produto em promoção
router.post('/:id/comprar', verificarAutenticacao, async (req, res) => {
  try {
    const promocao = await PromocaoRelampago.buscarPorId(req.params.id);
    
    if (!promocao) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Promoção não encontrada'
      });
    }

    if (!promocao.estaVigente()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Promoção não está vigente'
      });
    }

    if (!promocao.temEstoqueDisponivel()) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Estoque da promoção esgotado'
      });
    }

    const { quantidade } = req.body;
    const quantidadeCompra = quantidade || 1;

    await promocao.registrarVenda(quantidadeCompra);
    
    // Log da ação
    req.logAcao('compra_promocional', { 
      promocao_id: promocao.id, 
      produto_id: promocao.produto_id,
      quantidade: quantidadeCompra,
      valor_unitario: promocao.preco_promocional 
    });
    
    res.json({
      sucesso: true,
      dados: {
        promocao_id: promocao.id,
        quantidade: quantidadeCompra,
        valor_unitario: promocao.preco_promocional,
        valor_total: promocao.preco_promocional * quantidadeCompra
      },
      mensagem: 'Compra promocional realizada com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao realizar compra promocional:', erro);
    res.status(400).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor ao realizar compra promocional'
    });
  }
});

// GET /api/promocoes/admin/estatisticas - Obter estatísticas das promoções (apenas supervisor+)
router.get('/admin/estatisticas', verificarAutenticacao, verificarPermissao('supervisor'), async (req, res) => {
  try {
    const estatisticas = await PromocaoRelampago.obterEstatisticas();
    
    res.json({
      sucesso: true,
      dados: estatisticas
    });
  } catch (erro) {
    console.error('Erro ao obter estatísticas das promoções:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao obter estatísticas'
    });
  }
});

// GET /api/promocoes/admin/proximas-expiracao - Promoções próximas do vencimento (apenas supervisor+)
router.get('/admin/proximas-expiracao', verificarAutenticacao, verificarPermissao('supervisor'), async (req, res) => {
  try {
    const horasAntes = req.query.horas ? parseInt(req.query.horas) : 24;
    const promocoes = await PromocaoRelampago.buscarProximasExpiracao(horasAntes);
    
    res.json({
      sucesso: true,
      dados: promocoes
    });
  } catch (erro) {
    console.error('Erro ao buscar promoções próximas do vencimento:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar promoções próximas do vencimento'
    });
  }
});

// POST /api/promocoes/admin/desativar-expiradas - Desativar promoções expiradas (apenas supervisor+)
router.post('/admin/desativar-expiradas', verificarAutenticacao, verificarPermissao('supervisor'), async (req, res) => {
  try {
    const promocoesDesativadas = await PromocaoRelampago.desativarExpiradas();
    
    // Log da ação
    req.logAcao('promocoes_expiradas_desativadas', { 
      quantidade: promocoesDesativadas 
    });
    
    res.json({
      sucesso: true,
      dados: {
        promocoes_desativadas: promocoesDesativadas
      },
      mensagem: `${promocoesDesativadas} promoções expiradas foram desativadas`
    });
  } catch (erro) {
    console.error('Erro ao desativar promoções expiradas:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao desativar promoções expiradas'
    });
  }
});

module.exports = router;
