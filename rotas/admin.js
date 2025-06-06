const express = require('express');
const router = express.Router();
const Usuario = require('../modelos/Usuario');
const Produto = require('../modelos/Produto');
const Carrinho = require('../modelos/Carrinho');
const PromocaoRelampago = require('../modelos/PromocaoRelampago');
const conexao = require('../banco/conexao');
const { verificarAutenticacao, verificarPermissao } = require('../middleware/autenticacao');

// GET /api/admin/dashboard - Dashboard principal (apenas colaborador+)
router.get('/dashboard', verificarAutenticacao, verificarPermissao('colaborador'), async (req, res) => {
  try {
    const [
      estatisticasUsuarios,
      estatisticasProdutos,
      estatisticasCarrinho,
      estatisticasPromocoes
    ] = await Promise.all([
      Usuario.obterEstatisticas(),
      Produto.obterEstatisticas(),
      Carrinho.obterEstatisticas(),
      PromocaoRelampago.obterEstatisticas()
    ]);

    // Dados específicos por nível de acesso
    let dadosAdicionais = {};
      if (req.usuario.nivel_acesso === 'diretor') {
      // Logs recentes para diretores
      const logsRecentes = await conexao.executarConsulta(`
        SELECT * FROM logs_sistema 
        ORDER BY data_acao DESC 
        LIMIT 20
      `);
      dadosAdicionais.logs_recentes = logsRecentes;
    }

    res.json({
      sucesso: true,
      dados: {
        usuarios: estatisticasUsuarios,
        produtos: estatisticasProdutos,
        carrinho: estatisticasCarrinho,
        promocoes: estatisticasPromocoes,
        ...dadosAdicionais
      }
    });
  } catch (erro) {
    console.error('Erro ao obter dashboard:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao obter dashboard'
    });
  }
});

// GET /api/admin/usuarios - Gerenciar usuários (apenas diretor)
router.get('/usuarios', verificarAutenticacao, verificarPermissao('diretor'), async (req, res) => {
  try {
    const filtros = {
      nivel_acesso: req.query.nivel_acesso,
      ativo: req.query.ativo !== undefined ? req.query.ativo === 'true' : undefined,
      termo_pesquisa: req.query.busca,
      limite: req.query.limite ? parseInt(req.query.limite) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset) : undefined
    };

    const usuarios = await Usuario.buscarTodos(filtros);
    
    res.json({
      sucesso: true,
      dados: usuarios
    });
  } catch (erro) {
    console.error('Erro ao buscar usuários:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar usuários'
    });
  }
});

// PUT /api/admin/usuarios/:id/nivel-acesso - Alterar nível de acesso (apenas diretor)
router.put('/usuarios/:id/nivel-acesso', verificarAutenticacao, verificarPermissao('diretor'), async (req, res) => {
  try {
    const { nivel_acesso } = req.body;
    
    if (!nivel_acesso) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nível de acesso é obrigatório'
      });
    }

    const usuario = await Usuario.buscarPorId(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    // Não permitir alterar próprio nível de acesso
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível alterar seu próprio nível de acesso'
      });
    }

    const usuarioAtualizado = await usuario.alterarNivelAcesso(nivel_acesso);
    
    // Log da ação
    req.logAcao('nivel_acesso_alterado', { 
      usuario_id: usuario.id,
      nivel_anterior: usuario.nivel_acesso,
      nivel_novo: nivel_acesso
    });
    
    res.json({
      sucesso: true,
      dados: usuarioAtualizado,
      mensagem: 'Nível de acesso alterado com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao alterar nível de acesso:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor ao alterar nível de acesso'
    });
  }
});

