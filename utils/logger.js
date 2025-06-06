/**
 * @fileoverview Sistema de logs avançado para monitoramento de pedidos
 * @description Utilitário para logging estruturado com níveis e contexto
 * @author Sistema de Loja de Tênis
 * @version 1.0
 * @since 2025-01-30
 */

const fs = require('fs');
const path = require('path');

/**
 * Níveis de log suportados
 */
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

/**
 * Configuração do logger
 */
const CONFIG = {
  level: process.env.LOG_LEVEL || 'INFO',
  logDir: path.join(__dirname, '../logs'),
  maxFileSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5
};

/**
 * Classe Logger para sistema de pedidos
 */
class Logger {
  constructor() {
    // Criar diretório de logs se não existir
    if (!fs.existsSync(CONFIG.logDir)) {
      fs.mkdirSync(CONFIG.logDir, { recursive: true });
    }
  }

  /**
   * Formatar timestamp para logs
   */
  getTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Obter informações do contexto da requisição
   */
  getRequestContext(req) {
    if (!req) return {};
    
    return {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      userId: req.usuario?.id,
      requestId: req.id || 'unknown'
    };
  }

  /**
   * Criar entrada de log formatada
   */
  createLogEntry(level, message, data = {}, req = null) {
    return {
      timestamp: this.getTimestamp(),
      level,
      message,
      service: 'pedidos-api',
      ...this.getRequestContext(req),
      data,
      pid: process.pid,
      memory: process.memoryUsage(),
      uptime: process.uptime()
    };
  }

  /**
   * Escrever log em arquivo
   */
  writeToFile(entry) {
    const fileName = `pedidos-${new Date().toISOString().split('T')[0]}.log`;
    const filePath = path.join(CONFIG.logDir, fileName);
    
    const logLine = JSON.stringify(entry) + '\n';
    
    try {
      fs.appendFileSync(filePath, logLine);
      
      // Verificar tamanho do arquivo e rotacionar se necessário
      this.rotateLogIfNeeded(filePath);
    } catch (error) {
      console.error('Erro ao escrever log:', error);
    }
  }

