// Configuração de conexão com MySQL
// Arquivo: conexao.js

const mysql = require('mysql2/promise');

const configuracaoBanco = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '1234',
    database: process.env.DB_NAME || 'projetofgt',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4',
    timezone: '-03:00' // Horário de Brasília
};

class ConexaoBanco {
    constructor() {
        this.pool = mysql.createPool(configuracaoBanco);
        this.testarConexao();
    }

    async testarConexao() {
        try {
            const conexao = await this.pool.getConnection();
            console.log('✅ Conectado ao MySQL - Loja de Tênis!');
            conexao.release();
        } catch (erro) {
            console.error('❌ Erro ao conectar ao MySQL:', erro.message);
            process.exit(1);
        }
    }    async executarConsulta(sql, parametros = []) {
        console.log('🔍 [DB] Executando consulta:', sql);
        console.log('🔍 [DB] Parâmetros:', parametros);
        console.log('🔍 [DB] Pool status - used:', this.pool._used, 'free:', this.pool._free);
        
        try {
            const startTime = Date.now();
            // Usando query() ao invés de execute() para resolver problema com prepared statements
            const [resultados] = await this.pool.query(sql, parametros);
            const endTime = Date.now();
            
            console.log('✅ [DB] Consulta executada com sucesso em', endTime - startTime, 'ms');
            console.log('✅ [DB] Número de resultados:', Array.isArray(resultados) ? resultados.length : 'não é array');
            console.log('✅ [DB] Tipo de resultado:', typeof resultados);
            
            return resultados;
        } catch (erro) {
            console.error('❌ [DB] Erro detalhado na consulta MySQL:');
            console.error('❌ [DB] Mensagem:', erro.message);
            console.error('❌ [DB] Código:', erro.code);
            console.error('❌ [DB] Estado SQL:', erro.sqlState);
            console.error('❌ [DB] Errno:', erro.errno);
            console.error('❌ [DB] SQL:', sql);
            console.error('❌ [DB] Parâmetros:', parametros);
            console.error('❌ [DB] Stack:', erro.stack);
            throw erro;
        }
    }

    async executarTransaction(operacoes) {
        const conexao = await this.pool.getConnection();
        
        try {
            await conexao.beginTransaction();
            
            const resultados = [];
            for (const operacao of operacoes) {
                const [resultado] = await conexao.execute(operacao.sql, operacao.parametros || []);
                resultados.push(resultado);
            }
            
            await conexao.commit();
            return resultados;
            
        } catch (erro) {
            await conexao.rollback();
            console.error('❌ Erro na transação:', erro.message);
            throw erro;
        } finally {
            conexao.release();
        }
    }

    async obterEstatisticas() {
        try {            const consultas = {
                totalProdutos: 'SELECT COUNT(*) as total FROM produtos WHERE disponivel = 1',
                totalUsuarios: 'SELECT COUNT(*) as total FROM usuarios WHERE tipo_usuario = "usuario"',
                totalPedidos: 'SELECT COUNT(*) as total FROM pedidos WHERE DATE(data_pedido) = CURDATE()',
                promocoesAtivas: 'SELECT COUNT(*) as total FROM promocoes_relampago WHERE ativo = 1 AND data_fim >= NOW()'
            };

            const resultados = {};
            for (const [chave, sql] of Object.entries(consultas)) {
                const resultado = await this.executarConsulta(sql);
                resultados[chave] = resultado[0].total;
            }

            return resultados;
        } catch (erro) {
            console.error('❌ Erro ao obter estatísticas:', erro);
            throw erro;
        }
    }

    async fecharConexao() {
        try {
            await this.pool.end();
            console.log('🔒 Conexão com MySQL fechada');
        } catch (erro) {
            console.error('❌ Erro ao fechar conexão:', erro);
        }
    }
}

// Instância única da conexão
const bancoDados = new ConexaoBanco();

// Fechar conexão quando a aplicação for encerrada
process.on('SIGINT', async () => {
    console.log('\n🛑 Encerrando aplicação...');
    await bancoDados.fecharConexao();
    process.exit(0);
});

module.exports = bancoDados;
