// Script para comparar estrutura da tabela promocoes_relampago entre local e Railway
const conexao = require('./banco/conexao');

async function compararEstruturas() {
    try {
        console.log('🔍 === COMPARAÇÃO DE ESTRUTURAS - LOCAL vs RAILWAY ===\n');
        
        // 1. Verificar estrutura da tabela
        console.log('📋 1. ESTRUTURA DA TABELA promocoes_relampago:');
        const estrutura = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
        
        console.log('┌─────────────────────────────────────────────────────────┐');
        console.log('│                    COLUNAS DISPONÍVEIS                  │');
        console.log('├─────────────────────────────────────────────────────────┤');
        estrutura.forEach((coluna, index) => {
            console.log(`│ ${(index + 1).toString().padStart(2, '0')}. ${coluna.Field.padEnd(20)} │ ${coluna.Type.padEnd(15)} │ ${coluna.Null.padEnd(4)} │`);
        });
        console.log('└─────────────────────────────────────────────────────────┘\n');
        
        // 2. Verificar se coluna 'ativo' existe especificamente
        const colunaAtivo = estrutura.find(col => col.Field === 'ativo');
        if (colunaAtivo) {
            console.log('✅ COLUNA "ativo" ENCONTRADA:');
            console.log(`   - Tipo: ${colunaAtivo.Type}`);
            console.log(`   - Null: ${colunaAtivo.Null}`);
            console.log(`   - Default: ${colunaAtivo.Default}`);
            console.log(`   - Key: ${colunaAtivo.Key}`);
        } else {
            console.log('❌ COLUNA "ativo" NÃO ENCONTRADA!');
        }
        
        // 3. Testar queries específicas com a coluna ativo
        console.log('\n🧪 2. TESTANDO QUERIES COM COLUNA "ativo":');
        
        try {
            console.log('   Teste 2.1: SELECT ativo FROM promocoes_relampago LIMIT 1');
            const teste1 = await conexao.executarConsulta('SELECT ativo FROM promocoes_relampago LIMIT 1');
            console.log('   ✅ Sucesso - Resultado:', teste1);
        } catch (erro1) {
            console.log('   ❌ Falhou:', erro1.message);
        }
        
        try {
            console.log('   Teste 2.2: SELECT * FROM promocoes_relampago WHERE ativo = 1 LIMIT 1');
            const teste2 = await conexao.executarConsulta('SELECT * FROM promocoes_relampago WHERE ativo = 1 LIMIT 1');
            console.log('   ✅ Sucesso - Registros encontrados:', teste2.length);
        } catch (erro2) {
            console.log('   ❌ Falhou:', erro2.message);
        }
        
        try {
            console.log('   Teste 2.3: SELECT pr.ativo FROM promocoes_relampago pr LIMIT 1');
            const teste3 = await conexao.executarConsulta('SELECT pr.ativo FROM promocoes_relampago pr LIMIT 1');
            console.log('   ✅ Sucesso - Com alias:', teste3);
        } catch (erro3) {
            console.log('   ❌ Falhou com alias:', erro3.message);
        }
        
        // 4. Testar JOIN com a tabela produtos
        console.log('\n🔗 3. TESTANDO JOIN COM TABELA produtos:');
        
        try {
            console.log('   Teste 3.1: JOIN simples sem WHERE');
            const join1 = await conexao.executarConsulta(`
                SELECT p.id, p.nome, pr.ativo 
                FROM produtos p 
                INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id 
                LIMIT 2
            `);
            console.log('   ✅ Sucesso - JOIN básico:', join1.length, 'registros');
        } catch (erro4) {
            console.log('   ❌ Falhou JOIN básico:', erro4.message);
        }
        
        try {
            console.log('   Teste 3.2: JOIN com WHERE pr.ativo = 1');
            const join2 = await conexao.executarConsulta(`
                SELECT p.id, p.nome, pr.ativo 
                FROM produtos p 
                INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id 
                WHERE pr.ativo = 1
                LIMIT 2
            `);
            console.log('   ✅ Sucesso - JOIN com WHERE:', join2.length, 'registros');
        } catch (erro5) {
            console.log('   ❌ Falhou JOIN com WHERE:', erro5.message);
        }
        
        // 5. Informações do banco de dados
        console.log('\n📊 4. INFORMAÇÕES DO BANCO:');
        
        try {
            const versao = await conexao.executarConsulta('SELECT VERSION() as versao');
            console.log('   Versão MySQL:', versao[0].versao);
        } catch (erro) {
            console.log('   ❌ Erro ao obter versão:', erro.message);
        }
        
        try {
            const sqlMode = await conexao.executarConsulta('SELECT @@sql_mode as sql_mode');
            console.log('   SQL Mode:', sqlMode[0].sql_mode);
        } catch (erro) {
            console.log('   ❌ Erro ao obter SQL mode:', erro.message);
        }
        
        // 6. Contagem de registros
        console.log('\n📈 5. ESTATÍSTICAS:');
        const totalProducoes = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');
        const promocoesAtivas = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago WHERE ativo = 1');
        
        console.log(`   Total de promoções: ${totalProducoes[0].total}`);
        console.log(`   Promoções ativas: ${promocoesAtivas[0].total}`);
        
        console.log('\n' + '='.repeat(60));
        console.log('🏁 DIAGNÓSTICO COMPLETO FINALIZADO');
        console.log('='.repeat(60));
        
    } catch (erro) {
        console.error('\n❌ ERRO CRÍTICO NO DIAGNÓSTICO:', erro);
        console.error('   Mensagem:', erro.message);
        console.error('   Código:', erro.code);
        console.error('   SQL State:', erro.sqlState);
    }
    
    process.exit(0);
}

// Determinar ambiente
const ambiente = process.env.NODE_ENV || 'local';
const dbHost = process.env.DB_HOST || 'localhost';

console.log(`🌍 EXECUTANDO DIAGNÓSTICO NO AMBIENTE: ${ambiente.toUpperCase()}`);
console.log(`🔌 HOST DO BANCO: ${dbHost}`);
console.log('='.repeat(60));

compararEstruturas();
