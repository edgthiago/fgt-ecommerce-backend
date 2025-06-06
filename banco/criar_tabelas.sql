-- Script para criar o banco de dados da loja de tênis
-- Arquivo: criar_tabelas.sql

CREATE DATABASE IF NOT EXISTS projetofgt;
USE projetofgt;

-- Tabela principal de produtos (baseada na estrutura existente)
CREATE TABLE produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    marca VARCHAR(100) NOT NULL,
    nome VARCHAR(255) NOT NULL,
    imagem VARCHAR(500) NOT NULL DEFAULT '/tenis_produtos.png',
    preco_antigo DECIMAL(10, 2) NOT NULL,
    preco_atual DECIMAL(10, 2) NOT NULL,
    desconto INT NOT NULL,
    avaliacao DECIMAL(2, 1) NOT NULL DEFAULT 0,
    total_avaliacoes INT NOT NULL DEFAULT 0,
    categoria VARCHAR(50) NOT NULL,
    genero ENUM('masculino', 'feminino', 'unissex') NOT NULL,
    condicao ENUM('novo', 'usado') NOT NULL DEFAULT 'novo',
    disponivel BOOLEAN DEFAULT TRUE,
    quantidade_estoque INT DEFAULT 0,
    descricao TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabela de usuários
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    telefone VARCHAR(20),
    data_nascimento DATE,
    tipo_usuario ENUM('visitante', 'usuario', 'colaborador', 'supervisor', 'diretor') DEFAULT 'visitante',
    status ENUM('ativo', 'inativo', 'bloqueado') DEFAULT 'ativo',
    aceite_lgpd BOOLEAN DEFAULT FALSE,
    data_aceite_lgpd TIMESTAMP NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ultimo_login TIMESTAMP NULL,
    ip_ultimo_login VARCHAR(45),
    token_recuperacao VARCHAR(255) NULL,
    token_expiracao TIMESTAMP NULL
);

-- Tabela de endereços dos usuários (separada para LGPD)
CREATE TABLE enderecos_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tipo ENUM('residencial', 'comercial', 'entrega') DEFAULT 'residencial',
    cep VARCHAR(9),
    rua VARCHAR(255),
    numero VARCHAR(10),
    complemento VARCHAR(100),
    bairro VARCHAR(100),
    cidade VARCHAR(100),
    estado VARCHAR(2),
    eh_principal BOOLEAN DEFAULT FALSE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela do carrinho de compras
CREATE TABLE carrinho (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    produto_id INT,
    quantidade INT DEFAULT 1,
    preco_unitario DECIMAL(10, 2),
    tamanho VARCHAR(10),
    cor VARCHAR(50),
    data_adicionado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE
);

-- Tabela de promoções relâmpago
CREATE TABLE promocoes_relampago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    produto_id INT,
    desconto_percentual INT NOT NULL,
    preco_promocional DECIMAL(10, 2),
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    quantidade_limite INT,
    quantidade_vendida INT DEFAULT 0,
    ativo BOOLEAN DEFAULT TRUE,
    criado_por INT,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (produto_id) REFERENCES produtos(id),
    FOREIGN KEY (criado_por) REFERENCES usuarios(id)
);

-- Tabela de pedidos
CREATE TABLE pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    endereco_entrega_id INT,
    valor_total DECIMAL(10, 2) NOT NULL,
    valor_desconto DECIMAL(10, 2) DEFAULT 0,
    valor_frete DECIMAL(10, 2) DEFAULT 0,
    status_pedido ENUM('pendente', 'confirmado', 'preparando', 'enviado', 'entregue', 'cancelado') DEFAULT 'pendente',
    forma_pagamento VARCHAR(50),
    observacoes TEXT,
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (endereco_entrega_id) REFERENCES enderecos_usuarios(id)
);

-- Tabela de itens do pedido
CREATE TABLE itens_pedido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT,
    produto_id INT,
    quantidade INT NOT NULL,
    preco_unitario DECIMAL(10, 2) NOT NULL,
    desconto_aplicado DECIMAL(10, 2) DEFAULT 0,
    subtotal DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- Tabela de logs do sistema (para LGPD e auditoria)
CREATE TABLE logs_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    acao VARCHAR(100) NOT NULL,
    tabela_afetada VARCHAR(50),
    registro_id INT,
    dados_anteriores JSON,
    dados_novos JSON,
    ip_usuario VARCHAR(45),
    navegador TEXT,
    data_acao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabela de consentimentos LGPD
