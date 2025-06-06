/**
 * @fileoverview Rotas administrativas para visualização de métricas
 * @description Endpoints para monitoramento e análise do sistema de pedidos
 * @author Sistema de Loja de Tênis
 * @version 1.0
 * @since 2025-01-30
 */

const express = require('express');
const router = express.Router();
const metrics = require('../utils/metrics');
const logger = require('../utils/logger');

/**
 * @route GET /admin/metrics/summary
 * @description Obtém resumo das métricas do sistema
 * @access Administrativo
 */
router.get('/summary', (req, res) => {
  try {
    const summary = metrics.getSummary();
    
    logger.info('Resumo de métricas solicitado', { 
      ip: req.ip,
      timestamp: Date.now() 
    });

    res.json({
      sucesso: true,
      dados: summary
    });
  } catch (error) {
    logger.error('Erro ao obter resumo de métricas', error);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /admin/metrics/detailed
 * @description Obtém métricas detalhadas do sistema
 * @access Administrativo
 */
router.get('/detailed', (req, res) => {
  try {
    const detailed = metrics.getDetailedMetrics();
    
    logger.info('Métricas detalhadas solicitadas', { 
      ip: req.ip,
      timestamp: Date.now() 
    });

    res.json({
      sucesso: true,
      dados: detailed
    });
  } catch (error) {
    logger.error('Erro ao obter métricas detalhadas', error);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /admin/metrics/health
 * @description Obtém relatório de saúde do sistema
 * @access Administrativo
 */
router.get('/health', (req, res) => {
  try {
    const health = metrics.getHealthReport();
    
    logger.info('Relatório de saúde solicitado', { 
      status: health.status,
      issues: health.issues.length,
      ip: req.ip 
    });

    res.json({
      sucesso: true,
      dados: health
    });
  } catch (error) {
    logger.error('Erro ao obter relatório de saúde', error);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /admin/metrics/top-users
 * @description Obtém usuários com mais requisições
 * @access Administrativo
 */
router.get('/top-users', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topUsers = metrics.getTopUsers(limit);
    
    logger.info('Top usuários solicitado', { 
      limit,
      ip: req.ip 
    });

    res.json({
      sucesso: true,
      dados: topUsers
    });
  } catch (error) {
    logger.error('Erro ao obter top usuários', error);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /admin/metrics/top-endpoints
 * @description Obtém endpoints mais utilizados
 * @access Administrativo
 */
router.get('/top-endpoints', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topEndpoints = metrics.getTopEndpoints(limit);
    
    logger.info('Top endpoints solicitado', { 
      limit,
      ip: req.ip 
    });

    res.json({
      sucesso: true,
      dados: topEndpoints
    });
  } catch (error) {
    logger.error('Erro ao obter top endpoints', error);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /admin/metrics/peak-hours
 * @description Obtém horários de pico de uso
 * @access Administrativo
 */
router.get('/peak-hours', (req, res) => {
  try {
    const peakHours = metrics.getPeakHours();
    
    logger.info('Horários de pico solicitados', { 
      ip: req.ip 
    });

    res.json({
      sucesso: true,
      dados: peakHours
    });
  } catch (error) {
    logger.error('Erro ao obter horários de pico', error);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

/**
 * @route POST /admin/metrics/reset
 * @description Reseta as métricas do sistema
 * @access Administrativo
 */
router.post('/reset', (req, res) => {
  try {
    const oldSummary = metrics.getSummary();
    metrics.reset();
    
    logger.warn('Métricas resetadas', { 
      oldSummary,
      ip: req.ip,
      timestamp: Date.now()
    });

    res.json({
      sucesso: true,
      mensagem: 'Métricas resetadas com sucesso'
    });
  } catch (error) {
    logger.error('Erro ao resetar métricas', error);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /admin/logs/stats
 * @description Obtém estatísticas dos logs
 * @access Administrativo
 */
router.get('/logs/stats', async (req, res) => {
  try {
    const logStats = await logger.getStats();
    
    logger.info('Estatísticas de logs solicitadas', { 
      ip: req.ip 
    });

    res.json({
      sucesso: true,
      dados: logStats
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas de logs', error);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

/**
 * @route GET /admin/dashboard
 * @description Obtém dados consolidados para dashboard
 * @access Administrativo
 */
router.get('/dashboard', async (req, res) => {
  try {
    const [summary, health, topUsers, topEndpoints, peakHours, logStats] = await Promise.all([
      Promise.resolve(metrics.getSummary()),
      Promise.resolve(metrics.getHealthReport()),
      Promise.resolve(metrics.getTopUsers(5)),
      Promise.resolve(metrics.getTopEndpoints(5)),
      Promise.resolve(metrics.getPeakHours()),
      logger.getStats()
    ]);

    const dashboard = {
      summary,
      health,
      topUsers,
      topEndpoints,
      peakHours,
      logs: logStats,
      timestamp: Date.now()
    };
    
    logger.info('Dashboard solicitado', { 
      ip: req.ip 
    });

    res.json({
      sucesso: true,
      dados: dashboard
    });
  } catch (error) {
    logger.error('Erro ao obter dados do dashboard', error);
    
    res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
