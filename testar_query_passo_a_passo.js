require('dotenv').config();
const conexao = require('./banco/conexao');

async function testarQueryDestaques() {
    try {
        console.log('🔍 Testando queries passo a passo...');
        
        // Teste 1: Verificar se a tabela tem a coluna ativo
        console.log('\n📋 Passo 1: Verificar estrutura da tabela');
        const estrutura = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
        console.log('Colunas encontradas:', estrutura.map(col => col.Field));
        
        // Teste 2: Query simples sem alias
        console.log('\n🧪 Passo 2: Query sem alias');
        const semAlias = await conexao.executarConsulta('SELECT ativo FROM promocoes_relampago LIMIT 1');
        console.log('Query sem alias funcionou:', semAlias.length > 0 ? 'SIM' : 'SEM DADOS');
        
        // Teste 3: Query com alias simples
        console.log('\n🧪 Passo 3: Query com alias pr');
        const comAlias = await conexao.executarConsulta('SELECT pr.ativo FROM promocoes_relampago pr LIMIT 1');
        console.log('Query com alias funcionou:', comAlias.length > 0 ? 'SIM' : 'SEM DADOS');
        
        // Teste 4: WHERE com coluna ativo sem alias
        console.log('\n🧪 Passo 4: WHERE sem alias');
        const whereSemAlias = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago WHERE ativo = 1');
        console.log('WHERE sem alias:', whereSemAlias[0].total, 'registros ativos');
        
        // Teste 5: WHERE com alias
        console.log('\n🧪 Passo 5: WHERE com alias');
        const whereComAlias = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago pr WHERE pr.ativo = 1');
        console.log('WHERE com alias:', whereComAlias[0].total, 'registros ativos');
        
        // Teste 6: JOIN simples
        console.log('\n🧪 Passo 6: JOIN sem WHERE complexo');
        const joinSimples = await conexao.executarConsulta(`
            SELECT p.id, p.nome, pr.ativo 
            FROM produtos p 
            INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id 
            LIMIT 3
        `);
        console.log('JOIN simples funcionou:', joinSimples.length, 'resultados');
        
        // Teste 7: Query completa do modelo (versão simplificada)
        console.log('\n🧪 Passo 7: Query do modelo simplificada');
        const queryModelo = await conexao.executarConsulta(`
            SELECT p.* 
            FROM produtos p
            INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
            WHERE pr.ativo = 1
            LIMIT 5
        `);
        console.log('Query do modelo funcionou:', queryModelo.length, 'produtos');
        
    } catch (erro) {
        console.error('❌ Erro no teste:', erro);
        console.error('Código:', erro.code);
        console.error('SQL State:', erro.sqlState);
        console.error('Mensagem SQL:', erro.sqlMessage);
    }
    
    process.exit(0);
}

testarQueryDestaques();
