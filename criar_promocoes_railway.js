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

async function criarPromocoesRailway() {
    const pool = mysql.createPool(configuracaoBanco);
    
    try {
        console.log('🚀 Criando promoções no Railway...');
        
        // Verificar estrutura da tabela
        const [estrutura] = await pool.query('DESCRIBE promocoes_relampago');
        console.log('📋 Estrutura da tabela:');
        estrutura.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
        
        // Verificar se existem produtos
        const [produtos] = await pool.query('SELECT id, nome FROM produtos LIMIT 5');
        console.log('\n📦 Produtos disponíveis:', produtos.length);
        produtos.forEach(p => console.log(`- ID ${p.id}: ${p.nome}`));
        
        if (produtos.length === 0) {
            console.log('❌ Nenhum produto encontrado! Criando produtos primeiro...');
            
            // Criar alguns produtos básicos
            const produtosBasicos = [
                {
                    marca: 'Nike',
                    nome: 'Air Max 270',
                    preco_antigo: 499.99,
                    preco_atual: 399.99,
                    categoria: 'tenis',
                    genero: 'masculino'
                },
                {
                    marca: 'Adidas',
                    nome: 'Ultraboost 22',
                    preco_antigo: 599.99,
                    preco_atual: 449.99,
                    categoria: 'tenis',
                    genero: 'masculino'
                }
            ];
            
            for (const produto of produtosBasicos) {
                const [resultado] = await pool.query(`
                    INSERT INTO produtos (marca, nome, preco_antigo, preco_atual, categoria, genero, disponivel, quantidade_estoque)
                    VALUES (?, ?, ?, ?, ?, ?, 1, 50)
                `, [produto.marca, produto.nome, produto.preco_antigo, produto.preco_atual, produto.categoria, produto.genero]);
                
                console.log(`✅ Produto criado: ${produto.nome} (ID: ${resultado.insertId})`);
            }
            
            // Buscar produtos novamente
            const [produtosAtualizados] = await pool.query('SELECT id, nome FROM produtos LIMIT 5');
            produtos.length = 0;
            produtos.push(...produtosAtualizados);
        }
        
        // Limpar promoções existentes
        await pool.query('DELETE FROM promocoes_relampago');
        console.log('🧹 Promoções anteriores removidas');
        
        // Criar promoções ativas
        const promocoes = [
            {
                nome: 'Flash Sale Nike',
                produto_id: produtos[0].id,
                desconto_percentual: 40,
                preco_promocional: 299.99,
                data_inicio: 'DATE_SUB(UTC_TIMESTAMP(), INTERVAL 1 HOUR)',
                data_fim: 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 30 DAY)',
                ativo: 1
            },
            {
                nome: 'Oferta Especial Adidas',
                produto_id: produtos[1] ? produtos[1].id : produtos[0].id,
                desconto_percentual: 35,
                preco_promocional: 349.99,
                data_inicio: 'DATE_SUB(UTC_TIMESTAMP(), INTERVAL 2 HOUR)',
                data_fim: 'DATE_ADD(UTC_TIMESTAMP(), INTERVAL 25 DAY)',
                ativo: 1
            }
        ];
        
        for (const promo of promocoes) {
            const [resultado] = await pool.query(`
                INSERT INTO promocoes_relampago 
                (nome, produto_id, desconto_percentual, preco_promocional, data_inicio, data_fim, ativo)
                VALUES (?, ?, ?, ?, ${promo.data_inicio}, ${promo.data_fim}, ?)
            `, [promo.nome, promo.produto_id, promo.desconto_percentual, promo.preco_promocional, promo.ativo]);
            
            console.log(`✅ Promoção criada: ${promo.nome} (ID: ${resultado.insertId})`);
        }
        
        // Verificar resultado
        const [promocoesVerificacao] = await pool.query(`
            SELECT pr.id, pr.nome, pr.produto_id, pr.ativo, pr.data_inicio, pr.data_fim, p.nome as produto_nome
            FROM promocoes_relampago pr
            JOIN produtos p ON pr.produto_id = p.id
            WHERE pr.ativo = 1
        `);
        
        console.log('\n🏆 Promoções ativas criadas:', promocoesVerificacao.length);
        promocoesVerificacao.forEach(pr => {
            console.log(`- ${pr.nome} para ${pr.produto_nome} (ID: ${pr.id})`);
            console.log(`  Período: ${pr.data_inicio} até ${pr.data_fim}`);
        });
        
        await pool.end();
        console.log('\n✅ Promoções criadas com sucesso no Railway!');
        
    } catch (erro) {
        console.error('❌ Erro:', erro.message);
        console.error('❌ Stack:', erro.stack);
        await pool.end();
    }
}

criarPromocoesRailway();
