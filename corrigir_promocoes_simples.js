require('dotenv').config();
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
    timezone: '-03:00'
};

async function corrigirPromocoesAtivas() {
    const pool = mysql.createPool(configuracaoBanco);
    
    try {
        console.log('🔍 Conectando ao banco...');
        
        // Testar conexão
        const conexao = await pool.getConnection();
        console.log('✅ Conectado!');
        conexao.release();
        
        // Verificar timestamp atual
        const [timestamp] = await pool.query('SELECT UTC_TIMESTAMP() as agora');
        console.log('⏰ Timestamp atual:', timestamp[0].agora);
        
        // Verificar estado atual das promoções
        const [promocoes] = await pool.query(`
            SELECT id, nome, produto_id, ativo, data_inicio, data_fim
            FROM promocoes_relampago 
            ORDER BY id
        `);
        
        console.log('📊 Promoções atuais:');
        promocoes.forEach(p => {
            console.log(`- ID ${p.id}: ${p.nome} (Produto ${p.produto_id}) - Ativo: ${p.ativo}`);
            console.log(`  Início: ${p.data_inicio} | Fim: ${p.data_fim}`);
        });
        
        // Ativar promoções para produtos 1 e 2 com datas válidas
        console.log('\n🔧 Ativando promoções para produtos 1 e 2...');
        
        const [resultado1] = await pool.query(`
            UPDATE promocoes_relampago 
            SET ativo = 1,
                data_inicio = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR),
                data_fim = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 24 HOUR)
            WHERE produto_id = 1
        `);
        
        const [resultado2] = await pool.query(`
            UPDATE promocoes_relampago 
            SET ativo = 1,
                data_inicio = DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR),
                data_fim = DATE_ADD(UTC_TIMESTAMP(), INTERVAL 24 HOUR)
            WHERE produto_id = 2
        `);
        
        console.log('✅ Atualizações realizadas:', {
            produto1: resultado1.affectedRows,
            produto2: resultado2.affectedRows
        });
        
        // Verificar produtos em destaque
        const [destaques] = await pool.query(`
            SELECT p.id, p.nome, p.preco_atual, pr.ativo, pr.data_inicio, pr.data_fim
            FROM produtos p
            INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
            WHERE pr.ativo = 1 
            AND pr.data_inicio <= UTC_TIMESTAMP() 
            AND pr.data_fim >= UTC_TIMESTAMP()
            ORDER BY p.id ASC
        `);
        
        console.log('\n🏆 Produtos em destaque encontrados:', destaques.length);
        destaques.forEach(d => {
            console.log(`- ${d.nome} (ID: ${d.id}) - R$ ${d.preco_atual}`);
        });
        
        await pool.end();
        console.log('\n✅ Correção concluída!');
        
    } catch (erro) {
        console.error('❌ Erro:', erro.message);
        await pool.end();
    }
}

corrigirPromocoesAtivas();
