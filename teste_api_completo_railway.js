#!/usr/bin/env node

const axios = require('axios');

// URL base da API no Railway
const BASE_URL = 'https://fgt-ecommerce-backend-production.up.railway.app';

console.log('🧪 Testando API FGT E-commerce no Railway');
console.log('🌐 URL Base:', BASE_URL);
console.log('⏰ Iniciado em:', new Date().toISOString());
console.log('=' .repeat(60));

// Função para fazer requisições com tratamento de erro
async function testarEndpoint(metodo, endpoint, dados = null, headers = {}) {
    try {
        const config = {
            method: metodo,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Content-Type': 'application/json',
                ...headers
            }
        };

        if (dados) {
            config.data = dados;
        }

        console.log(`\n📡 ${metodo.toUpperCase()} ${endpoint}`);
        
        const inicio = Date.now();
        const response = await axios(config);
        const tempo = Date.now() - inicio;
        
        console.log(`✅ Status: ${response.status} (${tempo}ms)`);
        
        // Mostrar apenas parte dos dados se for muito grande
        if (response.data) {
            const dados = response.data;
            if (typeof dados === 'object') {
                if (Array.isArray(dados) && dados.length > 3) {
                    console.log(`📊 Dados: Array com ${dados.length} itens`);
                    console.log('   Primeiro item:', JSON.stringify(dados[0], null, 2).substring(0, 200) + '...');
                } else {
                    const dadosStr = JSON.stringify(dados, null, 2);
                    if (dadosStr.length > 500) {
                        console.log('📊 Dados:', dadosStr.substring(0, 500) + '...');
                    } else {
                        console.log('📊 Dados:', dados);
                    }
                }
            } else {
                console.log('📊 Dados:', dados);
            }
        }
        
        return { sucesso: true, dados: response.data, status: response.status };
        
    } catch (error) {
        console.log(`❌ Erro: ${error.response?.status || 'SEM_RESPOSTA'}`);
        if (error.response?.data) {
            console.log('📋 Detalhes:', error.response.data);
        } else {
            console.log('📋 Mensagem:', error.message);
        }
        return { sucesso: false, erro: error.message, status: error.response?.status };
    }
}

