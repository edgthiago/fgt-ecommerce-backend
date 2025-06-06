/**
 * @fileoverview Sistema de métricas e monitoramento para pedidos
 * @description Coleta e análise de métricas de performance e uso
 * @author Sistema de Loja de Tênis
 * @version 1.0
 * @since 2025-01-30
 */

const logger = require('./logger');

/**
 * Classe para gerenciar métricas do sistema
 */
class MetricsCollector {
  constructor() {
    this.metrics = {
      // Contadores de requisições
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {},
        byUser: {}
      },
      
      // Métricas de performance
      performance: {
        averageResponseTime: 0,
        slowestRequest: { duration: 0, endpoint: '', timestamp: null },
        fastestRequest: { duration: Infinity, endpoint: '', timestamp: null },
        totalResponseTime: 0
      },
      
      // Métricas de pedidos
      pedidos: {
        totalConsultas: 0,
        pedidosEncontrados: 0,
        pedidosNaoEncontrados: 0,
        consultasPorUsuario: {},
        horariosPico: {},
        statusPedidos: {}
      },
      
      // Métricas de sistema
      system: {
        startTime: Date.now(),
        lastRequest: null,
        peakMemoryUsage: 0,
        currentConnections: 0
      }
    };
    
    // Iniciar coleta de métricas do sistema
    this.startSystemMonitoring();
  }

  /**
   * Registrar requisição
   */
  recordRequest(req, res, duration, success = true) {
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    const userId = req.usuario?.id;
    const hour = new Date().getHours();

    // Contadores gerais
    this.metrics.requests.total++;
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }

    // Por endpoint
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = { total: 0, success: 0, errors: 0 };
    }
    this.metrics.requests.byEndpoint[endpoint].total++;
    if (success) {
      this.metrics.requests.byEndpoint[endpoint].success++;
    } else {
      this.metrics.requests.byEndpoint[endpoint].errors++;
    }

    // Por usuário
    if (userId) {
      if (!this.metrics.requests.byUser[userId]) {
        this.metrics.requests.byUser[userId] = 0;
      }
      this.metrics.requests.byUser[userId]++;
    }

    // Performance
    this.updatePerformanceMetrics(endpoint, duration);

    // Horários de pico
    if (!this.metrics.pedidos.horariosPico[hour]) {
      this.metrics.pedidos.horariosPico[hour] = 0;
    }
    this.metrics.pedidos.horariosPico[hour]++;

    // Última requisição
    this.metrics.system.lastRequest = Date.now();

    // Log da métrica
    logger.debug('Métrica registrada', {
      endpoint,
      duration,
      success,
      userId
    });
  }

  /**
   * Atualizar métricas de performance
   */
  updatePerformanceMetrics(endpoint, duration) {
    // Tempo total e média
    this.metrics.performance.totalResponseTime += duration;
    this.metrics.performance.averageResponseTime = 
      this.metrics.performance.totalResponseTime / this.metrics.requests.total;

    // Requisição mais lenta
    if (duration > this.metrics.performance.slowestRequest.duration) {
      this.metrics.performance.slowestRequest = {
        duration,
        endpoint,
        timestamp: Date.now()
      };
    }

    // Requisição mais rápida
    if (duration < this.metrics.performance.fastestRequest.duration) {
      this.metrics.performance.fastestRequest = {
        duration,
        endpoint,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Registrar consulta de pedidos
   */
  recordPedidoQuery(userId, found = true, pedidosCount = 0, statusPedidos = []) {
    this.metrics.pedidos.totalConsultas++;
    
    if (found) {
      this.metrics.pedidos.pedidosEncontrados += pedidosCount;
    } else {
      this.metrics.pedidos.pedidosNaoEncontrados++;
    }

    // Consultas por usuário
    if (!this.metrics.pedidos.consultasPorUsuario[userId]) {
      this.metrics.pedidos.consultasPorUsuario[userId] = 0;
    }
    this.metrics.pedidos.consultasPorUsuario[userId]++;

    // Status dos pedidos
    statusPedidos.forEach(status => {
      if (!this.metrics.pedidos.statusPedidos[status]) {
        this.metrics.pedidos.statusPedidos[status] = 0;
      }
      this.metrics.pedidos.statusPedidos[status]++;
    });
  }  /**
   * Registrar erro na aplicação
   */
  recordError(endpoint, error, additionalInfo = {}) {
    // Incrementar contador de erros
    this.metrics.requests.errors++;
    
    // Registrar por endpoint
    if (!this.metrics.requests.byEndpoint[endpoint]) {
      this.metrics.requests.byEndpoint[endpoint] = { total: 0, success: 0, errors: 0 };
    }
    this.metrics.requests.byEndpoint[endpoint].errors++;
    
    // Log do erro para debugging
    logger.error('Erro registrado nas métricas', {
      endpoint,
      error: error.message || error,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      additionalInfo
    });
    
    // Se for erro relacionado a pedidos, registrar nas métricas de pedidos
    if (endpoint.includes('/pedidos')) {
      this.metrics.pedidos.pedidosNaoEncontrados++;
    }
  }

  /**
   * Registrar resposta da aplicação
   */
  recordResponse(duration, success = true) {
    // Atualizar métricas de performance
    this.metrics.performance.totalResponseTime += duration;
    this.metrics.performance.averageResponseTime = 
      this.metrics.performance.totalResponseTime / Math.max(this.metrics.requests.total, 1);
    
    // Log da resposta
    logger.debug('Resposta registrada nas métricas', {
      duration: `${duration}ms`,
      success,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Registrar operação específica de pedidos
   */
  recordPedidoOperation(operation, success, count = 0, userId = null) {
    // Registrar operação geral
    if (success) {
      this.metrics.requests.success++;
    } else {
      this.metrics.requests.errors++;
    }
    
    // Registrar nas métricas de pedidos
    if (operation === 'buscar_pedido') {
      if (success && count > 0) {
        this.metrics.pedidos.pedidosEncontrados += count;
      } else if (!success) {
        this.metrics.pedidos.pedidosNaoEncontrados++;
      }
    }
    
    // Log da operação
    logger.debug('Operação de pedido registrada nas métricas', {
      operation,
      success,
      count,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Iniciar monitoramento do sistema
   */
  startSystemMonitoring() {
    // Monitorar uso de memória a cada 30 segundos
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      
      if (memoryUsage.heapUsed > this.metrics.system.peakMemoryUsage) {
        this.metrics.system.peakMemoryUsage = memoryUsage.heapUsed;
      }

      // Log se o uso de memória estiver alto (> 500MB)
      if (memoryUsage.heapUsed > 500 * 1024 * 1024) {
        logger.warn('Alto uso de memória detectado', {
          heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
          rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`
        });
      }
    }, 30000);
  }

  /**
   * Obter resumo das métricas
   */
  getSummary() {
    const uptime = Date.now() - this.metrics.system.startTime;
    const uptimeHours = Math.round(uptime / (1000 * 60 * 60) * 100) / 100;

    return {
      uptime: {
        milliseconds: uptime,
        hours: uptimeHours,
        days: Math.round(uptimeHours / 24 * 100) / 100
      },
      requests: {
        total: this.metrics.requests.total,
        successRate: this.metrics.requests.total > 0 
          ? Math.round((this.metrics.requests.success / this.metrics.requests.total) * 100) 
          : 0,
        requestsPerHour: this.metrics.requests.total / Math.max(uptimeHours, 1)
      },
      performance: {
        averageResponseTime: Math.round(this.metrics.performance.averageResponseTime * 100) / 100,
        slowestRequest: this.metrics.performance.slowestRequest,
        fastestRequest: this.metrics.performance.fastestRequest.duration < Infinity 
          ? this.metrics.performance.fastestRequest 
          : null
      },
      pedidos: {
        totalConsultas: this.metrics.pedidos.totalConsultas,
        pedidosEncontrados: this.metrics.pedidos.pedidosEncontrados,
        taxaEncontro: this.metrics.pedidos.totalConsultas > 0
          ? Math.round((this.metrics.pedidos.pedidosEncontrados / this.metrics.pedidos.totalConsultas) * 100)
          : 0
      },
      memory: {
        current: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
        peak: `${Math.round(this.metrics.system.peakMemoryUsage / 1024 / 1024)}MB`
      }
    };
  }

  /**
   * Obter métricas detalhadas
   */
  getDetailedMetrics() {
    return {
      ...this.metrics,
      summary: this.getSummary()
    };
  }

  /**
   * Obter top usuários por requisições
   */
  getTopUsers(limit = 10) {
    const users = Object.entries(this.metrics.requests.byUser)
      .map(([userId, count]) => ({ userId, requests: count }))
      .sort((a, b) => b.requests - a.requests)
      .slice(0, limit);

    return users;
  }

  /**
   * Obter endpoints mais utilizados
   */
  getTopEndpoints(limit = 10) {
    const endpoints = Object.entries(this.metrics.requests.byEndpoint)
      .map(([endpoint, data]) => ({ 
        endpoint, 
        ...data,
        successRate: data.total > 0 ? Math.round((data.success / data.total) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);

    return endpoints;
  }

  /**
   * Obter horários de pico
   */
  getPeakHours() {
    const hours = Object.entries(this.metrics.pedidos.horariosPico)
      .map(([hour, count]) => ({ hour: parseInt(hour), requests: count }))
      .sort((a, b) => b.requests - a.requests);

    return hours;
  }

  /**
   * Gerar relatório de saúde do sistema
   */
  getHealthReport() {
    const summary = this.getSummary();
    const uptime = summary.uptime.hours;
    const successRate = summary.requests.successRate;
    const avgResponseTime = summary.performance.averageResponseTime;
    const memoryMB = parseInt(summary.memory.current);

    const health = {
      status: 'healthy',
      issues: [],
      recommendations: []
    };

    // Verificar taxa de sucesso
    if (successRate < 95) {
      health.status = 'warning';
      health.issues.push(`Taxa de sucesso baixa: ${successRate}%`);
      health.recommendations.push('Investigar erros frequentes');
    }

    // Verificar tempo de resposta
    if (avgResponseTime > 1000) {
      health.status = 'warning';
      health.issues.push(`Tempo de resposta alto: ${avgResponseTime}ms`);
      health.recommendations.push('Otimizar consultas ao banco de dados');
    }

    // Verificar uso de memória
    if (memoryMB > 500) {
      health.status = 'warning';
      health.issues.push(`Alto uso de memória: ${memoryMB}MB`);
      health.recommendations.push('Verificar vazamentos de memória');
    }

    // Verificar se há requisições recentes
    const timeSinceLastRequest = Date.now() - this.metrics.system.lastRequest;
    if (timeSinceLastRequest > 300000) { // 5 minutos
      health.status = 'warning';
      health.issues.push('Nenhuma requisição recente detectada');
      health.recommendations.push('Verificar conectividade da API');
    }

    return {
      ...health,
      summary,
      timestamp: Date.now()
    };
  }

  /**
   * Resetar métricas
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        byEndpoint: {},
        byUser: {}
      },
      performance: {
        averageResponseTime: 0,
        slowestRequest: { duration: 0, endpoint: '', timestamp: null },
        fastestRequest: { duration: Infinity, endpoint: '', timestamp: null },
        totalResponseTime: 0
      },
      pedidos: {
        totalConsultas: 0,
        pedidosEncontrados: 0,
        pedidosNaoEncontrados: 0,
        consultasPorUsuario: {},
        horariosPico: {},
        statusPedidos: {}
      },
      system: {
        startTime: Date.now(),
        lastRequest: null,
        peakMemoryUsage: 0,
        currentConnections: 0
      }
    };

    logger.info('Métricas resetadas');
  }

  /**
   * Middleware para coleta automática de métricas
   */
  middleware() {
    return (req, res, next) => {
      const startTime = Date.now();

      // Capturar resposta
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        const success = res.statusCode < 400;

        // Registrar métrica
        metrics.recordRequest(req, res, duration, success);

        // Se for uma rota de pedidos, registrar métricas específicas
        if (req.path.includes('/pedidos')) {
          try {
            const responseData = typeof data === 'string' ? JSON.parse(data) : data;
            
            if (responseData.sucesso && responseData.dados) {
              const pedidos = Array.isArray(responseData.dados) 
                ? responseData.dados 
                : [responseData.dados];
              
              const statusPedidos = pedidos.map(p => p.status_pedido).filter(Boolean);
              
              metrics.recordPedidoQuery(
                req.usuario?.id,
                true,
                pedidos.length,
                statusPedidos
              );
            } else if (!responseData.sucesso) {
              metrics.recordPedidoQuery(req.usuario?.id, false);
            }
          } catch (error) {
            logger.warn('Erro ao processar métricas de pedidos', { error: error.message });
          }
        }

        originalSend.call(this, data);
      };

      next();
    };
  }
}

// Instância singleton
const metrics = new MetricsCollector();

module.exports = metrics;