  /**
   * Rotacionar logs quando necessário
   */
  rotateLogIfNeeded(filePath) {
    try {
      const stats = fs.statSync(filePath);
      
      if (stats.size > CONFIG.maxFileSize) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const newName = filePath.replace('.log', `-${timestamp}.log`);
        fs.renameSync(filePath, newName);
        
        // Limpar logs antigos
        this.cleanOldLogs();
      }
    } catch (error) {
      console.error('Erro ao rotacionar logs:', error);
    }
  }

  /**
   * Limpar logs antigos
   */
  cleanOldLogs() {
    try {
      const files = fs.readdirSync(CONFIG.logDir)
        .filter(file => file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(CONFIG.logDir, file),
          time: fs.statSync(path.join(CONFIG.logDir, file)).mtime
        }))
        .sort((a, b) => b.time - a.time);

      // Manter apenas os arquivos mais recentes
      if (files.length > CONFIG.maxFiles) {
        files.slice(CONFIG.maxFiles).forEach(file => {
          fs.unlinkSync(file.path);
        });
      }
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
    }
  }

  /**
   * Verificar se deve logar baseado no nível
   */
  shouldLog(level) {
    const currentLevel = LOG_LEVELS[CONFIG.level.toUpperCase()] || LOG_LEVELS.INFO;
    const messageLevel = LOG_LEVELS[level.toUpperCase()] || LOG_LEVELS.INFO;
    
    return messageLevel <= currentLevel;
  }

  /**
   * Log de erro
   */
  error(message, error = null, req = null) {
    if (!this.shouldLog('ERROR')) return;

    const data = {
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    };

    const entry = this.createLogEntry('ERROR', message, data, req);
    
    console.error('[ERROR]', message, data);
    this.writeToFile(entry);
  }

  /**
   * Log de aviso
   */
  warn(message, data = {}, req = null) {
    if (!this.shouldLog('WARN')) return;

    const entry = this.createLogEntry('WARN', message, data, req);
    
    console.warn('[WARN]', message, data);
    this.writeToFile(entry);
  }

  /**
   * Log de informação
   */
  info(message, data = {}, req = null) {
    if (!this.shouldLog('INFO')) return;

    const entry = this.createLogEntry('INFO', message, data, req);
    
    console.log('[INFO]', message, data);
    this.writeToFile(entry);
  }

  /**
   * Log de debug
   */
  debug(message, data = {}, req = null) {
    if (!this.shouldLog('DEBUG')) return;

    const entry = this.createLogEntry('DEBUG', message, data, req);
    
    console.log('[DEBUG]', message, data);
    this.writeToFile(entry);
  }

  /**
   * Log específico para operações de pedidos
   */
  pedidoOperation(operation, success, data = {}, req = null) {
    const message = `Operação de pedido: ${operation}`;
    const logData = {
      operation,
      success,
      ...data
    };

    if (success) {
      this.info(message, logData, req);
    } else {
      this.error(message, null, req);
    }
  }

  /**
   * Log de performance
   */
  performance(operation, duration, req = null) {
    const message = `Performance: ${operation}`;
    const data = {
      operation,
      duration: `${duration}ms`,
      performance: this.getPerformanceCategory(duration)
    };

    if (duration > 1000) {
      this.warn(message, data, req);
    } else {
      this.info(message, data, req);
    }
  }

  /**
   * Categorizar performance
   */
  getPerformanceCategory(duration) {
    if (duration < 100) return 'excellent';
    if (duration < 500) return 'good';
    if (duration < 1000) return 'acceptable';
    if (duration < 2000) return 'slow';
    return 'very_slow';
  }

  /**
   * Middleware para logging automático de requisições
   */
  requestMiddleware() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Gerar ID único para a requisição
      req.id = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Log início da requisição
      this.info('Requisição iniciada', {
        requestId: req.id,
        method: req.method,
        path: req.path,
        query: req.query,
        body: req.method === 'POST' ? req.body : undefined
      }, req);

      // Capturar resposta
      const originalSend = res.send;
      res.send = function(data) {
        const duration = Date.now() - startTime;
        
        // Log fim da requisição
        logger.info('Requisição finalizada', {
          requestId: req.id,
          statusCode: res.statusCode,
          duration: `${duration}ms`,
          responseSize: data ? data.length : 0
        }, req);

        // Log de performance
        logger.performance(`${req.method} ${req.path}`, duration, req);

        originalSend.call(this, data);
      };

      next();
    };
  }

  /**
   * Obter estatísticas dos logs
   */
  async getStats() {
    try {
      const files = fs.readdirSync(CONFIG.logDir)
        .filter(file => file.endsWith('.log'));

      const stats = {
        totalFiles: files.length,
        totalSize: 0,
        lastModified: null,
        logCounts: {
          ERROR: 0,
          WARN: 0,
          INFO: 0,
          DEBUG: 0
        }
      };

      for (const file of files) {
        const filePath = path.join(CONFIG.logDir, file);
        const fileStat = fs.statSync(filePath);
        
        stats.totalSize += fileStat.size;
        
        if (!stats.lastModified || fileStat.mtime > stats.lastModified) {
          stats.lastModified = fileStat.mtime;
        }

        // Contar logs por nível (apenas para arquivos pequenos)
        if (fileStat.size < 1024 * 1024) { // 1MB
          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.split('\n').filter(line => line.trim());
          
          lines.forEach(line => {
            try {
              const entry = JSON.parse(line);
              if (stats.logCounts[entry.level] !== undefined) {
                stats.logCounts[entry.level]++;
              }
            } catch (e) {
              // Ignorar linhas malformadas
            }
          });
        }
      }

      return stats;
    } catch (error) {
      this.error('Erro ao obter estatísticas dos logs', error);
      return null;
    }
  }
}

// Instância singleton
const logger = new Logger();

module.exports = logger;
