require('dotenv').config();
const conexao = require('./banco/conexao');

async function analisarPromocoes() {
    try {
        console.log('🔍 Analisando promoções...');
        
        // Verificar datas atuais
        const agora = await conexao.executarConsulta('SELECT UTC_TIMESTAMP() as agora, NOW() as now_local');
        console.log('⏰ Timestamps:', agora[0]);
        
        // Verificar todas as promoções com suas condições
        const promocoes = await conexao.executarConsulta(`
            SELECT 
                id, nome, produto_id, ativo,
                data_inicio, data_fim,
                UTC_TIMESTAMP() as agora,
                CASE 
                    WHEN ativo = 1 THEN 'Ativo'
                    ELSE 'Inativo'
                END as status_ativo,
                CASE 
                    WHEN data_inicio <= UTC_TIMESTAMP() AND data_fim >= UTC_TIMESTAMP() THEN 'No período'
                    WHEN data_inicio > UTC_TIMESTAMP() THEN 'Ainda não começou'
                    WHEN data_fim < UTC_TIMESTAMP() THEN 'Já terminou'
                    ELSE 'Indeterminado'
                END as status_periodo
            FROM promocoes_relampago
            ORDER BY id
        `);
        
        console.log('📊 Status das promoções:');
        console.table(promocoes);
        
        // Verificar produtos que deveriam estar em destaque
        console.log('\n🔍 Testando query completa de destaques...');
        const destaques = await conexao.executarConsulta(`
            SELECT p.id, p.nome, p.preco_atual, pr.ativo, pr.data_inicio, pr.data_fim
            FROM produtos p
            INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
            WHERE pr.ativo = 1 
            AND pr.data_inicio <= UTC_TIMESTAMP() 
            AND pr.data_fim >= UTC_TIMESTAMP()
            AND p.disponivel = 1
            AND p.quantidade_estoque > 0
            ORDER BY p.id ASC
        `);
        
        console.log('🏆 Produtos em destaque encontrados:', destaques.length);
        if (destaques.length > 0) {
            console.table(destaques);
        }
        
        // Ativar algumas promoções para teste
        console.log('\n🔧 Ativando promoções para produtos 1 e 2...');
        await conexao.executarConsulta(`
            UPDATE promocoes_relampago 
            SET ativo = 1,
                data_inicio = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR),
                data_fim = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 24 HOUR)
            WHERE produto_id IN (1, 2)
        `);
        
        // Verificar novamente
        const destaquesAtualizados = await conexao.executarConsulta(`
            SELECT p.id, p.nome, p.preco_atual, pr.ativo, pr.data_inicio, pr.data_fim
            FROM produtos p
            INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
            WHERE pr.ativo = 1 
            AND pr.data_inicio <= UTC_TIMESTAMP() 
            AND pr.data_fim >= UTC_TIMESTAMP()
            AND p.disponivel = 1
            AND p.quantidade_estoque > 0
            ORDER BY p.id ASC
        `);
        
        console.log('\n✅ Produtos em destaque após ativação:', destaquesAtualizados.length);
        if (destaquesAtualizados.length > 0) {
            console.table(destaquesAtualizados);
        }
        
    } catch (erro) {
        console.error('❌ Erro:', erro);
    }
    
    process.exit(0);
}

analisarPromocoes();
