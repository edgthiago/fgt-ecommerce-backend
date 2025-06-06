/**
 * @fileoverview Rotas para gerenciamento de pedidos do sistema de loja de tênis
 * @description Este módulo contém endpoints para consulta de pedidos realizados pelos usuários
 * @author Sistema de Loja de Tênis
 * @version 1.0
 * @since 2025-01-30
 */

const express = require('express');
const router = express.Router();
const conexao = require('../banco/conexao');
const { verificarAutenticacao } = require('../middleware/autenticacao');
const logger = require('../utils/logger');
const metrics = require('../utils/metrics');

/**
 * @route GET /api/pedidos
 * @description Obtém lista de pedidos do usuário autenticado
 * @access Privado (requer JWT token)
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.usuario - Dados do usuário autenticado (via middleware)
 * @param {number} req.usuario.id - ID do usuário
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} JSON com lista de pedidos ou erro
 * @example
 * // Resposta de sucesso:
 * {
 *   "sucesso": true,
 *   "dados": [
 *     {
 *       "id": "PED-1748884452492-178",
 *       "valor_total": 999.98,
 *       "status_pedido": "confirmado",
 *       "data_pedido": "2025-01-30T12:30:15.000Z",
 *       "itens": [...]
 *     }
 *   ]
 * }
 */
router.get('/', verificarAutenticacao, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Registrar início da requisição
    metrics.recordRequest(req.method, req.originalUrl, req.usuario?.id);
    
    logger.info('Iniciando busca de pedidos', { 
      usuarioId: req.usuario.id,
      requestId: req.id 
    }, req);

    // Consulta SQL para buscar pedidos do usuário ordenados por data
    // Limitado a 20 registros para otimizar performance
    const pedidos = await conexao.executarConsulta(`
      SELECT 
        id,                    -- ID único do pedido (ex: PED-timestamp-random)
        valor_total,           -- Valor total da compra
        valor_desconto,        -- Desconto aplicado
        valor_frete,          -- Valor do frete
        forma_pagamento,      -- Método de pagamento utilizado
        observacoes,          -- Observações do cliente
        status_pedido,        -- Status atual (confirmado, cancelado, etc.)
        data_pedido,          -- Data e hora da criação
        itens_json            -- JSON com os produtos comprados
      FROM pedidos_simples 
      WHERE usuario_id = ? 
      ORDER BY data_pedido DESC
      LIMIT 20
    `, [req.usuario.id]);

    // Processa os pedidos para deserializar o JSON dos itens
    // Cada pedido tem seus itens convertidos de JSON string para array
    const pedidosFormatados = pedidos.map(pedido => ({
      ...pedido,
      // Converte itens_json string para array de objetos
      itens: pedido.itens_json ? JSON.parse(pedido.itens_json) : []
    }));

    const duration = Date.now() - startTime;
      // Registrar métricas de performance e operação de pedidos
    metrics.recordPedidoQuery(req.usuario.id, true, pedidosFormatados.length);
    
    // Log de sucesso
    logger.pedidoOperation('listar_pedidos', true, {
      usuarioId: req.usuario.id,
      quantidadePedidos: pedidosFormatados.length,
      duration: `${duration}ms`
    }, req);

    // Log de performance
    logger.performance('GET /pedidos', duration, req);

    // Retorna resposta padronizada de sucesso
    res.json({
      sucesso: true,
      dados: pedidosFormatados
    });  } catch (erro) {
    const duration = Date.now() - startTime;
    
    // Log detalhado do erro para debugging e monitoramento
    logger.error('Erro ao buscar pedidos', erro, req);
    
    // Log de operação falhada
    logger.pedidoOperation('listar_pedidos', false, {
      usuarioId: req.usuario.id,
      duration: `${duration}ms`,
      errorMessage: erro.message
    }, req);
    
    // Retorna erro genérico para o cliente (sem expor detalhes internos)
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar pedidos'
    });
  }
});

