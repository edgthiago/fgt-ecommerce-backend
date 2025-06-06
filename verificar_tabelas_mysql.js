#!/usr/bin/env node

const mysql = require('mysql2/promise');

// Configurações do banco MySQL Railway - URL pública
const dbConfig = {
    host: 'ballast.proxy.rlwy.net',
    port: 23061,
    user: 'root',
    password: 'FiDlAJLigMVrVtxIMtrFSuUVEmMsSwOZ',
    database: 'railway'
};

console.log('🔍 Verificando estrutura completa do banco MySQL...');

async function verificarTabelas() {
    let connection;
    
    try {
        console.log('🔗 Conectando ao MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado com sucesso!');

        // 1. Listar todas as tabelas
        console.log('\n📋 TABELAS EXISTENTES:');
        const [tabelas] = await connection.execute('SHOW TABLES');
        console.log(`Total de tabelas: ${tabelas.length}\n`);
        
        tabelas.forEach((tabela, index) => {
            console.log(`${index + 1}. ${Object.values(tabela)[0]}`);
        });

        // 2. Verificar estrutura de cada tabela
        console.log('\n🏗️ ESTRUTURA DAS TABELAS:\n');
        
        for (const tabelaObj of tabelas) {
            const nomeTabela = Object.values(tabelaObj)[0];
            console.log(`\n=== TABELA: ${nomeTabela.toUpperCase()} ===`);
            
            // Estrutura da tabela
            const [estrutura] = await connection.execute(`DESCRIBE ${nomeTabela}`);
            console.log('Colunas:');
            estrutura.forEach(coluna => {
                const pk = coluna.Key === 'PRI' ? ' [PK]' : '';
                const notnull = coluna.Null === 'NO' ? ' NOT NULL' : '';
                const def = coluna.Default ? ` DEFAULT: ${coluna.Default}` : '';
                console.log(`  - ${coluna.Field}: ${coluna.Type}${pk}${notnull}${def}`);
            });
            
            // Contar registros
            const [count] = await connection.execute(`SELECT COUNT(*) as total FROM ${nomeTabela}`);
            console.log(`Registros: ${count[0].total}`);
            
            // Mostrar alguns dados se existirem
            if (count[0].total > 0) {
                const [dados] = await connection.execute(`SELECT * FROM ${nomeTabela} LIMIT 3`);
                console.log('Primeiros registros:');
                dados.forEach((registro, i) => {
                    console.log(`  ${i + 1}. ${JSON.stringify(registro, null, 2)}`);
                });
            }
        }

        // 3. Verificar foreign keys
        console.log('\n🔗 FOREIGN KEYS:');
        const [fks] = await connection.execute(`
            SELECT 
                TABLE_NAME,
                COLUMN_NAME,
                CONSTRAINT_NAME,
                REFERENCED_TABLE_NAME,
                REFERENCED_COLUMN_NAME
            FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
            WHERE REFERENCED_TABLE_SCHEMA = 'railway'
        `);
        
        if (fks.length > 0) {
            fks.forEach(fk => {
                console.log(`  - ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
            });
        } else {
            console.log('  Nenhuma foreign key encontrada');
        }

        // 4. Verificar índices
        console.log('\n📊 ÍNDICES:');
        for (const tabelaObj of tabelas) {
            const nomeTabela = Object.values(tabelaObj)[0];
            const [indices] = await connection.execute(`SHOW INDEX FROM ${nomeTabela}`);
            
            if (indices.length > 0) {
                console.log(`\n${nomeTabela}:`);
                const indicesGrouped = {};
                indices.forEach(idx => {
                    if (!indicesGrouped[idx.Key_name]) {
                        indicesGrouped[idx.Key_name] = [];
                    }
                    indicesGrouped[idx.Key_name].push(idx.Column_name);
                });
                
                Object.entries(indicesGrouped).forEach(([nome, colunas]) => {
                    const tipo = nome === 'PRIMARY' ? 'PK' : 'IDX';
                    console.log(`  - ${tipo}: ${nome} (${colunas.join(', ')})`);
                });
            }
        }

        // 5. Verificar se faltam tabelas importantes
        console.log('\n❗ VERIFICAÇÃO DE COMPLETUDE:');
        const tabelasEsperadas = [
            'usuarios',
            'produtos', 
            'carrinho',
            'pedidos',
            'itens_pedido',
            'comentarios',
            'promocoes_relampago'
        ];
        
        const tabelasExistentes = tabelas.map(t => Object.values(t)[0]);
        const tabelasFaltantes = tabelasEsperadas.filter(t => !tabelasExistentes.includes(t));
        
        if (tabelasFaltantes.length > 0) {
            console.log('❌ Tabelas faltantes:');
            tabelasFaltantes.forEach(t => console.log(`  - ${t}`));
        } else {
            console.log('✅ Todas as tabelas esperadas estão presentes');
        }

        // 6. Verificar dados essenciais
        console.log('\n📊 DADOS ESSENCIAIS:');
        
        // Produtos
        const [produtos] = await connection.execute('SELECT COUNT(*) as total FROM produtos');
        console.log(`Produtos: ${produtos[0].total}`);
        
        if (produtos[0].total > 0) {
            const [produtosSample] = await connection.execute('SELECT nome, preco, categoria, marca FROM produtos LIMIT 5');
            produtosSample.forEach(p => {
                console.log(`  - ${p.nome} (${p.marca}) - R$ ${p.preco}`);
            });
        }
        
        // Usuários
        const [usuarios] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');
        console.log(`Usuários: ${usuarios[0].total}`);
        
        if (usuarios[0].total > 0) {
            const [usuariosSample] = await connection.execute('SELECT nome, email, admin FROM usuarios');
            usuariosSample.forEach(u => {
                const tipo = u.admin ? 'ADMIN' : 'USER';
                console.log(`  - ${u.nome} (${u.email}) [${tipo}]`);
            });
        }

        console.log('\n✅ Verificação completa finalizada!');

    } catch (error) {
        console.error('❌ Erro ao verificar tabelas:', error.message);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔒 Conexão fechada.');
        }
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    verificarTabelas()
        .then(() => {
            console.log('✅ Verificação concluída!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Falha na verificação:', error);
            process.exit(1);
        });
}

module.exports = { verificarTabelas };
