require('dotenv').config();
const conexao = require('./banco/conexao');

async function verificarEstruturaPromocoes() {
    try {
        console.log('🔍 Verificando estrutura da tabela promocoes_relampago...');
        
        // Descrever estrutura da tabela
        const estrutura = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
        console.log('📋 Estrutura da tabela promocoes_relampago:');
        console.table(estrutura);
        
        // Verificar se existem dados
        const dados = await conexao.executarConsulta('SELECT * FROM promocoes_relampago LIMIT 5');
        console.log('📊 Primeiros 5 registros:');
        console.table(dados);
        
        // Contar total de registros
        const total = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');
        console.log('📈 Total de registros:', total[0].total);
        
    } catch (erro) {
        console.error('❌ Erro ao verificar estrutura:', erro);
        
        // Tentar listar todas as tabelas
        try {
            console.log('🔍 Listando todas as tabelas disponíveis...');
            const tabelas = await conexao.executarConsulta('SHOW TABLES');
            console.log('📋 Tabelas disponíveis:');
            console.table(tabelas);
        } catch (erro2) {
            console.error('❌ Erro ao listar tabelas:', erro2);
        }
    }
    
    process.exit(0);
}

verificarEstruturaPromocoes();
