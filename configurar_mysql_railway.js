#!/usr/bin/env node

const mysql = require('mysql2/promise');

// Configurações do banco MySQL Railway
const dbConfig = {
    host: process.env.DB_HOST || 'mysql.railway.internal',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'FiDlAJLigMVrVtxIMtrFSuUVEmMsSwOZ',
    database: process.env.DB_NAME || 'railway'
};

console.log('🔧 Configurando MySQL Railway...');
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
        const criarTabelas = `
-- Criando tabelas para o FGT E-commerce

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    endereco TEXT,
    admin BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de produtos
CREATE TABLE IF NOT EXISTS produtos (
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
);

-- Tabela de carrinho
CREATE TABLE IF NOT EXISTS carrinho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    produto_id INT NOT NULL,
    quantidade INT DEFAULT 1,
    tamanho VARCHAR(10),
    cor VARCHAR(50),
    preco_unitario DECIMAL(10,2),
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de pedidos
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    total DECIMAL(10,2) NOT NULL,
    status VARCHAR(50) DEFAULT 'pendente',
    endereco_entrega TEXT,
    forma_pagamento VARCHAR(50),
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabela de itens do pedido
CREATE TABLE IF NOT EXISTS itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    produto_id INT NOT NULL,
    quantidade INT NOT NULL,
    tamanho VARCHAR(10),
    cor VARCHAR(50),
    preco_unitario DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de comentários
CREATE TABLE IF NOT EXISTS comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    usuario_id INT,
    nome_usuario VARCHAR(100),
    comentario TEXT NOT NULL,
    avaliacao INT CHECK (avaliacao >= 1 AND avaliacao <= 5),
    aprovado BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Tabela de promoções relâmpago
CREATE TABLE IF NOT EXISTS promocoes_relampago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT NOT NULL,
    preco_original DECIMAL(10,2) NOT NULL,
    preco_promocional DECIMAL(10,2) NOT NULL,
    desconto_percentual INT,
    inicio TIMESTAMP NOT NULL,
    fim TIMESTAMP NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Índices para melhor performance
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_marca ON produtos(marca);
CREATE INDEX idx_produtos_ativo ON produtos(ativo);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_status ON pedidos(status);
CREATE INDEX idx_comentarios_produto ON comentarios(produto_id);
CREATE INDEX idx_comentarios_aprovado ON comentarios(aprovado);
`;

        console.log('🗄️ Criando tabelas...');
        
        // Executar cada comando CREATE TABLE separadamente
        const comandos = criarTabelas.split(';').filter(cmd => cmd.trim() && !cmd.trim().startsWith('--'));
        
        for (const comando of comandos) {
            if (comando.trim()) {
                await connection.execute(comando);
            }
        }

        console.log('✅ Tabelas criadas com sucesso!');

        // Verificar tabelas criadas
        const [tabelas] = await connection.execute('SHOW TABLES');
        console.log('📋 Tabelas disponíveis:');
        tabelas.forEach(tabela => {
            console.log(`  - ${Object.values(tabela)[0]}`);
        });

        // Inserir alguns produtos de exemplo
        console.log('🏪 Inserindo produtos de exemplo...');
        
        const produtosExemplo = [
            {
                nome: 'Nike Air Max 90',
                descricao: 'Tênis Nike Air Max 90 original com design clássico e conforto incomparável.',
                preco: 599.99,
                categoria: 'tenis',
                marca: 'Nike',
                tamanhos: JSON.stringify(['38', '39', '40', '41', '42', '43']),
                cores: JSON.stringify(['Branco', 'Preto', 'Azul']),
                imagens: JSON.stringify(['/images/nike-air-max-90-1.jpg', '/images/nike-air-max-90-2.jpg']),
                estoque: 25,
                ativo: true,
                destaque: true
            },
            {
                nome: 'Adidas Ultraboost 22',
                descricao: 'Tênis Adidas Ultraboost 22 com tecnologia Boost para máximo retorno de energia.',
                preco: 799.99,
                categoria: 'tenis',
                marca: 'Adidas',
                tamanhos: JSON.stringify(['38', '39', '40', '41', '42', '43', '44']),
                cores: JSON.stringify(['Preto', 'Branco', 'Cinza']),
                imagens: JSON.stringify(['/images/adidas-ultraboost-1.jpg', '/images/adidas-ultraboost-2.jpg']),
                estoque: 15,
                ativo: true,
                destaque: true
            },
            {
                nome: 'Puma RS-X',
                descricao: 'Tênis Puma RS-X com design futurista e amortecimento superior.',
                preco: 449.99,
                categoria: 'tenis',
                marca: 'Puma',
                tamanhos: JSON.stringify(['37', '38', '39', '40', '41', '42']),
                cores: JSON.stringify(['Branco/Verde', 'Preto/Vermelho', 'Azul/Amarelo']),
                imagens: JSON.stringify(['/images/puma-rsx-1.jpg', '/images/puma-rsx-2.jpg']),
                estoque: 20,
                ativo: true,
                destaque: false
            }
        ];

        for (const produto of produtosExemplo) {
            await connection.execute(`
                INSERT IGNORE INTO produtos (nome, descricao, preco, categoria, marca, tamanhos, cores, imagens, estoque, ativo, destaque)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                produto.nome, produto.descricao, produto.preco, produto.categoria,
                produto.marca, produto.tamanhos, produto.cores, produto.imagens,
                produto.estoque, produto.ativo, produto.destaque
            ]);
        }

        console.log('✅ Produtos de exemplo inseridos!');

        // Criar usuário admin padrão
        console.log('👤 Criando usuário admin...');
        const bcrypt = require('bcrypt');
        const senhaHash = await bcrypt.hash('admin123', 10);
        
        await connection.execute(`
            INSERT IGNORE INTO usuarios (nome, email, senha, admin)
            VALUES (?, ?, ?, ?)
        `, ['Administrador', 'admin@fgt.com', senhaHash, true]);

        console.log('✅ Usuário admin criado! (email: admin@fgt.com, senha: admin123)');

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
