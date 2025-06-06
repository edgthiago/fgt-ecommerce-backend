#!/usr/bin/env node

const mysql = require('mysql2/promise');

// Configurações do banco MySQL Railway - URL pública para teste externo
const dbConfig = {
    host: 'ballast.proxy.rlwy.net',
    port: 23061,
    user: 'root',
    password: 'FiDlAJLigMVrVtxIMtrFSuUVEmMsSwOZ',
    database: 'railway'
};

console.log('🔧 Configurando MySQL Railway (URL Pública)...');
console.log('📊 Configurações:', {
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    database: dbConfig.database
});

async function configurarBanco() {
    let connection;
    
    try {
        console.log('🔗 Conectando ao MySQL...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexão com MySQL estabelecida!');

        // Script para criar todas as tabelas
        const comandosSQL = [
            `CREATE TABLE IF NOT EXISTS usuarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(100) NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                senha VARCHAR(255) NOT NULL,
                telefone VARCHAR(20),
                endereco TEXT,
                admin BOOLEAN DEFAULT FALSE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS produtos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                nome VARCHAR(200) NOT NULL,
                descricao TEXT,
                preco DECIMAL(10,2) NOT NULL,
                preco_promocional DECIMAL(10,2),
                categoria VARCHAR(100),
                marca VARCHAR(100),
                tamanhos JSON,
                cores JSON,
                imagens JSON,
                estoque INT DEFAULT 0,
                ativo BOOLEAN DEFAULT TRUE,
                destaque BOOLEAN DEFAULT FALSE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS carrinho (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT,
                produto_id INT NOT NULL,
                quantidade INT DEFAULT 1,
                tamanho VARCHAR(10),
                cor VARCHAR(50),
                preco_unitario DECIMAL(10,2),
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS pedidos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT,
                total DECIMAL(10,2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pendente',
                endereco_entrega TEXT,
                forma_pagamento VARCHAR(50),
                observacoes TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS itens_pedido (
                id INT AUTO_INCREMENT PRIMARY KEY,
                pedido_id INT NOT NULL,
                produto_id INT NOT NULL,
                quantidade INT NOT NULL,
                tamanho VARCHAR(10),
                cor VARCHAR(50),
                preco_unitario DECIMAL(10,2) NOT NULL
            )`,
            
            `CREATE TABLE IF NOT EXISTS comentarios (
                id INT AUTO_INCREMENT PRIMARY KEY,
                produto_id INT NOT NULL,
                usuario_id INT,
                nome_usuario VARCHAR(100),
                comentario TEXT NOT NULL,
                avaliacao INT CHECK (avaliacao >= 1 AND avaliacao <= 5),
                aprovado BOOLEAN DEFAULT FALSE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS promocoes_relampago (
                id INT AUTO_INCREMENT PRIMARY KEY,
                produto_id INT NOT NULL,
                preco_original DECIMAL(10,2) NOT NULL,
                preco_promocional DECIMAL(10,2) NOT NULL,
                desconto_percentual INT,
                inicio TIMESTAMP NOT NULL,
                fim TIMESTAMP NOT NULL,
                ativa BOOLEAN DEFAULT TRUE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        console.log('🗄️ Criando tabelas...');
        
        for (const comando of comandosSQL) {
            await connection.execute(comando);
            console.log('✅ Tabela criada');
        }

        console.log('🔧 Adicionando foreign keys...');
        
        // Adicionar foreign keys (podem falhar se já existirem)
        try {
            await connection.execute('ALTER TABLE carrinho ADD FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE');
        } catch (e) { /* FK pode já existir */ }
        
        try {
            await connection.execute('ALTER TABLE itens_pedido ADD FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE');
        } catch (e) { /* FK pode já existir */ }
        
        try {
            await connection.execute('ALTER TABLE itens_pedido ADD FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE');
        } catch (e) { /* FK pode já existir */ }
        
        try {
            await connection.execute('ALTER TABLE comentarios ADD FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE');
        } catch (e) { /* FK pode já existir */ }

        console.log('📋 Verificando tabelas criadas...');
        
        // Verificar tabelas criadas
        const [tabelas] = await connection.execute('SHOW TABLES');
        console.log('📋 Tabelas disponíveis:');
        tabelas.forEach(tabela => {
            console.log(`  - ${Object.values(tabela)[0]}`);
        });

        // Inserir alguns produtos de exemplo
        console.log('🏪 Inserindo produtos de exemplo...');
        
        const produtosExemplo = [
            ['Nike Air Max 90', 'Tênis Nike Air Max 90 original com design clássico e conforto incomparável.', 599.99, 'tenis', 'Nike', JSON.stringify(['38', '39', '40', '41', '42', '43']), JSON.stringify(['Branco', 'Preto', 'Azul']), JSON.stringify(['/images/nike-air-max-90-1.jpg']), 25, true, true],
            ['Adidas Ultraboost 22', 'Tênis Adidas Ultraboost 22 com tecnologia Boost para máximo retorno de energia.', 799.99, 'tenis', 'Adidas', JSON.stringify(['38', '39', '40', '41', '42', '43', '44']), JSON.stringify(['Preto', 'Branco', 'Cinza']), JSON.stringify(['/images/adidas-ultraboost-1.jpg']), 15, true, true],
            ['Puma RS-X', 'Tênis Puma RS-X com design futurista e amortecimento superior.', 449.99, 'tenis', 'Puma', JSON.stringify(['37', '38', '39', '40', '41', '42']), JSON.stringify(['Branco/Verde', 'Preto/Vermelho']), JSON.stringify(['/images/puma-rsx-1.jpg']), 20, true, false]
        ];

        for (const produto of produtosExemplo) {
            try {
                await connection.execute(`
                    INSERT INTO produtos (nome, descricao, preco, categoria, marca, tamanhos, cores, imagens, estoque, ativo, destaque)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, produto);
                console.log(`  ✅ Produto "${produto[0]}" inserido`);
            } catch (e) {
                console.log(`  ⚠️ Produto "${produto[0]}" já existe`);
            }
        }

        // Criar usuário admin padrão
        console.log('👤 Criando usuário admin...');
        const bcrypt = require('bcrypt');
        const senhaHash = await bcrypt.hash('admin123', 10);
        
        try {
            await connection.execute(`
                INSERT INTO usuarios (nome, email, senha, admin)
                VALUES (?, ?, ?, ?)
            `, ['Administrador', 'admin@fgt.com', senhaHash, true]);
            console.log('✅ Usuário admin criado! (email: admin@fgt.com, senha: admin123)');
        } catch (e) {
            console.log('⚠️ Usuário admin já existe');
        }

        // Verificar configuração final
        const [produtos] = await connection.execute('SELECT COUNT(*) as total FROM produtos');
        const [usuarios] = await connection.execute('SELECT COUNT(*) as total FROM usuarios');
        
        console.log('📊 Resumo da configuração:');
        console.log(`  - Produtos: ${produtos[0].total}`);
        console.log(`  - Usuários: ${usuarios[0].total}`);
        console.log('🎉 MySQL configurado com sucesso!');

    } catch (error) {
        console.error('❌ Erro ao configurar MySQL:', error.message);
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
    configurarBanco()
        .then(() => {
            console.log('✅ Configuração concluída!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Falha na configuração:', error);
            process.exit(1);
        });
}

module.exports = { configurarBanco, dbConfig };
