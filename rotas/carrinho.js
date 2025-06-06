const express = require('express');
const router = express.Router();
const Carrinho = require('../modelos/Carrinho');
const { verificarAutenticacao } = require('../middleware/autenticacao');
const { middleware } = require('../utils/sistema-permissoes');

// GET /api/carrinho - Obter carrinho do usuário logado
router.get('/', verificarAutenticacao, async (req, res) => {
  try {
    const itens = await Carrinho.buscarPorUsuario(req.usuario.id);
    const total = await Carrinho.calcularTotal(req.usuario.id);
    
    res.json({
      sucesso: true,
      dados: {
        itens,
        resumo: total
      }
    });
  } catch (erro) {
    console.error('Erro ao obter carrinho:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao obter carrinho'
    });
  }
});

// POST /api/carrinho/adicionar - Adicionar item ao carrinho
router.post('/adicionar', verificarAutenticacao, async (req, res) => {
  try {
    const { produto_id, quantidade, tamanho, cor } = req.body;

    // Validações básicas
    if (!produto_id || !quantidade) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Produto e quantidade são obrigatórios'
      });
    }

    if (quantidade <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Quantidade deve ser maior que zero'
      });
    }

    const dadosItem = {
      usuario_id: req.usuario.id,
      produto_id: parseInt(produto_id),
      quantidade: parseInt(quantidade),
      tamanho: tamanho || '',
      cor: cor || ''
    };    const item = await Carrinho.adicionarItem(dadosItem);
    
    // Log da ação (temporariamente desabilitado no servidor simples)
    // req.logAcao('item_adicionado_carrinho', { 
    //   produto_id: dadosItem.produto_id, 
    //   quantidade: dadosItem.quantidade 
    // });
    
    res.status(201).json({
      sucesso: true,
      dados: item,
      mensagem: 'Item adicionado ao carrinho com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao adicionar item ao carrinho:', erro);
    
    if (erro.message === 'Produto não encontrado') {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Produto não encontrado'
      });
    }
    
    if (erro.message.includes('Estoque insuficiente')) {
      return res.status(400).json({
        sucesso: false,
        mensagem: erro.message
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao adicionar item ao carrinho'
    });
  }
});

// PUT /api/carrinho/:itemId - Atualizar quantidade de item no carrinho
router.put('/:itemId', verificarAutenticacao, async (req, res) => {
  try {
    const { quantidade } = req.body;

    if (!quantidade || quantidade <= 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Quantidade deve ser maior que zero'
      });
    }

    // Buscar o item para verificar se pertence ao usuário
    const conexao = require('../banco/conexao');
    const itens = await conexao.executarConsulta(
      'SELECT * FROM carrinho WHERE id = ? AND usuario_id = ?',
      [req.params.itemId, req.usuario.id]
    );

    if (itens.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Item não encontrado no carrinho'
      });
    }

    const item = new Carrinho(itens[0]);
    const itemAtualizado = await item.atualizarQuantidade(parseInt(quantidade));
    
    // Log da ação
    req.logAcao('carrinho_atualizado', { 
      item_id: item.id,
      produto_id: item.produto_id,
      quantidade_anterior: itens[0].quantidade,
      quantidade_nova: quantidade 
    });
    
    res.json({
      sucesso: true,
      dados: itemAtualizado,
      mensagem: 'Quantidade atualizada com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao atualizar item do carrinho:', erro);
    
    if (erro.message.includes('Estoque insuficiente')) {
      return res.status(400).json({
        sucesso: false,
        mensagem: erro.message
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao atualizar item do carrinho'
    });
  }
});