CREATE TABLE consentimentos_lgpd (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT,
    tipo_consentimento ENUM('cookies', 'marketing', 'analytics', 'compartilhamento') NOT NULL,
    consentimento_dado BOOLEAN NOT NULL,
    data_consentimento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_usuario VARCHAR(45),
    versao_politica VARCHAR(10) DEFAULT '1.0',
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de avaliações de produtos
CREATE TABLE avaliacoes_produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_id INT,
    usuario_id INT,
    nota INT NOT NULL CHECK (nota >= 1 AND nota <= 5),
    comentario TEXT,
    data_avaliacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    aprovado BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (produto_id, usuario_id)
);

-- Tabela de pedidos simples (sistema de compras)
CREATE TABLE pedidos_simples (
    id VARCHAR(50) PRIMARY KEY COMMENT 'ID único do pedido no formato PED-timestamp-random',
    usuario_id INT NOT NULL COMMENT 'ID do usuário que fez o pedido',
    valor_total DECIMAL(10, 2) NOT NULL COMMENT 'Valor total do pedido incluindo frete e desconto',
    valor_desconto DECIMAL(10, 2) DEFAULT 0 COMMENT 'Valor do desconto aplicado',
    valor_frete DECIMAL(10, 2) DEFAULT 0 COMMENT 'Valor do frete',
    forma_pagamento VARCHAR(50) DEFAULT 'cartao_credito' COMMENT 'Método de pagamento utilizado',
    observacoes TEXT COMMENT 'Observações adicionais do pedido',
    status_pedido VARCHAR(20) DEFAULT 'pendente' COMMENT 'Status atual do pedido',
    data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Data e hora da criação do pedido',
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Data da última atualização',
    itens_json TEXT NOT NULL COMMENT 'JSON com os itens do pedido',
    
    -- Índices para melhor performance
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_status_pedido (status_pedido),
    INDEX idx_data_pedido (data_pedido),
    INDEX idx_forma_pagamento (forma_pagamento),
    INDEX idx_usuario_status (usuario_id, status_pedido),
    INDEX idx_periodo (data_pedido, status_pedido),
    
    -- Foreign key
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    
    -- Constraints
    CONSTRAINT chk_valor_total CHECK (valor_total >= 0),
    CONSTRAINT chk_valor_desconto CHECK (valor_desconto >= 0),
    CONSTRAINT chk_valor_frete CHECK (valor_frete >= 0),
    CONSTRAINT chk_status_pedido CHECK (status_pedido IN ('pendente', 'confirmado', 'processando', 'enviado', 'entregue', 'cancelado')),
    CONSTRAINT chk_forma_pagamento CHECK (forma_pagamento IN ('cartao_credito', 'cartao_debito', 'pix', 'boleto', 'dinheiro'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices para melhorar performance
CREATE INDEX idx_produtos_categoria ON produtos(categoria);
CREATE INDEX idx_produtos_marca ON produtos(marca);
CREATE INDEX idx_produtos_genero ON produtos(genero);
CREATE INDEX idx_produtos_preco ON produtos(preco_atual);
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_tipo ON usuarios(tipo_usuario);
CREATE INDEX idx_carrinho_usuario ON carrinho(usuario_id);
CREATE INDEX idx_logs_usuario ON logs_sistema(usuario_id);
CREATE INDEX idx_logs_data ON logs_sistema(data_acao);
CREATE INDEX idx_promocoes_ativo ON promocoes_relampago(ativo);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_status ON pedidos(status_pedido);

-- Comentários das tabelas
ALTER TABLE produtos COMMENT = 'Tabela principal de produtos da loja';
ALTER TABLE usuarios COMMENT = 'Usuários do sistema com diferentes níveis de acesso';
ALTER TABLE carrinho COMMENT = 'Carrinho de compras dos usuários';
ALTER TABLE promocoes_relampago COMMENT = 'Promoções temporárias com desconto';
ALTER TABLE logs_sistema COMMENT = 'Logs de auditoria para conformidade LGPD';
ALTER TABLE consentimentos_lgpd COMMENT = 'Consentimentos dos usuários conforme LGPD';
ALTER TABLE pedidos_simples COMMENT = 'Pedidos finalizados do sistema de e-commerce';
