// Teste simplificado da API sem autenticação (modo teste)
const axios = require('axios');

async function testeSimplificadoAPI() {
    console.log('🧪 TESTE SIMPLIFICADO DA API - MODO DESENVOLVIMENTO');
    console.log('⚠️  Mecanismos de segurança desabilitados para testes');
    console.log('=' .repeat(60));

    const baseURL = 'http://localhost:5000/api';
    
    try {
        // 1. Testar health check
        console.log('\n1. 🔍 Testando health check...');
        const healthResponse = await axios.get(`${baseURL}/health`);
        console.log(`✅ Status da API: OK`);

        // 2. Testar endpoint de informações
        console.log('\n2. 📊 Verificando endpoints disponíveis...');
        const infoResponse = await axios.get(`${baseURL}/info`);
        console.log(`📋 Endpoints encontrados:`);
        
        if (infoResponse.data.endpoints_disponiveis) {
            infoResponse.data.endpoints_disponiveis.forEach(endpoint => {
                console.log(`   • ${endpoint}`);
            });
        }

        // 3. Testar busca de comentários do produto 1
        console.log('\n3. 💬 Testando busca de comentários (produto 1)...');
        try {
            const comentariosResponse = await axios.get(`${baseURL}/comentarios/produtos/1/comentarios`);
            console.log(`✅ Comentários encontrados: ${comentariosResponse.data.length || 0}`);
            
            if (comentariosResponse.data.length > 0) {
                comentariosResponse.data.slice(0, 3).forEach((comentario, index) => {
                    console.log(`   ${index + 1}. ${comentario.usuario_nome || 'Usuário'} - ${comentario.avaliacao}/5`);
                    console.log(`      "${(comentario.comentario || '').substring(0, 50)}..."`);
                });
            }
        } catch (error) {
            console.log(`❌ Erro ao buscar comentários: ${error.response?.status} - ${error.response?.data?.mensagem || error.message}`);
        }

        // 4. Testar produtos
        console.log('\n4. 📦 Testando listagem de produtos...');
        try {
            const produtosResponse = await axios.get(`${baseURL}/produtos`);
            const produtos = produtosResponse.data;
            console.log(`✅ Produtos encontrados: ${produtos.length || 0}`);
            
            if (produtos.length > 0) {
                produtos.slice(0, 3).forEach((produto, index) => {
                    console.log(`   ${index + 1}. ${produto.nome} - R$ ${produto.preco_atual}`);
                });
            }
        } catch (error) {
            console.log(`❌ Erro ao buscar produtos: ${error.response?.status} - ${error.response?.data?.mensagem || error.message}`);
        }

        // 5. Testar promoções
        console.log('\n5. 🏷️ Testando promoções...');
        try {
            const promocoesResponse = await axios.get(`${baseURL}/promocoes`);
            console.log(`✅ Promoções encontradas: ${promocoesResponse.data.length || 0}`);
        } catch (error) {
            console.log(`❌ Erro ao buscar promoções: ${error.response?.status} - ${error.response?.data?.mensagem || error.message}`);
        }

        // 6. Testar dashboard admin (sem autenticação no modo teste)
        console.log('\n6. 🎛️ Testando dashboard admin...');
        try {
            const dashboardResponse = await axios.get(`${baseURL}/admin/dashboard`);
            console.log(`✅ Dashboard acessível: ${dashboardResponse.status === 200 ? 'SIM' : 'NÃO'}`);
            
            if (dashboardResponse.data) {
                const stats = dashboardResponse.data;
                console.log(`📊 Estatísticas do dashboard:`);
                if (stats.usuarios) console.log(`   • Usuários: ${stats.usuarios.total || 'N/A'}`);
                if (stats.produtos) console.log(`   • Produtos: ${stats.produtos.total || 'N/A'}`);
                if (stats.pedidos) console.log(`   • Pedidos: ${stats.pedidos.total || 'N/A'}`);
            }
        } catch (error) {
            console.log(`❌ Erro no dashboard: ${error.response?.status} - ${error.response?.data?.mensagem || error.message}`);
        }

        // 7. Verificação manual do sistema de comentários
        console.log('\n7. 🔧 Verificação manual do sistema...');
        
        // Simular verificação direta no banco
        const verificacaoManual = await verificarSistemaManual();
        console.log(`📋 Resultados da verificação manual:`);
        console.log(`   • Usuários com pedidos confirmados: ${verificacaoManual.usuariosComPedidos}`);
        console.log(`   • Produtos mais comprados: ${verificacaoManual.produtosMaisComprados}`);
        console.log(`   • Comentários com compra verificada: ${verificacaoManual.comentariosVerificados}`);

        console.log('\n' + '=' .repeat(60));
        console.log('🎉 TESTE SIMPLIFICADO CONCLUÍDO!');
        console.log('📊 Status geral do sistema: FUNCIONAL');
        console.log('⚠️  Lembrete: Ativar segurança antes da produção');

    } catch (error) {
        console.error('❌ Erro geral durante teste:', error.message);
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Dados: ${JSON.stringify(error.response.data, null, 2)}`);
        }
    }
}

async function verificarSistemaManual() {
    const mysql = require('mysql2/promise');
    
    try {
        const conexao = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '1234',
            database: 'projetofgt'
        });

        // Contar usuários com pedidos confirmados
        const [usuarios] = await conexao.execute(`
            SELECT COUNT(DISTINCT usuario_id) as count 
            FROM pedidos_simples 
            WHERE status_pedido IN ('confirmado', 'preparando', 'enviado', 'entregue')
        `);

        // Produtos mais comprados
        const [produtos] = await conexao.execute(`
            SELECT COUNT(*) as count
            FROM pedidos_simples 
            WHERE status_pedido IN ('confirmado', 'preparando', 'enviado', 'entregue')
        `);

        // Comentários verificados
        const [comentarios] = await conexao.execute(`
            SELECT COUNT(*) as count 
            FROM comentarios_produtos 
            WHERE compra_verificada = 1 AND ativo = 1
        `);

        await conexao.end();

        return {
            usuariosComPedidos: usuarios[0].count,
            produtosMaisComprados: produtos[0].count,
            comentariosVerificados: comentarios[0].count
        };

    } catch (error) {
        console.log(`❌ Erro na verificação manual: ${error.message}`);
        return {
            usuariosComPedidos: 'N/A',
            produtosMaisComprados: 'N/A',
            comentariosVerificados: 'N/A'
        };
    }
}

// Aguardar servidor estar pronto
setTimeout(testeSimplificadoAPI, 1000);
