// Configuração de conexão universal - MySQL e PostgreSQL
// Arquivo: conexao-universal.js

const mysql = require('mysql2/promise');
const { Client: PostgreSQLClient, Pool: PostgreSQLPool } = require('pg');

class ConexaoUniversal {
    constructor() {
        this.tipo = this.detectarTipoBanco();
        this.pool = null;
        this.inicializarConexao();
    }

    detectarTipoBanco() {
        // Detecta tipo de banco pelas variáveis de ambiente
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('postgres')) {
            return 'postgresql';
        }
        if (process.env.PGHOST || process.env.POSTGRES_URL) {
            return 'postgresql';
        }
        if (process.env.DB_HOST || process.env.MYSQL_URL || process.env.MYSQLHOST) {
            return 'mysql';
        }
        
        // Default para PostgreSQL (Railway)
        return 'postgresql';
    }

    async inicializarConexao() {
        try {
            if (this.tipo === 'postgresql') {
                await this.configurarPostgreSQL();
            } else {
                await this.configurarMySQL();
            }
            
            console.log(`✅ Conectado ao ${this.tipo.toUpperCase()}!`);
            await this.testarConexao();
        } catch (erro) {
            console.error(`❌ Erro ao conectar ao ${this.tipo}:`, erro.message);
            // Não finaliza o processo - continua sem banco
            this.pool = null;
        }
    }

    async configurarPostgreSQL() {
        const config = {
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        };

        // Fallback para variáveis individuais
        if (!config.connectionString) {
            config.host = process.env.PGHOST || 'localhost';
            config.user = process.env.PGUSER || 'postgres';
            config.password = process.env.PGPASSWORD || '';
            config.database = process.env.PGDATABASE || 'fgt_ecommerce';
            config.port = process.env.PGPORT || 5432;
        }

        this.pool = new PostgreSQLPool(config);
    }

    async configurarMySQL() {
        const config = {
            host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
            user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
            password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
            database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'fgt_ecommerce',
            port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            charset: 'utf8mb4',
            timezone: '-03:00'
        };

        this.pool = mysql.createPool(config);
    }

    async testarConexao() {
        if (!this.pool) return false;

        try {
            if (this.tipo === 'postgresql') {
                const client = await this.pool.connect();
                await client.query('SELECT 1');
                client.release();
            } else {
                const conexao = await this.pool.getConnection();
                await conexao.query('SELECT 1');
                conexao.release();
            }
            return true;
        } catch (erro) {
            console.error('❌ Teste de conexão falhou:', erro.message);
            return false;
        }
    }

    async executarConsulta(sql, parametros = []) {
        if (!this.pool) {
            throw new Error('Conexão com banco de dados não disponível');
        }

        try {
            if (this.tipo === 'postgresql') {
                // Converter placeholders MySQL (?) para PostgreSQL ($1, $2...)
                const sqlPostgres = this.converterPlaceholders(sql);
                const client = await this.pool.connect();
                const result = await client.query(sqlPostgres, parametros);
                client.release();
                return result.rows;
            } else {
                const [resultados] = await this.pool.query(sql, parametros);
                return resultados;
            }
        } catch (erro) {
            console.error('❌ Erro na consulta:', erro.message);
            console.error('📝 SQL:', sql);
            console.error('🔧 Parâmetros:', parametros);
            throw erro;
        }
    }

    converterPlaceholders(sql) {
        // Converte ? para $1, $2, etc (PostgreSQL)
        let contador = 1;
        return sql.replace(/\?/g, () => `$${contador++}`);
    }

    async executarTransaction(operacoes) {
        if (!this.pool) {
            throw new Error('Conexão com banco de dados não disponível');
        }

        if (this.tipo === 'postgresql') {
            const client = await this.pool.connect();
            try {
                await client.query('BEGIN');
                const resultados = [];
                
                for (const operacao of operacoes) {
                    const sqlPostgres = this.converterPlaceholders(operacao.sql);
                    const resultado = await client.query(sqlPostgres, operacao.parametros || []);
                    resultados.push(resultado.rows);
                }
                
                await client.query('COMMIT');
                return resultados;
            } catch (erro) {
                await client.query('ROLLBACK');
                throw erro;
            } finally {
                client.release();
            }
        } else {
            const conexao = await this.pool.getConnection();
            try {
                await conexao.beginTransaction();
                const resultados = [];
                
                for (const operacao of operacoes) {
                    const [resultado] = await conexao.query(operacao.sql, operacao.parametros || []);
                    resultados.push(resultado);
                }
                
                await conexao.commit();
                return resultados;
            } catch (erro) {
                await conexao.rollback();
                throw erro;
            } finally {
                conexao.release();
            }
        }
    }

    async fecharConexao() {
        if (this.pool) {
            if (this.tipo === 'postgresql') {
                await this.pool.end();
            } else {
                await this.pool.end();
            }
            console.log(`🔒 Conexão ${this.tipo} fechada`);
        }
    }

    // Métodos de conveniência
    getTipo() {
        return this.tipo;
    }

    isConectado() {
        return this.pool !== null;
    }

    async getInfo() {
        if (!this.pool) return { conectado: false };

        try {
            if (this.tipo === 'postgresql') {
                const result = await this.executarConsulta('SELECT version()');
                return {
                    conectado: true,
                    tipo: 'PostgreSQL',
                    versao: result[0].version
                };
            } else {
                const result = await this.executarConsulta('SELECT VERSION() as version');
                return {
                    conectado: true,
                    tipo: 'MySQL',
                    versao: result[0].version
                };
            }
        } catch (erro) {
            return {
                conectado: false,
                erro: erro.message
            };
        }
    }
}

// Singleton - uma única instância
const conexao = new ConexaoUniversal();

module.exports = conexao;