// PUT /api/admin/usuarios/:id/status - Ativar/desativar usuário (apenas diretor)
router.put('/usuarios/:id/status', verificarAutenticacao, verificarPermissao('diretor'), async (req, res) => {
  try {
    const { ativo } = req.body;
    
    if (typeof ativo !== 'boolean') {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Status ativo deve ser true ou false'
      });
    }

    const usuario = await Usuario.buscarPorId(req.params.id);
    
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }

    // Não permitir desativar própria conta
    if (usuario.id === req.usuario.id) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Não é possível desativar sua própria conta'
      });
    }

    const usuarioAtualizado = await usuario.alterarStatusAtivo(ativo);
    
    // Log da ação
    req.logAcao('status_usuario_alterado', { 
      usuario_id: usuario.id,
      status_anterior: usuario.ativo,
      status_novo: ativo
    });
    
    res.json({
      sucesso: true,
      dados: usuarioAtualizado,
      mensagem: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`
    });
  } catch (erro) {
    console.error('Erro ao alterar status do usuário:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao alterar status do usuário'
    });
  }
});

// GET /api/admin/logs - Visualizar logs do sistema (apenas diretor)
router.get('/logs', verificarAutenticacao, verificarPermissao('diretor'), async (req, res) => {
  try {
    let sql = `
      SELECT 
        l.*,
        u.nome as usuario_nome,
        u.email as usuario_email
      FROM logs_sistema l
      LEFT JOIN usuarios u ON l.usuario_id = u.id
      WHERE 1=1
    `;
    const parametros = [];

    // Filtros
    if (req.query.usuario_id) {
      sql += ' AND l.usuario_id = ?';
      parametros.push(req.query.usuario_id);
    }

    if (req.query.acao) {
      sql += ' AND l.acao = ?';
      parametros.push(req.query.acao);
    }    if (req.query.data_inicio) {
      sql += ' AND l.data_acao >= ?';
      parametros.push(req.query.data_inicio);
    }

    if (req.query.data_fim) {
      sql += ' AND l.data_acao <= ?';
      parametros.push(req.query.data_fim);
    }

    sql += ' ORDER BY l.data_acao DESC';

    // Paginação
    if (req.query.limite) {
      sql += ' LIMIT ?';
      parametros.push(parseInt(req.query.limite));
      
      if (req.query.offset) {
        sql += ' OFFSET ?';
        parametros.push(parseInt(req.query.offset));
      }
    }

    const logs = await conexao.executarConsulta(sql, parametros);
    
    res.json({
      sucesso: true,
      dados: logs
    });
  } catch (erro) {
    console.error('Erro ao buscar logs:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar logs'
    });
  }
});

// GET /api/admin/relatorios/vendas - Relatório de vendas (apenas supervisor+)
router.get('/relatorios/vendas', verificarAutenticacao, verificarPermissao('supervisor'), async (req, res) => {
  try {
    // Simulação de relatório de vendas
    // Em um sistema real, seria baseado em uma tabela de pedidos/vendas
    const vendasPromocoes = await conexao.executarConsulta(`
      SELECT 
        DATE(pr.data_criacao) as data,
        COUNT(*) as total_promocoes,
        SUM(pr.quantidade_vendida) as produtos_vendidos,
        SUM(pr.quantidade_vendida * pr.preco_promocional) as receita
      FROM promocoes_relampago pr
      WHERE pr.quantidade_vendida > 0
      GROUP BY DATE(pr.data_criacao)
      ORDER BY data DESC
      LIMIT 30
    `);

    const topProdutos = await conexao.executarConsulta(`
      SELECT 
        p.nome,
        p.marca,
        COALESCE(SUM(pr.quantidade_vendida), 0) as quantidade_vendida,
        p.estoque,
        p.preco_atual
      FROM produtos p
      LEFT JOIN promocoes_relampago pr ON p.id = pr.produto_id
      GROUP BY p.id, p.nome, p.marca, p.estoque, p.preco_atual
      ORDER BY quantidade_vendida DESC
      LIMIT 10
    `);
    
    res.json({
      sucesso: true,
      dados: {
        vendas_por_dia: vendasPromocoes,
        top_produtos: topProdutos
      }
    });
  } catch (erro) {
    console.error('Erro ao gerar relatório de vendas:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao gerar relatório'
    });
  }
});

// GET /api/admin/relatorios/estoque - Relatório de estoque (apenas colaborador+)
router.get('/relatorios/estoque', verificarAutenticacao, verificarPermissao('colaborador'), async (req, res) => {
  try {
    const estoquesBaixos = await conexao.executarConsulta(`
      SELECT * FROM produtos 
      WHERE estoque <= 10 
      ORDER BY estoque ASC
    `);

    const estoquePorCategoria = await conexao.executarConsulta(`
      SELECT 
        categoria,
        COUNT(*) as total_produtos,
        SUM(estoque) as total_estoque,
        AVG(estoque) as estoque_medio,
        SUM(estoque * preco_atual) as valor_total
      FROM produtos
      GROUP BY categoria
      ORDER BY valor_total DESC
    `);

    const estoquePorMarca = await conexao.executarConsulta(`
      SELECT 
        marca,
        COUNT(*) as total_produtos,
        SUM(estoque) as total_estoque,
        AVG(preco_atual) as preco_medio
      FROM produtos
      GROUP BY marca
      ORDER BY total_estoque DESC
    `);
    
    res.json({
      sucesso: true,
      dados: {
        estoques_baixos: estoquesBaixos,
        estoque_por_categoria: estoquePorCategoria,
        estoque_por_marca: estoquePorMarca
      }
    });
  } catch (erro) {
    console.error('Erro ao gerar relatório de estoque:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao gerar relatório'
    });
  }
});

// POST /api/admin/backup - Fazer backup dos dados (apenas diretor)
router.post('/backup', verificarAutenticacao, verificarPermissao('diretor'), async (req, res) => {
  try {
    // Simulação de backup
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    // Log da ação
    req.logAcao('backup_realizado', { timestamp });
    
    res.json({
      sucesso: true,
      dados: {
        arquivo_backup: `backup_${timestamp}.sql`,
        data_backup: new Date().toISOString()
      },
      mensagem: 'Backup realizado com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao realizar backup:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao realizar backup'
    });
  }
});

// GET /api/admin/sistema/info - Informações do sistema (apenas diretor)
router.get('/sistema/info', verificarAutenticacao, verificarPermissao('diretor'), async (req, res) => {
  try {
    const tamanhoTabelaUsuarios = await conexao.executarConsulta(`
      SELECT COUNT(*) as total FROM usuarios
    `);
    
    const tamanhoTabelaProdutos = await conexao.executarConsulta(`
      SELECT COUNT(*) as total FROM produtos
    `);
    
    const tamanhoTabelaLogs = await conexao.executarConsulta(`
      SELECT COUNT(*) as total FROM logs_sistema
    `);

    res.json({
      sucesso: true,
      dados: {
        versao_sistema: '1.0.0',
        ambiente: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memoria_usada: process.memoryUsage(),
        tabelas: {
          usuarios: tamanhoTabelaUsuarios[0].total,
          produtos: tamanhoTabelaProdutos[0].total,
          logs: tamanhoTabelaLogs[0].total
        }
      }
    });
  } catch (erro) {
    console.error('Erro ao obter informações do sistema:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao obter informações do sistema'
    });
  }
});

// POST /api/admin/reset-rate-limit/:email - Reset rate limiting e desbloqueio (apenas diretor)
router.post('/reset-rate-limit/:email', verificarAutenticacao, verificarPermissao('diretor'), async (req, res) => {
  try {
    const { email } = req.params;
    const { nova_senha } = req.body;
    
    console.log(`🔓 Reset de rate limiting solicitado para: ${email}`);
    
    // 1. Resetar rate limiting global
    if (global.tentativasLogin) {
      global.tentativasLogin.clear();
      console.log('✅ Rate limiting global resetado');
    }
    
    // 2. Buscar e resetar usuário no banco
    const usuario = await Usuario.buscarPorEmail(email);
    if (!usuario) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário não encontrado'
      });
    }
    
    // 3. Resetar tentativas de login do usuário
    await usuario.resetarTentativasLogin();
    console.log('✅ Tentativas de login do usuário resetadas');
    
    // 4. Se fornecida nova senha, atualizar
    if (nova_senha && nova_senha.length >= 6) {
      await usuario.atualizar({ senha: nova_senha });
      console.log('✅ Senha do usuário atualizada');
    }
    
    // 5. Log da ação
    req.logAcao('rate_limit_resetado', { 
      email_resetado: email,
      nova_senha_definida: !!nova_senha
    });
    
    res.json({
      sucesso: true,
      mensagem: 'Rate limit resetado e usuário desbloqueado com sucesso',
      dados: {
        email: usuario.email,
        nome: usuario.nome,
        senha_resetada: !!nova_senha
      }
    });
    
  } catch (erro) {
    console.error('Erro ao resetar rate limit:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor'
    });
  }
});

// POST /api/admin/criar-usuario-equivalente - Criar usuário equivalente a maria@loja.com
router.post('/criar-usuario-equivalente', verificarAutenticacao, verificarPermissao('diretor'), async (req, res) => {
  try {
    const { email_base } = req.body;
    
    // Buscar usuário base
    const usuarioBase = await Usuario.buscarPorEmail(email_base);
    if (!usuarioBase) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Usuário base não encontrado'
      });
    }
    
    // Criar email alternativo
    const emailAlternativo = email_base.replace('@', '.teste@');
    const nomeAlternativo = `${usuarioBase.nome} (Teste)`;
    
    // Criar usuário equivalente
    const dadosNovoUsuario = {
      nome: nomeAlternativo,
      email: emailAlternativo,
      senha: '123456',
      nivel_acesso: usuarioBase.nivel_acesso || usuarioBase.tipo_usuario
    };
    
    const novoUsuario = await Usuario.criar(dadosNovoUsuario);
    
    // Log da ação
    req.logAcao('usuario_equivalente_criado', {
      usuario_base: email_base,
      usuario_novo: emailAlternativo
    });
    
    res.json({
      sucesso: true,
      mensagem: 'Usuário equivalente criado com sucesso',
      dados: {
        usuario_original: {
          email: usuarioBase.email,
          nome: usuarioBase.nome,
          nivel: usuarioBase.nivel_acesso || usuarioBase.tipo_usuario
        },
        usuario_novo: {
          email: novoUsuario.email,
          nome: novoUsuario.nome,
          senha: '123456',
          nivel: novoUsuario.nivel_acesso || novoUsuario.tipo_usuario
        }
      }
    });
    
  } catch (erro) {
    console.error('Erro ao criar usuário equivalente:', erro);
    
    if (erro.message === 'Email já está em uso') {
      return res.status(409).json({
        sucesso: false,
        mensagem: 'Usuário equivalente já existe'
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: erro.message || 'Erro interno do servidor'
    });
  }
});

module.exports = router;
