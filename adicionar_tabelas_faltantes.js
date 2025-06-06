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

console.log('🔧 Adicionando tabelas faltantes no MySQL Railway...');

async function adicionarTabelasFaltantes() {
    let connection;
    
    try {
        console.log('🔗 Conectando ao MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado com sucesso!');

        // Tabelas adicionais que estão sendo referenciadas no código
        const tabelasAdicionais = [
            // Tabela de logs do sistema
            `CREATE TABLE IF NOT EXISTS logs_sistema (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT,
                acao VARCHAR(100) NOT NULL,
                detalhes JSON,
                ip_usuario VARCHAR(45),
                user_agent TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_logs_usuario (usuario_id),
                INDEX idx_logs_acao (acao),
                INDEX idx_logs_data (criado_em)
            )`,
            
            // Tabela de endereços de entrega
            `CREATE TABLE IF NOT EXISTS enderecos_entrega (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                nome_destinatario VARCHAR(100) NOT NULL,
                cep VARCHAR(9) NOT NULL,
                endereco VARCHAR(200) NOT NULL,
                numero VARCHAR(10) NOT NULL,
                complemento VARCHAR(100),
                bairro VARCHAR(100) NOT NULL,
                cidade VARCHAR(100) NOT NULL,
                estado VARCHAR(2) NOT NULL,
                telefone VARCHAR(20),
                endereco_padrao BOOLEAN DEFAULT FALSE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            )`,
            
            // Tabela de cupons de desconto
            `CREATE TABLE IF NOT EXISTS cupons (
                id INT AUTO_INCREMENT PRIMARY KEY,
                codigo VARCHAR(50) UNIQUE NOT NULL,
                nome VARCHAR(100) NOT NULL,
                tipo_desconto ENUM('percentual', 'valor_fixo') NOT NULL,
                valor_desconto DECIMAL(10,2) NOT NULL,
                valor_minimo_pedido DECIMAL(10,2) DEFAULT 0,
                limite_uso INT DEFAULT NULL,
                usos_realizados INT DEFAULT 0,
                ativo BOOLEAN DEFAULT TRUE,
                data_inicio TIMESTAMP NOT NULL,
                data_fim TIMESTAMP NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_cupons_codigo (codigo),
                INDEX idx_cupons_ativo (ativo)
            )`,
            
            // Tabela de usos de cupons
            `CREATE TABLE IF NOT EXISTS cupons_utilizados (
                id INT AUTO_INCREMENT PRIMARY KEY,
                cupom_id INT NOT NULL,
                usuario_id INT,
                pedido_id INT,
                valor_desconto DECIMAL(10,2) NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (cupom_id) REFERENCES cupons(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
                FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE SET NULL
            )`,
            
            // Tabela de categorias de produtos
            `CREATE TABLE IF NOT EXISTS categorias (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) UNIQUE NOT NULL,
                descricao TEXT,
                slug VARCHAR(100) UNIQUE NOT NULL,
                imagem VARCHAR(255),
                ativa BOOLEAN DEFAULT TRUE,
                ordem_exibicao INT DEFAULT 0,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_categorias_slug (slug),
                INDEX idx_categorias_ativa (ativa)
            )`,
            
            // Tabela de marcas
            `CREATE TABLE IF NOT EXISTS marcas (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) UNIQUE NOT NULL,
                logo VARCHAR(255),
                site VARCHAR(255),
                ativa BOOLEAN DEFAULT TRUE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_marcas_nome (nome),
                INDEX idx_marcas_ativa (ativa)
            )`,
            
            // Tabela de avaliações detalhadas (separada de comentários)
            `CREATE TABLE IF NOT EXISTS avaliacoes_produtos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                produto_id INT NOT NULL,
                usuario_id INT,
                nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
                titulo VARCHAR(200),
                comentario TEXT,
                recomenda BOOLEAN,
                verificada BOOLEAN DEFAULT FALSE,
                aprovada BOOLEAN DEFAULT FALSE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
                INDEX idx_avaliacoes_produto (produto_id),
                INDEX idx_avaliacoes_aprovada (aprovada)
            )`,
            
            // Tabela de favoritos/wishlist
            `CREATE TABLE IF NOT EXISTS favoritos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                produto_id INT NOT NULL,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
                UNIQUE KEY unique_favorito (usuario_id, produto_id)
            )`,
            
            // Tabela de histórico de preços
            `CREATE TABLE IF NOT EXISTS historico_precos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                produto_id INT NOT NULL,
                preco_anterior DECIMAL(10,2),
                preco_novo DECIMAL(10,2) NOT NULL,
                motivo VARCHAR(100),
                usuario_alteracao INT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
                INDEX idx_historico_produto (produto_id),
                INDEX idx_historico_data (criado_em)
            )`,
            
            // Tabela de newsletters
            `CREATE TABLE IF NOT EXISTS newsletter_inscricoes (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                nome VARCHAR(100),
                ativa BOOLEAN DEFAULT TRUE,
                data_inscricao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                data_cancelamento TIMESTAMP NULL,
                INDEX idx_newsletter_email (email),
                INDEX idx_newsletter_ativa (ativa)
            )`,
            
            // Tabela de banner promocionais
            `CREATE TABLE IF NOT EXISTS banners (
                id INT AUTO_INCREMENT PRIMARY KEY,
                titulo VARCHAR(200) NOT NULL,
                subtitulo VARCHAR(300),
                imagem VARCHAR(255) NOT NULL,
                link VARCHAR(500),
                ativo BOOLEAN DEFAULT TRUE,
                ordem_exibicao INT DEFAULT 0,
                data_inicio TIMESTAMP,
                data_fim TIMESTAMP,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_banners_ativo (ativo),
                INDEX idx_banners_ordem (ordem_exibicao)
            )`
        ];

        console.log('🗄️ Criando tabelas adicionais...');
        
        for (let i = 0; i < tabelasAdicionais.length; i++) {
            const comando = tabelasAdicionais[i];
            try {
                await connection.execute(comando);
                console.log(`✅ Tabela ${i + 1}/${tabelasAdicionais.length} criada`);
            } catch (error) {
                console.log(`⚠️ Erro na tabela ${i + 1}: ${error.message.substring(0, 100)}...`);
            }
        }

        // Adicionar colunas que podem estar faltando nas tabelas existentes
        console.log('\n🔧 Adicionando colunas faltantes...');
        
        const alteracoes = [
            // Adicionar colunas na tabela usuarios
            `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS telefone VARCHAR(20)`,
            `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS data_nascimento DATE`,
            `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS nivel_acesso ENUM('visitante', 'usuario', 'colaborador', 'supervisor', 'diretor') DEFAULT 'usuario'`,
            `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS status ENUM('ativo', 'inativo', 'suspenso', 'pendente') DEFAULT 'ativo'`,
            `ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS ultimo_acesso TIMESTAMP NULL`,
            
            // Adicionar colunas na tabela produtos
            `ALTER TABLE produtos ADD COLUMN IF NOT EXISTS peso DECIMAL(8,3)`,
            `ALTER TABLE produtos ADD COLUMN IF NOT EXISTS dimensoes VARCHAR(100)`,
            `ALTER TABLE produtos ADD COLUMN IF NOT EXISTS material VARCHAR(200)`,
            `ALTER TABLE produtos ADD COLUMN IF NOT EXISTS origem VARCHAR(100)`,
            `ALTER TABLE produtos ADD COLUMN IF NOT EXISTS garantia_meses INT DEFAULT 12`,
            `ALTER TABLE produtos ADD COLUMN IF NOT EXISTS disponivel BOOLEAN DEFAULT TRUE`,
            `ALTER TABLE produtos ADD COLUMN IF NOT EXISTS seo_titulo VARCHAR(200)`,
            `ALTER TABLE produtos ADD COLUMN IF NOT EXISTS seo_descricao TEXT`,
            
            // Adicionar colunas na tabela pedidos
            `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS codigo_rastreamento VARCHAR(100)`,
            `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_envio TIMESTAMP NULL`,
            `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS data_entrega TIMESTAMP NULL`,
            `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cupom_usado VARCHAR(50)`,
            `ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS valor_desconto_cupom DECIMAL(10,2) DEFAULT 0`,
            
            // Adicionar colunas na tabela promocoes_relampago
            `ALTER TABLE promocoes_relampago ADD COLUMN IF NOT EXISTS nome VARCHAR(200)`,
            `ALTER TABLE promocoes_relampago ADD COLUMN IF NOT EXISTS quantidade_limite INT`,
            `ALTER TABLE promocoes_relampago ADD COLUMN IF NOT EXISTS quantidade_vendida INT DEFAULT 0`,
            `ALTER TABLE promocoes_relampago ADD COLUMN IF NOT EXISTS criado_por INT`
        ];

        for (let i = 0; i < alteracoes.length; i++) {
            const alteracao = alteracoes[i];
            try {
                await connection.execute(alteracao);
                console.log(`✅ Alteração ${i + 1}/${alteracoes.length} aplicada`);
            } catch (error) {
                // Ignorar erros de colunas que já existem
                if (!error.message.includes('Duplicate column')) {
                    console.log(`⚠️ Erro na alteração ${i + 1}: ${error.message.substring(0, 50)}...`);
                }
            }
        }

        // Inserir dados básicos nas novas tabelas
        console.log('\n📦 Inserindo dados básicos...');
        
        // Categorias básicas
        const categorias = [
            ['Tênis Esportivos', 'Tênis para prática de esportes e exercícios', 'tenis-esportivos'],
            ['Tênis Casuais', 'Tênis para uso diário e casual', 'tenis-casuais'],
            ['Tênis de Corrida', 'Tênis especializados para corrida', 'tenis-corrida'],
            ['Tênis de Basquete', 'Tênis para basquete', 'tenis-basquete'],
            ['Tênis Infantis', 'Tênis para crianças', 'tenis-infantis']
        ];

        for (const [nome, descricao, slug] of categorias) {
            try {
                await connection.execute(`
                    INSERT IGNORE INTO categorias (nome, descricao, slug)
                    VALUES (?, ?, ?)
                `, [nome, descricao, slug]);
            } catch (e) { /* categoria já existe */ }
        }

        // Marcas básicas
        const marcas = [
            'Nike', 'Adidas', 'Puma', 'Vans', 'Converse', 'New Balance', 
            'Asics', 'Mizuno', 'Olympikus', 'Fila'
        ];

        for (const marca of marcas) {
            try {
                await connection.execute(`
                    INSERT IGNORE INTO marcas (nome)
                    VALUES (?)
                `, [marca]);
            } catch (e) { /* marca já existe */ }
        }

        // Verificar estrutura final
        console.log('\n📋 Verificando estrutura final...');
        const [tabelas] = await connection.execute('SHOW TABLES');
        console.log(`Total de tabelas: ${tabelas.length}`);
        
        console.log('\nTabelas disponíveis:');
        tabelas.forEach((tabela, index) => {
            console.log(`${index + 1}. ${Object.values(tabela)[0]}`);
        });

        // Estatísticas finais
        console.log('\n📊 Estatísticas do banco:');
        const [produtos] = await connection.execute('SELECT COUNT(*) as total FROM produtos');
        const [usuarios] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');
        const [categorias_count] = await connection.execute('SELECT COUNT(*) as total FROM categorias');
        const [marcas_count] = await connection.execute('SELECT COUNT(*) as total FROM marcas');
        
        console.log(`  - Produtos: ${produtos[0].total}`);
        console.log(`  - Usuários: ${usuarios[0].total}`);
        console.log(`  - Categorias: ${categorias_count[0].total}`);
        console.log(`  - Marcas: ${marcas_count[0].total}`);

        console.log('\n✅ Estrutura completa do banco configurada!');

    } catch (error) {
        console.error('❌ Erro ao adicionar tabelas:', error.message);
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
    adicionarTabelasFaltantes()
        .then(() => {
            console.log('✅ Processo concluído!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Falha no processo:', error);
            process.exit(1);
        });
}

module.exports = { adicionarTabelasFaltantes };