/**
 * @route GET /api/pedidos/:pedidoId
 * @description Obtém detalhes de um pedido específico do usuário autenticado
 * @access Privado (requer JWT token)
 * @param {Object} req - Objeto de requisição Express
 * @param {Object} req.params - Parâmetros da URL
 * @param {string} req.params.pedidoId - ID único do pedido a ser consultado
 * @param {Object} req.usuario - Dados do usuário autenticado (via middleware)
 * @param {number} req.usuario.id - ID do usuário
 * @param {Object} res - Objeto de resposta Express
 * @returns {Object} JSON com dados do pedido ou erro (404 se não encontrado)
 * @example
 * // Requisição: GET /api/pedidos/PED-1748884452492-178
 * // Resposta de sucesso:
 * {
 *   "sucesso": true,
 *   "dados": {
 *     "id": "PED-1748884452492-178",
 *     "valor_total": 999.98,
 *     "itens": [...]
 *   }
 * }
 */
// GET /api/pedidos/:pedidoId - Obter pedido específico
router.get('/:pedidoId', verificarAutenticacao, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Registrar início da requisição
    metrics.recordRequest(req.method, req.originalUrl, req.usuario?.id);
    
    logger.info('Iniciando busca de pedido específico', { 
      usuarioId: req.usuario.id,
      pedidoId: req.params.pedidoId,
      requestId: req.id 
    }, req);

    // Consulta SQL para buscar pedido específico
    // Importante: inclui filtro por usuario_id para segurança
    const pedidos = await conexao.executarConsulta(`
      SELECT 
        id,                    -- ID único do pedido
        valor_total,           -- Valor total da compra
        valor_desconto,        -- Desconto aplicado
        valor_frete,          -- Valor do frete
        forma_pagamento,      -- Método de pagamento utilizado
        observacoes,          -- Observações do cliente
        status_pedido,        -- Status atual do pedido
        data_pedido,          -- Data e hora da criação
        itens_json            -- JSON com os produtos comprados
      FROM pedidos_simples 
      WHERE id = ? AND usuario_id = ?
    `, [req.params.pedidoId, req.usuario.id]);

    const duration = Date.now() - startTime;    // Verifica se o pedido foi encontrado e pertence ao usuário
    if (pedidos.length === 0) {
      // Registrar métricas para pedido não encontrado
      metrics.recordPedidoQuery(req.usuario.id, false, 0);
      
      logger.warn('Pedido não encontrado', {
        usuarioId: req.usuario.id,
        pedidoId: req.params.pedidoId,
        duration: `${duration}ms`
      }, req);

      logger.pedidoOperation('buscar_pedido', false, {
        usuarioId: req.usuario.id,
        pedidoId: req.params.pedidoId,
        motivo: 'pedido_nao_encontrado'
      }, req);

      return res.status(404).json({
        sucesso: false,
        mensagem: 'Pedido não encontrado'
      });
    }

    // Processa o pedido para deserializar o JSON dos itens
    const pedido = {
      ...pedidos[0],
      // Converte itens_json string para array de objetos
      itens: pedidos[0].itens_json ? JSON.parse(pedidos[0].itens_json) : []
    };

    // Registrar métricas de sucesso
    metrics.recordResponse(duration);
    metrics.recordPedidoOperation('buscar_pedido', true, 1, req.usuario.id);

    // Log de sucesso
    logger.pedidoOperation('buscar_pedido', true, {
      usuarioId: req.usuario.id,
      pedidoId: req.params.pedidoId,
      valorTotal: pedido.valor_total,
      quantidadeItens: pedido.itens.length,
      duration: `${duration}ms`
    }, req);

    // Log de performance
    logger.performance('GET /pedidos/:id', duration, req);

    // Retorna resposta padronizada de sucesso com o pedido encontrado
    res.json({
      sucesso: true,
      dados: pedido
    });
  } catch (erro) {
    const duration = Date.now() - startTime;
    
    // Registrar erro nas métricas
    metrics.recordError(req.originalUrl, erro);
    
    // Log detalhado do erro para debugging e monitoramento
    logger.error('Erro ao buscar pedido específico', erro, req);
    
    // Log de operação falhada
    logger.pedidoOperation('buscar_pedido', false, {
      usuarioId: req.usuario.id,
      pedidoId: req.params.pedidoId,
      duration: `${duration}ms`,
      errorMessage: erro.message
    }, req);
    
    // Retorna erro genérico para o cliente (sem expor detalhes internos)
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor ao buscar pedido'
    });
  }
});

/**
 * @module PedidosRouter
 * @description Exporta o roteador configurado para ser usado no servidor principal
 * @see ../servidor.js - Arquivo onde este módulo é importado e registrado
 */
module.exports = router;
