// Script para corrigir estrutura da tabela promocoes_relampago no Railway
const conexao = require('./banco/conexao');

async function corrigirEstruturaTabela() {
    try {
        console.log('🔍 === CORREÇÃO DE ESTRUTURA DA TABELA PROMOCOES_RELAMPAGO ===\n');
        
        // 1. Verificar estrutura atual
        console.log('📋 1. VERIFICANDO ESTRUTURA ATUAL:');
        const estruturaAtual = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
        console.log('Colunas encontradas:', estruturaAtual.length);
        estruturaAtual.forEach((col, index) => {
            console.log(`${index + 1}. ${col.Field} (${col.Type}) - Null: ${col.Null} - Default: ${col.Default}`);
        });
        
        // 2. Verificar se colunas essenciais existem
        const colunasEssenciais = ['id', 'nome', 'produto_id', 'desconto_percentual', 'preco_promocional', 'data_inicio', 'data_fim', 'ativo'];
        const colunasFaltantes = [];
        
        console.log('\n🔍 2. VERIFICANDO COLUNAS ESSENCIAIS:');
        colunasEssenciais.forEach(coluna => {
            const existe = estruturaAtual.find(col => col.Field === coluna);
            if (existe) {
                console.log(`✅ ${coluna} - Existe (${existe.Type})`);
            } else {
                console.log(`❌ ${coluna} - FALTANDO!`);
                colunasFaltantes.push(coluna);
            }
        });
        
        // 3. Adicionar colunas faltantes
        if (colunasFaltantes.length > 0) {
            console.log('\n🔧 3. ADICIONANDO COLUNAS FALTANTES:');
            
            for (const coluna of colunasFaltantes) {
                try {
                    let sql = '';
                    switch (coluna) {
                        case 'nome':
                            sql = 'ALTER TABLE promocoes_relampago ADD COLUMN nome VARCHAR(255) NOT NULL';
                            break;
                        case 'ativo':
                            sql = 'ALTER TABLE promocoes_relampago ADD COLUMN ativo TINYINT(1) DEFAULT 1';
                            break;
                        case 'quantidade_limite':
                            sql = 'ALTER TABLE promocoes_relampago ADD COLUMN quantidade_limite INT DEFAULT NULL';
                            break;
                        case 'quantidade_vendida':
                            sql = 'ALTER TABLE promocoes_relampago ADD COLUMN quantidade_vendida INT DEFAULT 0';
                            break;
                        case 'criado_por':
                            sql = 'ALTER TABLE promocoes_relampago ADD COLUMN criado_por INT DEFAULT NULL';
                            break;
                        case 'data_criacao':
                            sql = 'ALTER TABLE promocoes_relampago ADD COLUMN data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
                            break;
                    }
                    
                    if (sql) {
                        console.log(`   Adicionando ${coluna}...`);
                        await conexao.executarConsulta(sql);
                        console.log(`   ✅ ${coluna} adicionada com sucesso`);
                    }
                } catch (erro) {
                    console.log(`   ❌ Erro ao adicionar ${coluna}:`, erro.message);
                }
            }
        }
        
        // 4. Verificar estrutura após correções
        console.log('\n📋 4. ESTRUTURA APÓS CORREÇÕES:');
        const estruturaFinal = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
        console.log('Total de colunas:', estruturaFinal.length);
        estruturaFinal.forEach((col, index) => {
            console.log(`${index + 1}. ${col.Field} (${col.Type}) - Null: ${col.Null} - Default: ${col.Default}`);
        });
        
        // 5. Testar query problemática
        console.log('\n🧪 5. TESTANDO QUERY PROBLEMÁTICA:');
        try {
            const teste = await conexao.executarConsulta(`
                SELECT p.id, p.nome, pr.ativo 
                FROM produtos p 
                INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id 
                WHERE pr.ativo = 1
                LIMIT 1
            `);
            console.log('✅ Query com pr.ativo funcionou! Registros:', teste.length);
        } catch (erro) {
            console.log('❌ Query ainda falha:', erro.message);
        }
        
        // 6. Inserir dados de teste se não existirem
        console.log('\n📊 6. VERIFICANDO DADOS:');
        const totalRegistros = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');
        console.log('Total de registros:', totalRegistros[0].total);
        
        if (totalRegistros[0].total === 0) {
            console.log('🔧 Inserindo dados de teste...');
            try {
                await conexao.executarConsulta(`
                    INSERT INTO promocoes_relampago 
                    (nome, produto_id, desconto_percentual, preco_promocional, data_inicio, data_fim, ativo) 
                    VALUES 
                    ('Flash Sale Nike', 1, 40, 299.99, NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 1),
                    ('Oferta Especial Adidas', 2, 35, 349.99, NOW(), DATE_ADD(NOW(), INTERVAL 25 DAY), 1)
                `);
                console.log('✅ Dados de teste inseridos com sucesso');
            } catch (erro) {
                console.log('❌ Erro ao inserir dados:', erro.message);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('🏁 CORREÇÃO DE ESTRUTURA FINALIZADA');
        console.log('='.repeat(60));
        
    } catch (erro) {
        console.error('\n❌ ERRO CRÍTICO:', erro);
        console.error('Mensagem:', erro.message);
        console.error('Código:', erro.code);
    }
    
    process.exit(0);
}

console.log('🌍 EXECUTANDO CORREÇÃO DE ESTRUTURA...');
console.log('🔌 Ambiente:', process.env.NODE_ENV || 'local');
console.log('🔌 Host:', process.env.DB_HOST || 'localhost');
console.log('='.repeat(60));

corrigirEstruturaTabela();
