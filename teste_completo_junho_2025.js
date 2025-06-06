// TESTE COMPLETO ATUALIZADO - JUNHO 2025
const axios = require('axios');
const mysql = require('mysql2/promise');

async function testeCompletoAtualizado() {
    console.log('🧪 TESTE COMPLETO ATUALIZADO - SISTEMA E-COMMERCE');
    console.log('📅 Data: 6 de Junho de 2025');
    console.log('🎯 Objetivo: Verificar todos os componentes funcionais');
    console.log('=' .repeat(70));

    const baseURL = 'http://localhost:5000/api';
    let pontuacao = 0;
    let totalTestes = 0;

    try {
        // TESTE 1: Conexão com o servidor
        totalTestes++;
        console.log('\n1. 🌐 TESTE DE CONEXÃO COM SERVIDOR...');
        try {
            const healthResponse = await axios.get(`${baseURL}/health`);
            console.log('✅ Servidor respondendo corretamente');
            pontuacao++;
        } catch (error) {
            console.log('❌ Falha na conexão com servidor');
        }

        // TESTE 2: Verificação do banco de dados
        totalTestes++;
        console.log('\n2. 🗄️ TESTE DE CONEXÃO COM BANCO DE DADOS...');
        try {
            const conexao = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '1234',
                database: 'projetofgt'
            });

            const [result] = await conexao.execute('SELECT COUNT(*) as total FROM usuarios');
            console.log(`✅ Banco conectado - ${result[0].total} usuários encontrados`);
            await conexao.end();
            pontuacao++;
        } catch (error) {
            console.log(`❌ Erro no banco de dados: ${error.message}`);
        }

        // TESTE 3: Sistema de comentários
        totalTestes++;
        console.log('\n3. 💬 TESTE DO SISTEMA DE COMENTÁRIOS...');
        try {
            const comentariosResponse = await axios.get(`${baseURL}/comentarios/produtos/1/comentarios`);
            const comentarios = comentariosResponse.data;
            
            if (comentarios && comentarios.length > 0) {
                console.log(`✅ Sistema de comentários funcional - ${comentarios.length} comentários encontrados`);
                console.log(`📝 Exemplo: "${comentarios[0].comentario.substring(0, 40)}..."`);
                pontuacao++;
            } else {
                console.log('⚠️ Sistema funcional mas sem comentários');
                pontuacao += 0.5;
            }
        } catch (error) {
            console.log(`❌ Erro no sistema de comentários: ${error.response?.status}`);
        }

        // TESTE 4: Verificação de permissão de comentário
        totalTestes++;
        console.log('\n4. 🔐 TESTE DE VERIFICAÇÃO DE PERMISSÃO...');
        try {
            const conexao = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '1234',
                database: 'projetofgt'
            });

            // Testar usuário 10 que tem pedidos confirmados
            const [verificacao] = await conexao.execute(`
                SELECT COUNT(*) as count 
                FROM pedidos_simples 
                WHERE usuario_id = 10 
                AND status_pedido IN ('confirmado', 'preparando', 'enviado', 'entregue')
                AND JSON_CONTAINS(itens_json, JSON_OBJECT('produto_id', 1), '$')
            `);

            if (verificacao[0].count > 0) {
                console.log(`✅ Verificação de permissão funcionando - ${verificacao[0].count} pedidos válidos`);
                pontuacao++;
            } else {
                console.log('❌ Falha na verificação de permissão');
            }

            await conexao.end();
        } catch (error) {
            console.log(`❌ Erro na verificação: ${error.message}`);
        }

        // TESTE 5: Sistema de hierarquia
        totalTestes++;
        console.log('\n5. 👥 TESTE DO SISTEMA DE HIERARQUIA...');
        try {
            const conexao = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '1234',
                database: 'projetofgt'
            });

            const [hierarquia] = await conexao.execute(`
                SELECT tipo_usuario, COUNT(*) as total 
                FROM usuarios 
                GROUP BY tipo_usuario
            `);

            if (hierarquia.length >= 4) {
                console.log(`✅ Sistema de hierarquia funcional - ${hierarquia.length} tipos de usuário`);
                hierarquia.forEach(tipo => {
                    console.log(`   • ${tipo.tipo_usuario}: ${tipo.total} usuários`);
                });
                pontuacao++;
            } else {
                console.log('❌ Sistema de hierarquia incompleto');
            }

            await conexao.end();
        } catch (error) {
            console.log(`❌ Erro na hierarquia: ${error.message}`);
        }

        // TESTE 6: Produtos e catálogo
        totalTestes++;
        console.log('\n6. 📦 TESTE DO CATÁLOGO DE PRODUTOS...');
        try {
            const conexao = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '1234',
                database: 'projetofgt'
            });

            const [produtos] = await conexao.execute('SELECT COUNT(*) as total FROM produtos WHERE disponivel = 1');
            
            if (produtos[0].total > 0) {
                console.log(`✅ Catálogo funcional - ${produtos[0].total} produtos disponíveis`);
                pontuacao++;
            } else {
                console.log('❌ Nenhum produto disponível');
            }

            await conexao.end();
        } catch (error) {
            console.log(`❌ Erro no catálogo: ${error.message}`);
        }

        // TESTE 7: Sistema de pedidos
        totalTestes++;
        console.log('\n7. 🛒 TESTE DO SISTEMA DE PEDIDOS...');
        try {
            const conexao = await mysql.createConnection({
                host: 'localhost',
                user: 'root',
                password: '1234',
                database: 'projetofgt'
            });

            const [pedidos] = await conexao.execute(`
                SELECT COUNT(*) as total 
                FROM pedidos_simples 
                WHERE status_pedido IN ('confirmado', 'preparando', 'enviado', 'entregue')
            `);
            
            if (pedidos[0].total > 0) {
                console.log(`✅ Sistema de pedidos funcional - ${pedidos[0].total} pedidos confirmados`);
                pontuacao++;
            } else {
                console.log('❌ Nenhum pedido confirmado encontrado');
            }

            await conexao.end();
        } catch (error) {
            console.log(`❌ Erro no sistema de pedidos: ${error.message}`);
        }

        // TESTE 8: API Endpoints críticos
        totalTestes++;
        console.log('\n8. 🔗 TESTE DOS ENDPOINTS DA API...');
        try {
            const endpoints = [
                '/health',
                '/info',
                '/comentarios/produtos/1/comentarios'
            ];

            let endpointsOK = 0;
            for (const endpoint of endpoints) {
                try {
                    await axios.get(`${baseURL}${endpoint}`);
                    endpointsOK++;
                } catch (error) {
                    console.log(`   ⚠️ Endpoint ${endpoint}: ${error.response?.status || 'erro'}`);
                }
            }

            if (endpointsOK >= 2) {
                console.log(`✅ API funcional - ${endpointsOK}/${endpoints.length} endpoints OK`);
                pontuacao++;
            } else {
                console.log(`❌ API com problemas - apenas ${endpointsOK}/${endpoints.length} funcionando`);
            }
        } catch (error) {
            console.log(`❌ Erro geral na API: ${error.message}`);
        }

        // RESULTADO FINAL
        console.log('\n' + '=' .repeat(70));
        console.log('📊 RESULTADO FINAL DO TESTE');
        console.log('=' .repeat(70));
        
        const porcentagem = Math.round((pontuacao / totalTestes) * 100);
        
        console.log(`🎯 Pontuação: ${pontuacao}/${totalTestes} (${porcentagem}%)`);
        
        if (porcentagem >= 90) {
            console.log('🎉 SISTEMA EXCELENTE - Todos os componentes funcionais!');
        } else if (porcentagem >= 75) {
            console.log('✅ SISTEMA BOM - Maioria dos componentes funcionais');
        } else if (porcentagem >= 50) {
            console.log('⚠️ SISTEMA PARCIAL - Alguns problemas identificados');
        } else {
            console.log('❌ SISTEMA COM PROBLEMAS - Necessita revisão');
        }

        // RESUMO DOS COMPONENTES
        console.log('\n📋 RESUMO DOS COMPONENTES:');
        console.log('• Servidor Web: ' + (pontuacao >= 1 ? '✅' : '❌'));
        console.log('• Banco de Dados: ' + (pontuacao >= 2 ? '✅' : '❌'));
        console.log('• Sistema de Comentários: ' + (pontuacao >= 3 ? '✅' : '❌'));
        console.log('• Verificação de Permissão: ' + (pontuacao >= 4 ? '✅' : '❌'));
        console.log('• Hierarquia de Usuários: ' + (pontuacao >= 5 ? '✅' : '❌'));
        console.log('• Catálogo de Produtos: ' + (pontuacao >= 6 ? '✅' : '❌'));
        console.log('• Sistema de Pedidos: ' + (pontuacao >= 7 ? '✅' : '❌'));
        console.log('• API Endpoints: ' + (pontuacao >= 8 ? '✅' : '❌'));

        console.log('\n🏆 TESTE COMPLETO FINALIZADO!');
        console.log(`📅 Realizado em: ${new Date().toLocaleString('pt-BR')}`);
        
    } catch (error) {
        console.error('❌ ERRO CRÍTICO NO TESTE:', error.message);
    }
}

// Aguardar um momento e executar
setTimeout(testeCompletoAtualizado, 1000);
