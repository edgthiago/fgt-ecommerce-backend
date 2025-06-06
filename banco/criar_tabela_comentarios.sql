-- Script para criar tabela de comentários de produtos
-- Execute este script para adicionar suporte ao sistema de comentários
-- NOTA: Esta tabela já existe no banco de dados atual

-- Estrutura da tabela comentarios_produtos (EXISTENTE):
-- Esta é a estrutura atual da tabela no banco de dados:
/*
CREATE TABLE comentarios_produtos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    produto_id INT NOT NULL,
    comentario TEXT NOT NULL,
    avaliacao TINYINT NOT NULL,
    compra_verificada TINYINT(1) DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    ativo TINYINT(1) DEFAULT 1,
    
    -- Índices para performance
    INDEX idx_produto_id (produto_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_data_criacao (data_criacao),
    INDEX idx_avaliacao (avaliacao),
    
    -- Garantir que cada usuário só pode comentar uma vez por produto
    UNIQUE KEY unique_usuario_produto (usuario_id, produto_id)
);
*/

-- A tabela já existe com 6 registros de exemplo
-- Para recriar a tabela (se necessário), descomente o código abaixo:

-- DROP TABLE IF EXISTS comentarios_produtos;
-- CREATE TABLE comentarios_produtos (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     usuario_id INT NOT NULL,
--     produto_id INT NOT NULL,
--     comentario TEXT NOT NULL,
--     avaliacao TINYINT NOT NULL CHECK (avaliacao >= 1 AND avaliacao <= 5),
--     compra_verificada TINYINT(1) DEFAULT 0,
--     data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
--     ativo TINYINT(1) DEFAULT 1,
--     
--     -- Índices para performance
--     INDEX idx_produto_id (produto_id),
--     INDEX idx_usuario_id (usuario_id),
--     INDEX idx_data_criacao (data_criacao),
--     INDEX idx_avaliacao (avaliacao),
--     
--     -- Garantir que cada usuário só pode comentar uma vez por produto
--     UNIQUE KEY unique_usuario_produto (usuario_id, produto_id)
-- );

-- Verificação das colunas na tabela usuarios:
-- As seguintes colunas já existem no banco atual:
-- cpf VARCHAR(14) - Campo para CPF do usuário
-- bairro VARCHAR(100) - Campo para bairro do usuário  
-- tipo ENUM('visitante','usuario','colaborador','supervisor','diretor') - Tipo de usuário
-- tipo_usuario ENUM('visitante','usuario','colaborador','supervisor','diretor') - Tipo de usuário (campo adicional)

-- Para verificar se as colunas existem, execute:
-- DESCRIBE usuarios;

-- Script para adicionar colunas se não existirem (OPCIONAL - já existem):
/*
-- Verificar e adicionar cpf se não existir
SET @sql_cpf = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'cpf') = 0, 'ALTER TABLE usuarios ADD COLUMN cpf VARCHAR(14) NULL', 'SELECT 1');
PREPARE stmt_cpf FROM @sql_cpf;
EXECUTE stmt_cpf;
DEALLOCATE PREPARE stmt_cpf;

-- Verificar e adicionar bairro se não existir
SET @sql_bairro = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'bairro') = 0, 'ALTER TABLE usuarios ADD COLUMN bairro VARCHAR(100) NULL', 'SELECT 1');
PREPARE stmt_bairro FROM @sql_bairro;
EXECUTE stmt_bairro;
DEALLOCATE PREPARE stmt_bairro;

-- Verificar e adicionar tipo se não existir
SET @sql_tipo = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'tipo') = 0, 'ALTER TABLE usuarios ADD COLUMN tipo ENUM(''visitante'', ''usuario'', ''colaborador'', ''supervisor'', ''diretor'') DEFAULT ''visitante''', 'SELECT 1');
PREPARE stmt_tipo FROM @sql_tipo;
EXECUTE stmt_tipo;
DEALLOCATE PREPARE stmt_tipo;
*/

-- Atualização de dados (se necessário):
-- UPDATE usuarios SET tipo = 'usuario' WHERE tipo IS NULL OR tipo = '';

-- RESUMO DO ESTADO ATUAL:
-- ✅ Tabela comentarios_produtos: EXISTE (6 registros)
-- ✅ Colunas na tabela usuarios: EXISTEM (cpf, bairro, tipo, tipo_usuario)
-- ✅ Sistema de comentários: FUNCIONAL
-- ✅ Verificação de compra: IMPLEMENTADA (campo compra_verificada)

-- Criar índice para performance na busca por tipo se não existir
SET @sql_idx = IF((SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND INDEX_NAME = 'idx_tipo') = 0, 'ALTER TABLE usuarios ADD INDEX idx_tipo (tipo)', 'SELECT 1');
PREPARE stmt_idx FROM @sql_idx;
EXECUTE stmt_idx;
DEALLOCATE PREPARE stmt_idx;

-- Adicionar tabela de auditoria para logs de ações (opcional)
CREATE TABLE IF NOT EXISTS log_acoes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL,
    acao VARCHAR(100) NOT NULL,
    detalhes JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_acao (acao),
    INDEX idx_data_criacao (data_criacao),
    
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
);

-- Inserir alguns comentários de exemplo (opcional)
INSERT IGNORE INTO comentarios_produtos (usuario_id, produto_id, comentario, avaliacao, compra_verificada) VALUES
(1, 1, 'Excelente produto! Superou minhas expectativas. A qualidade é excepcional e chegou rapidamente.', 5, TRUE),
(2, 1, 'Bom produto, mas poderia ter uma embalagem melhor. No geral, recomendo.', 4, TRUE),
(1, 2, 'Produto chegou com defeito, mas o atendimento foi excelente e resolveram rapidamente.', 3, TRUE),
(3, 2, 'Produto incrível! Já é a segunda vez que compro e sempre fico satisfeito.', 5, TRUE);

COMMIT;