// Função principal de teste
async function executarTestes() {
    const resultados = [];
    
    console.log('\n🔍 TESTES BÁSICOS DE CONECTIVIDADE');
    console.log('-'.repeat(40));
    
    // 1. Health Check
    let resultado = await testarEndpoint('GET', '/');
    resultados.push({ teste: 'Health Check Raiz', ...resultado });
    
    resultado = await testarEndpoint('GET', '/health');
    resultados.push({ teste: 'Health Check /health', ...resultado });
    
    resultado = await testarEndpoint('GET', '/api/info');
    resultados.push({ teste: 'Info da API', ...resultado });
    
    resultado = await testarEndpoint('GET', '/api/test');
    resultados.push({ teste: 'Teste sem banco', ...resultado });

    console.log('\n🛍️ TESTES DE PRODUTOS');
    console.log('-'.repeat(40));
    
    // 2. Produtos
    resultado = await testarEndpoint('GET', '/api/produtos');
    resultados.push({ teste: 'Listar produtos', ...resultado });
    
    resultado = await testarEndpoint('GET', '/api/produtos/destaques');
    resultados.push({ teste: 'Produtos em destaque', ...resultado });
    
    resultado = await testarEndpoint('GET', '/api/produtos/categoria/tenis');
    resultados.push({ teste: 'Produtos por categoria', ...resultado });

    console.log('\n🔐 TESTES DE AUTENTICAÇÃO');
    console.log('-'.repeat(40));
    
    // 3. Autenticação
    let tokenAdmin = null;
    
    // Tentar login admin
    resultado = await testarEndpoint('POST', '/api/auth/login', {
        email: 'admin@fgt.com',
        senha: 'admin123'
    });
    resultados.push({ teste: 'Login admin', ...resultado });
    
    if (resultado.sucesso && resultado.dados?.token) {
        tokenAdmin = resultado.dados.token;
        console.log('🔑 Token admin obtido com sucesso!');
    }
    
    // Testar registro de novo usuário
    resultado = await testarEndpoint('POST', '/api/auth/registro', {
        nome: 'Usuário Teste',
        email: 'teste@exemplo.com',
        senha: '123456789',
        telefone: '11999999999'
    });
    resultados.push({ teste: 'Registro usuário', ...resultado });

    console.log('\n🛒 TESTES DE CARRINHO');
    console.log('-'.repeat(40));
    
    // 4. Carrinho (precisa de token)
    if (tokenAdmin) {
        resultado = await testarEndpoint('GET', '/api/carrinho', null, {
            'Authorization': `Bearer ${tokenAdmin}`
        });
        resultados.push({ teste: 'Ver carrinho', ...resultado });
        
        // Tentar adicionar produto ao carrinho
        resultado = await testarEndpoint('POST', '/api/carrinho/adicionar', {
            produto_id: 1,
            quantidade: 1,
            tamanho: '42',
            cor: 'Preto'
        }, {
            'Authorization': `Bearer ${tokenAdmin}`
        });
        resultados.push({ teste: 'Adicionar ao carrinho', ...resultado });
    }

    console.log('\n🎉 TESTES DE PROMOÇÕES');
    console.log('-'.repeat(40));
    
    // 5. Promoções
    resultado = await testarEndpoint('GET', '/api/promocoes');
    resultados.push({ teste: 'Listar promoções', ...resultado });
    
    resultado = await testarEndpoint('GET', '/api/promocoes/ativas');
    resultados.push({ teste: 'Promoções ativas', ...resultado });

    console.log('\n💬 TESTES DE COMENTÁRIOS');
    console.log('-'.repeat(40));
    
    // 6. Comentários
    resultado = await testarEndpoint('GET', '/api/comentarios/produto/1');
    resultados.push({ teste: 'Comentários do produto 1', ...resultado });

    console.log('\n👑 TESTES ADMIN (SE TOKEN DISPONÍVEL)');
    console.log('-'.repeat(40));
    
    // 7. Admin (se tiver token)
    if (tokenAdmin) {
        resultado = await testarEndpoint('GET', '/api/admin/dashboard', null, {
            'Authorization': `Bearer ${tokenAdmin}`
        });
        resultados.push({ teste: 'Dashboard admin', ...resultado });
        
        resultado = await testarEndpoint('GET', '/api/admin/usuarios', null, {
            'Authorization': `Bearer ${tokenAdmin}`
        });
        resultados.push({ teste: 'Listar usuários (admin)', ...resultado });
    }

    // 8. Teste de endpoint inexistente
    console.log('\n🚫 TESTE DE ENDPOINT INEXISTENTE');
    console.log('-'.repeat(40));
    
    resultado = await testarEndpoint('GET', '/api/endpoint-inexistente');
    resultados.push({ teste: 'Endpoint inexistente (404)', ...resultado });

    // Resumo final
    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMO DOS TESTES');
    console.log('='.repeat(60));
    
    const sucessos = resultados.filter(r => r.sucesso).length;
    const total = resultados.length;
    const falhas = total - sucessos;
    
    console.log(`✅ Sucessos: ${sucessos}/${total} (${Math.round(sucessos/total*100)}%)`);
    console.log(`❌ Falhas: ${falhas}/${total} (${Math.round(falhas/total*100)}%)`);
    
    if (falhas > 0) {
        console.log('\n❌ FALHAS DETECTADAS:');
        resultados.filter(r => !r.sucesso).forEach(r => {
            console.log(`  - ${r.teste}: ${r.erro || r.status}`);
        });
    }
    
    console.log('\n🎯 ENDPOINTS FUNCIONAIS:');
    resultados.filter(r => r.sucesso).forEach(r => {
        console.log(`  ✅ ${r.teste}`);
    });
    
    console.log('\n⏰ Teste concluído em:', new Date().toISOString());
    console.log('🌐 Backend FGT E-commerce está', sucessos > total/2 ? '✅ FUNCIONANDO' : '❌ COM PROBLEMAS');
    
    return { sucessos, total, falhas, resultados };
}

// Executar testes
if (require.main === module) {
    executarTestes()
        .then((resultado) => {
            process.exit(resultado.falhas === 0 ? 0 : 1);
        })
        .catch((error) => {
            console.error('❌ Erro crítico durante os testes:', error);
            process.exit(1);
        });
}

module.exports = { executarTestes, testarEndpoint };