// DELETE /api/carrinho/:itemId - Remover item do carrinho
router.delete('/:itemId', verificarAutenticacao, async (req, res) => {
  try {
    // Buscar o item para verificar se pertence ao usuário
    const conexao = require('../banco/conexao');
    const itens = await conexao.executarConsulta(
      'SELECT * FROM carrinho WHERE id = ? AND usuario_id = ?',
      [req.params.itemId, req.usuario.id]
    );

    if (itens.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Item não encontrado no carrinho'
      });
    }

    const item = new Carrinho(itens[0]);
    await item.remover();
    
    // Log da ação
    req.logAcao('item_removido_carrinho', { 
      item_id: item.id,
      produto_id: item.produto_id 
    });
    
    res.json({
      sucesso: true,
      mensagem: 'Item removido do carrinho com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao remover item do carrinho:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao remover item do carrinho'
    });
  }
});

// DELETE /api/carrinho - Limpar carrinho
router.delete('/', verificarAutenticacao, async (req, res) => {
  try {
    await Carrinho.limparCarrinho(req.usuario.id);
    
    // Log da ação
    req.logAcao('carrinho_limpo', { usuario_id: req.usuario.id });
    
    res.json({
      sucesso: true,
      mensagem: 'Carrinho limpo com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao limpar carrinho:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao limpar carrinho'
    });
  }
});

// POST /api/carrinho/validar - Validar carrinho antes da compra
router.post('/validar', verificarAutenticacao, async (req, res) => {
  try {
    const validacao = await Carrinho.validarCarrinho(req.usuario.id);
    
    res.json({
      sucesso: true,
      dados: validacao
    });
  } catch (erro) {
    console.error('Erro ao validar carrinho:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao validar carrinho'
    });
  }
});

// POST /api/carrinho/atualizar-precos - Atualizar preços dos itens do carrinho
router.post('/atualizar-precos', verificarAutenticacao, async (req, res) => {
  try {
    await Carrinho.atualizarPrecos(req.usuario.id);
    
    // Obter carrinho atualizado
    const itens = await Carrinho.buscarPorUsuario(req.usuario.id);
    const total = await Carrinho.calcularTotal(req.usuario.id);
    
    res.json({
      sucesso: true,
      dados: {
        itens,
        resumo: total
      },
      mensagem: 'Preços atualizados com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao atualizar preços do carrinho:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao atualizar preços'
    });
  }
});

// POST /api/carrinho/finalizar - Finalizar compra
router.post('/finalizar', verificarAutenticacao, middleware.verificarCompra, async (req, res) => {
  try {
    const { metodo_pagamento, parcelas, endereco_entrega, frete, desconto, observacoes } = req.body;

    // Validações básicas
    if (!metodo_pagamento) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Método de pagamento é obrigatório'
      });
    }

    const dadosPagamento = {
      metodo_pagamento: metodo_pagamento,
      parcelas: parcelas || 1,
      endereco_entrega: endereco_entrega,
      frete: frete || 0,
      desconto: desconto || 0,
      observacoes: observacoes || ''
    };

    const pedido = await Carrinho.finalizarCompra(req.usuario.id, dadosPagamento);
    
    // Log da ação (se a função existir)
    if (typeof req.logAcao === 'function') {
      req.logAcao('compra_finalizada', { 
        pedido_id: pedido.id,
        valor_total: pedido.valor_total,
        metodo_pagamento: metodo_pagamento 
      });
    }
    
    res.json({
      sucesso: true,
      dados: pedido,
      mensagem: 'Compra finalizada com sucesso'
    });
  } catch (erro) {
    console.error('Erro ao finalizar compra:', erro);
    
    if (erro.message.includes('Erro na validação do carrinho')) {
      return res.status(400).json({
        sucesso: false,
        mensagem: erro.message
      });
    }

    if (erro.message.includes('Carrinho vazio')) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Carrinho vazio'
      });
    }
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao finalizar compra'
    });
  }
});

// GET /api/carrinho/resumo - Obter resumo do carrinho
router.get('/resumo', verificarAutenticacao, async (req, res) => {
  try {
    const total = await Carrinho.calcularTotal(req.usuario.id);
    
    res.json({
      sucesso: true,
      dados: total
    });
  } catch (erro) {
    console.error('Erro ao obter resumo do carrinho:', erro);
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao obter resumo do carrinho'
    });
  }
});

module.exports = router;
