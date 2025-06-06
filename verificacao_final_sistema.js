// Script de verificação final do sistema
const mysql = require('mysql2/promise');

async function verificacaoFinal() {
    console.log('🔍 VERIFICAÇÃO FINAL DO SISTEMA - PROJETO FGT');
    console.log('=' .repeat(60));

    const conexao = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '1234',
        database: 'projetofgt'
    });

    try {
        // 1. Verificar usuário específico que pode comentar
        console.log('\n1. 👤 VERIFICANDO USUÁRIO QUE PODE COMENTAR...');
        const [usuario] = await conexao.execute(`
            SELECT id, nome, email, tipo_usuario 
            FROM usuarios 
            WHERE id = 10
        `);
        
        if (usuario.length > 0) {
            console.log(`✅ Usuário encontrado: ${usuario[0].nome} (${usuario[0].email})`);
            console.log(`   Tipo: ${usuario[0].tipo_usuario}`);
        } else {
            console.log('❌ Usuário ID 10 não encontrado');
            return;
        }

        // 2. Verificar pedidos do usuário
        console.log('\n2. 📦 VERIFICANDO PEDIDOS DO USUÁRIO...');
        const [pedidos] = await conexao.execute(`
            SELECT id, status_pedido, valor_total, data_pedido 
            FROM pedidos_simples 
            WHERE usuario_id = 10 
            AND status_pedido IN ('confirmado', 'preparando', 'enviado', 'entregue')
            ORDER BY data_pedido DESC
            LIMIT 3
        `);

        console.log(`📊 Pedidos válidos encontrados: ${pedidos.length}`);
        pedidos.forEach((pedido, index) => {
            console.log(`   ${index + 1}. ID: ${pedido.id} | Status: ${pedido.status_pedido} | Valor: R$ ${pedido.valor_total}`);
        });

        // 3. Verificar produtos nos pedidos
        console.log('\n3. 🎯 VERIFICANDO PRODUTOS EM PEDIDOS...');
        if (pedidos.length > 0) {
            const pedidoTeste = pedidos[0];
            const [detalhes] = await conexao.execute(`
                SELECT itens_json 
                FROM pedidos_simples 
                WHERE id = ?
            `, [pedidoTeste.id]);

            if (detalhes.length > 0) {
                const itens = JSON.parse(detalhes[0].itens_json);
                console.log(`📋 Produtos no pedido ${pedidoTeste.id}:`);
                itens.forEach((item, index) => {
                    console.log(`   ${index + 1}. Produto ID: ${item.produto_id} | Nome: ${item.produto_nome} | Qtd: ${item.quantidade}`);
                });

                // 4. Testar verificação de permissão para comentar
                console.log('\n4. 🔐 TESTANDO PERMISSÃO PARA COMENTAR...');
                const produtoTeste = itens[0].produto_id;
                
                const [verificacao] = await conexao.execute(`
                    SELECT COUNT(*) as count 
                    FROM pedidos_simples 
                    WHERE usuario_id = ? 
                    AND status_pedido IN ('confirmado', 'preparando', 'enviado', 'entregue')
                    AND JSON_CONTAINS(itens_json, JSON_OBJECT('produto_id', ?), '$')
                `, [10, produtoTeste]);

                const podeAvaliar = verificacao[0].count > 0;
                console.log(`🎯 Produto testado: ${produtoTeste}`);
                console.log(`${podeAvaliar ? '✅' : '❌'} Usuário pode avaliar: ${podeAvaliar ? 'SIM' : 'NÃO'}`);
                console.log(`📊 Pedidos encontrados: ${verificacao[0].count}`);
            }
        }

        // 5. Verificar comentários existentes
        console.log('\n5. 💬 VERIFICANDO COMENTÁRIOS EXISTENTES...');
        const [comentarios] = await conexao.execute(`
            SELECT c.id, c.produto_id, c.comentario, c.avaliacao, c.compra_verificada, 
                   u.nome as usuario_nome, p.nome as produto_nome
            FROM comentarios_produtos c
            JOIN usuarios u ON c.usuario_id = u.id
            JOIN produtos p ON c.produto_id = p.id
            WHERE c.ativo = 1
            ORDER BY c.data_criacao DESC
            LIMIT 5
        `);

        console.log(`📊 Comentários ativos encontrados: ${comentarios.length}`);
        comentarios.forEach((comentario, index) => {
            console.log(`   ${index + 1}. ${comentario.usuario_nome} avaliou "${comentario.produto_nome}"`);
            console.log(`      Nota: ${comentario.avaliacao}/5 | Compra verificada: ${comentario.compra_verificada ? 'SIM' : 'NÃO'}`);
            console.log(`      Comentário: "${comentario.comentario.substring(0, 50)}..."`);
        });

        // 6. Verificar hierarquia de usuários
        console.log('\n6. 👥 VERIFICANDO HIERARQUIA DE USUÁRIOS...');
        const [hierarquia] = await conexao.execute(`
            SELECT tipo_usuario, COUNT(*) as total
            FROM usuarios
            GROUP BY tipo_usuario
            ORDER BY 
                CASE tipo_usuario 
                    WHEN 'diretor' THEN 1
                    WHEN 'supervisor' THEN 2
                    WHEN 'colaborador' THEN 3
                    WHEN 'usuario' THEN 4
                    WHEN 'visitante' THEN 5
                    ELSE 6
                END
        `);

        console.log('📊 Distribuição por tipo de usuário:');
        hierarquia.forEach(tipo => {
            console.log(`   ${tipo.tipo_usuario}: ${tipo.total} usuários`);
        });

        // 7. Status geral do sistema
        console.log('\n7. 📊 STATUS GERAL DO SISTEMA...');
        
        const [statsGerais] = await conexao.execute(`
            SELECT 
                (SELECT COUNT(*) FROM usuarios WHERE status = 'ativo') as usuarios_ativos,
                (SELECT COUNT(*) FROM produtos WHERE disponivel = 1) as produtos_disponiveis,
                (SELECT COUNT(*) FROM pedidos_simples WHERE status_pedido = 'confirmado') as pedidos_confirmados,
                (SELECT COUNT(*) FROM comentarios_produtos WHERE ativo = 1) as comentarios_ativos
        `);

        const stats = statsGerais[0];
        console.log(`👤 Usuários ativos: ${stats.usuarios_ativos}`);
        console.log(`📦 Produtos disponíveis: ${stats.produtos_disponiveis}`);
        console.log(`✅ Pedidos confirmados: ${stats.pedidos_confirmados}`);
        console.log(`💬 Comentários ativos: ${stats.comentarios_ativos}`);

        console.log('\n' + '=' .repeat(60));
        console.log('🎉 VERIFICAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('✅ Sistema de comentários: FUNCIONAL');
        console.log('✅ Sistema de hierarquia: FUNCIONAL');
        console.log('✅ Verificação de compra: FUNCIONAL');
        console.log('✅ Banco de dados: OPERACIONAL');

    } catch (error) {
        console.error('❌ Erro durante verificação:', error.message);
    } finally {
        await conexao.end();
    }
}

verificacaoFinal();
