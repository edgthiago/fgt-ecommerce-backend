const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

/**
 * Script para configurar o banco de dados MySQL da loja de tênis
 * Suporta diferentes tipos de instalação MySQL
 */

class ConfiguradorBanco {
    constructor() {
        this.configs = [
            // XAMPP (mais comum no Windows)
            {
                nome: 'XAMPP',
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: '',
                charset: 'utf8mb4'
            },
            // MySQL Workbench / MySQL Community
            {
                nome: 'MySQL Local',
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: 'root',
                charset: 'utf8mb4'
            },
            // WampServer
            {
                nome: 'WampServer',
                host: 'localhost',
                port: 3306,
                user: 'root',
                password: '',
                charset: 'utf8mb4'
            }
        ];
    }

    async testarConexao(config) {
        try {
            console.log(`🔄 Testando conexão com ${config.nome}...`);
            const conexao = await mysql.createConnection({
                host: config.host,
                port: config.port,
                user: config.user,
                password: config.password,
                charset: config.charset
            });
            
            await conexao.execute('SELECT 1');
            await conexao.end();
            console.log(`✅ Conexão com ${config.nome} bem-sucedida!`);
            return true;
        } catch (erro) {
            console.log(`❌ Falha na conexão com ${config.nome}: ${erro.message}`);
            return false;
        }
    }

    async encontrarConfiguracaoValida() {
        console.log('🔍 Procurando configuração de MySQL válida...\n');
        
        for (const config of this.configs) {
            if (await this.testarConexao(config)) {
                return config;
            }
        }
        return null;
    }

    async criarBancoDeDados(config) {
        try {
            console.log('\n📊 Criando banco de dados "loja_tenis"...');
            const conexao = await mysql.createConnection({
                host: config.host,
                port: config.port,
                user: config.user,
                password: config.password,
                charset: config.charset
            });

            // Criar banco se não existir
            await conexao.execute(`
                CREATE DATABASE IF NOT EXISTS loja_tenis 
                CHARACTER SET utf8mb4 
                COLLATE utf8mb4_unicode_ci
            `);
            console.log('✅ Banco de dados criado/verificado com sucesso!');
            
            await conexao.end();
            return true;
        } catch (erro) {
            console.error('❌ Erro ao criar banco de dados:', erro.message);
            return false;
        }
    }

    async executarSQL(config, nomeArquivo) {
        try {
            console.log(`\n📝 Executando ${nomeArquivo}...`);
            const caminhoArquivo = path.join(__dirname, nomeArquivo);
            const sql = await fs.readFile(caminhoArquivo, 'utf8');
            
            const conexao = await mysql.createConnection({
                host: config.host,
                port: config.port,
                user: config.user,
                password: config.password,
                database: 'loja_tenis',
                charset: config.charset,
                multipleStatements: true
            });

            // Dividir em comandos separados para melhor controle
            const comandos = sql.split(';').filter(cmd => cmd.trim());
            
            for (const comando of comandos) {
                if (comando.trim()) {
                    await conexao.execute(comando);
                }
            }
            
            await conexao.end();
            console.log(`✅ ${nomeArquivo} executado com sucesso!`);
            return true;
        } catch (erro) {
            console.error(`❌ Erro ao executar ${nomeArquivo}:`, erro.message);
            return false;
        }
    }

    async atualizarArquivoEnv(config) {
        try {
            console.log('\n⚙️ Atualizando arquivo .env...');
            const caminhoEnv = path.join(__dirname, '..', '.env');
            let conteudoEnv = await fs.readFile(caminhoEnv, 'utf8');
            
            // Atualizar configurações do banco
            conteudoEnv = conteudoEnv.replace(/DB_HOST=.*/, `DB_HOST=${config.host}`);
            conteudoEnv = conteudoEnv.replace(/DB_PORT=.*/, `DB_PORT=${config.port}`);
            conteudoEnv = conteudoEnv.replace(/DB_USER=.*/, `DB_USER=${config.user}`);
            conteudoEnv = conteudoEnv.replace(/DB_PASSWORD=.*/, `DB_PASSWORD=${config.password}`);
            
            await fs.writeFile(caminhoEnv, conteudoEnv);
            console.log('✅ Arquivo .env atualizado!');
            return true;
        } catch (erro) {
            console.error('❌ Erro ao atualizar .env:', erro.message);
            return false;
        }
    }

    async verificarInstalacao() {
        console.log('\n🎯 Verificando instalação final...');
        try {
            const { criarConexao } = require('./conexao.js');
            const conexao = await criarConexao();
            
            // Testar algumas consultas básicas
            const [produtos] = await conexao.execute('SELECT COUNT(*) as total FROM produtos');
            const [usuarios] = await conexao.execute('SELECT COUNT(*) as total FROM usuarios');
            
            console.log(`✅ Produtos carregados: ${produtos[0].total}`);
            console.log(`✅ Usuários cadastrados: ${usuarios[0].total}`);
            
            await conexao.end();
            return true;
        } catch (erro) {
            console.error('❌ Erro na verificação final:', erro.message);
            return false;
        }
    }

    async configurar() {
        console.log('🚀 CONFIGURADOR DO BANCO DE DADOS - LOJA DE TÊNIS\n');
        console.log('Este script irá configurar automaticamente o banco MySQL.\n');

        // 1. Encontrar configuração válida
        const config = await this.encontrarConfiguracaoValida();
        
        if (!config) {
            console.log('\n❌ NENHUMA CONFIGURAÇÃO MYSQL ENCONTRADA!');
            console.log('\n📋 OPÇÕES PARA INSTALAR MYSQL:');
            console.log('1. XAMPP (Recomendado): https://www.apachefriends.org/');
            console.log('2. MySQL Community: https://dev.mysql.com/downloads/mysql/');
            console.log('3. WampServer: https://www.wampserver.com/');
            console.log('\n💡 Após instalar, execute este script novamente.');
            return false;
        }

        console.log(`\n🎯 Usando configuração: ${config.nome}`);

        // 2. Criar banco de dados
        if (!await this.criarBancoDeDados(config)) {
            return false;
        }

        // 3. Criar tabelas
        if (!await this.executarSQL(config, 'criar_tabelas.sql')) {
            return false;
        }

        // 4. Inserir dados iniciais
        if (!await this.executarSQL(config, 'inserir_dados.sql')) {
            return false;
        }

        // 5. Atualizar .env
        if (!await this.atualizarArquivoEnv(config)) {
            return false;
        }

        // 6. Verificação final
        if (!await this.verificarInstalacao()) {
            return false;
        }

        console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
        console.log('\n📋 PRÓXIMOS PASSOS:');
        console.log('1. Execute: npm run dev');
        console.log('2. Acesse: http://localhost:3001');
        console.log('3. Use as credenciais padrão para testar:\n');
        console.log('   👤 Admin: admin@loja.com / admin123');
        console.log('   👤 Colaborador: colaborador@loja.com / colab123');
        console.log('   👤 Usuário: usuario@teste.com / user123');

        return true;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const configurador = new ConfiguradorBanco();
    configurador.configurar().catch(console.error);
}

module.exports = ConfiguradorBanco;
