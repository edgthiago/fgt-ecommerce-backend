-- Script para inserir dados de exemplo
-- Arquivo: inserir_dados.sql

USE projetofgt;

-- Inserir todos os produtos da sua base de dados
INSERT INTO produtos (id, marca, nome, imagem, preco_antigo, preco_atual, desconto, avaliacao, total_avaliacoes, categoria, genero, condicao, quantidade_estoque, descricao) VALUES
(1, 'Nike', 'Nike Air Max', '/tenis_produtos.png', 999.99, 499.99, 50, 4.5, 128, 'esporte', 'masculino', 'novo', 15, 'Tênis Nike Air Max com excelente amortecimento e design moderno'),
(2, 'Adidas', 'Ultraboost 22 - Masculino', '/tenis_produtos.png', 999.99, 499.99, 50, 4.0, 98, 'corrida', 'masculino', 'novo', 22, 'Tênis Adidas Ultraboost 22 para corrida com tecnologia Boost'),
(3, 'K-Swiss', 'K-Swiss V8 - Masculino', '/tenis_produtos.png', 799.99, 399.99, 50, 3.5, 42, 'casual', 'masculino', 'novo', 18, 'Tênis K-Swiss V8 com design clássico e confortável'),
(4, 'Nike', 'Revolution 5 - Masculino', '/tenis_produtos.png', 349.99, 199.99, 43, 3.0, 54, 'corrida', 'masculino', 'novo', 30, 'Tênis Nike Revolution 5 ideal para corridas leves'),
(5, 'Adidas', 'Duramo 10 - Masculino', '/tenis_produtos.png', 399.99, 249.99, 38, 3.5, 78, 'esporte', 'masculino', 'novo', 25, 'Tênis Adidas Duramo 10 para atividades esportivas'),
(6, 'Puma', 'Anzarun Lite - Masculino', '/tenis_produtos.png', 299.99, 189.99, 37, 4.0, 65, 'casual', 'masculino', 'novo', 20, 'Tênis Puma Anzarun Lite leve e confortável'),
(7, 'Nike', 'Downshifter 11 - Feminino', '/tenis_produtos.png', 379.99, 229.99, 39, 4.0, 92, 'corrida', 'feminino', 'novo', 28, 'Tênis Nike Downshifter 11 feminino para corrida'),
(8, 'Adidas', 'Grand Court - Feminino', '/tenis_produtos.png', 349.99, 229.99, 34, 4.5, 112, 'casual', 'feminino', 'novo', 35, 'Tênis Adidas Grand Court feminino estilo clássico'),
(9, 'Puma', 'Smash V2 - Unissex', '/tenis_produtos.png', 329.99, 219.99, 33, 4.0, 48, 'casual', 'unissex', 'novo', 40, 'Tênis Puma Smash V2 unissex versátil'),
(10, 'Balenciaga', 'Triple S - Unissex', '/tenis_produtos.png', 1299.99, 899.99, 31, 4.5, 24, 'casual', 'unissex', 'novo', 8, 'Tênis Balenciaga Triple S design luxuoso'),
(11, 'Nike', 'Metcon 7 - Masculino', '/tenis_produtos.png', 899.99, 599.99, 33, 5.0, 75, 'esporte', 'masculino', 'novo', 12, 'Tênis Nike Metcon 7 para treinos intensos'),
(12, 'Adidas', 'Runfalcon 2.0 - Feminino', '/tenis_produtos.png', 299.99, 199.99, 33, 3.5, 62, 'corrida', 'feminino', 'novo', 30, 'Tênis Adidas Runfalcon 2.0 feminino para corrida'),
(13, 'K-Swiss', 'Court Cheswick - Masculino', '/tenis_produtos.png', 459.99, 299.99, 35, 4.0, 36, 'casual', 'masculino', 'novo', 15, 'Tênis K-Swiss Court Cheswick estilo retrô'),
(14, 'Puma', 'Flyer Runner - Unissex', '/tenis_produtos.png', 279.99, 189.99, 32, 3.5, 58, 'corrida', 'unissex', 'novo', 25, 'Tênis Puma Flyer Runner unissex para corrida'),
(15, 'Balenciaga', 'Speed Trainer - Unissex', '/tenis_produtos.png', 1199.99, 799.99, 33, 4.5, 18, 'esporte', 'unissex', 'novo', 6, 'Tênis Balenciaga Speed Trainer alta performance'),
(16, 'Nike', 'Air Force 1 - Feminino', '/tenis_produtos.png', 799.99, 499.99, 38, 4.8, 145, 'casual', 'feminino', 'novo', 32, 'Tênis Nike Air Force 1 feminino clássico'),
(17, 'Adidas', 'Superstar - Usado', '/tenis_produtos.png', 599.99, 249.99, 58, 4.0, 32, 'casual', 'unissex', 'usado', 5, 'Tênis Adidas Superstar usado em ótimo estado'),
(18, 'New Balance', 'New Balance 574 - Feminino', '/tenis_produtos.png', 699.99, 449.99, 36, 4.7, 83, 'casual', 'feminino', 'novo', 18, 'Tênis New Balance 574 feminino confortável'),
(19, 'Asics', 'Gel-Nimbus 24 - Masculino', '/tenis_produtos.png', 899.99, 699.99, 22, 4.8, 112, 'corrida', 'masculino', 'novo', 14, 'Tênis Asics Gel-Nimbus 24 para corridas longas'),
(20, 'Puma', 'Puma RS-X - Unissex', '/tenis_produtos.png', 599.99, 379.99, 37, 4.2, 54, 'casual', 'unissex', 'novo', 22, 'Tênis Puma RS-X unissex estilo urbano'),
(21, 'Nike', 'Nike Air Force 1 Shadow - Feminino', '/tenis_produtos.png', 799.99, 599.99, 25, 4.9, 176, 'casual', 'feminino', 'novo', 28, 'Tênis Nike Air Force 1 Shadow feminino'),
(22, 'Adidas', 'Adidas Gazelle - Unissex', '/tenis_produtos.png', 499.99, 349.99, 30, 4.5, 89, 'casual', 'unissex', 'novo', 25, 'Tênis Adidas Gazelle unissex vintage'),
(23, 'Reebok', 'Reebok Classic Leather - Masculino', '/tenis_produtos.png', 449.99, 329.99, 27, 4.1, 62, 'casual', 'masculino', 'novo', 20, 'Tênis Reebok Classic Leather masculino'),
(24, 'Under Armour', 'HOVR Phantom 2 - Masculino', '/tenis_produtos.png', 849.99, 649.99, 24, 4.6, 47, 'corrida', 'masculino', 'novo', 16, 'Tênis Under Armour HOVR Phantom 2 tecnológico'),
(25, 'Vans', 'Vans Old Skool - Unissex', '/tenis_produtos.png', 399.99, 349.99, 13, 4.7, 202, 'casual', 'unissex', 'novo', 45, 'Tênis Vans Old Skool unissex clássico'),
(26, 'Converse', 'Chuck Taylor All Star - Unissex', '/tenis_produtos.png', 349.99, 299.99, 14, 4.8, 243, 'casual', 'unissex', 'novo', 50, 'Tênis Converse Chuck Taylor All Star icônico'),
(27, 'Mizuno', 'Wave Rider 25 - Feminino', '/tenis_produtos.png', 879.99, 679.99, 23, 4.4, 58, 'corrida', 'feminino', 'novo', 12, 'Tênis Mizuno Wave Rider 25 feminino'),
(28, 'Fila', 'Fila Disruptor II - Feminino', '/tenis_produtos.png', 499.99, 399.99, 20, 4.2, 137, 'casual', 'feminino', 'novo', 30, 'Tênis Fila Disruptor II feminino chunky'),
(29, 'Saucony', 'Saucony Ride 14 - Masculino', '/tenis_produtos.png', 799.99, 599.99, 25, 4.6, 42, 'corrida', 'masculino', 'novo', 18, 'Tênis Saucony Ride 14 masculino para corrida'),
(30, 'New Balance', 'New Balance 990v5 - Unissex', '/tenis_produtos.png', 999.99, 849.99, 15, 4.9, 76, 'corrida', 'unissex', 'novo', 10, 'Tênis New Balance 990v5 unissex premium'),
(31, 'Nike', 'Nike Dunk Low - Usado', '/tenis_produtos.png', 799.99, 399.99, 50, 4.0, 18, 'casual', 'unissex', 'usado', 3, 'Tênis Nike Dunk Low usado em bom estado'),
(32, 'Adidas', 'Adidas NMD R1 - Masculino', '/tenis_produtos.png', 899.99, 699.99, 22, 4.7, 92, 'casual', 'masculino', 'novo', 15, 'Tênis Adidas NMD R1 masculino moderno'),
(33, 'Puma', 'Puma Future Rider - Feminino', '/tenis_produtos.png', 549.99, 429.99, 22, 4.3, 56, 'casual', 'feminino', 'novo', 20, 'Tênis Puma Future Rider feminino estiloso'),
(34, 'Asics', 'Asics Gel-Kayano 28 - Feminino', '/tenis_produtos.png', 999.99, 799.99, 20, 4.8, 64, 'corrida', 'feminino', 'novo', 12, 'Tênis Asics Gel-Kayano 28 feminino estabilidade'),
(35, 'Nike', 'Nike Pegasus 38 - Unissex', '/tenis_produtos.png', 749.99, 599.99, 20, 4.6, 87, 'corrida', 'unissex', 'novo', 25, 'Tênis Nike Pegasus 38 unissex versátil'),
(36, 'Reebok', 'Reebok Nano X1 - Masculino', '/tenis_produtos.png', 699.99, 499.99, 29, 4.4, 43, 'treino', 'masculino', 'novo', 18, 'Tênis Reebok Nano X1 masculino crossfit'),
(37, 'Hoka', 'Hoka Clifton 8 - Feminino', '/tenis_produtos.png', 849.99, 749.99, 12, 4.7, 39, 'corrida', 'feminino', 'novo', 14, 'Tênis Hoka Clifton 8 feminino maximalista'),
(38, 'Adidas', 'Adidas Stan Smith - Usado', '/tenis_produtos.png', 549.99, 279.99, 49, 3.9, 23, 'casual', 'unissex', 'usado', 4, 'Tênis Adidas Stan Smith usado clássico'),
(39, 'Vans', 'Vans Sk8-Hi - Unissex', '/tenis_produtos.png', 499.99, 429.99, 14, 4.6, 118, 'casual', 'unissex', 'novo', 35, 'Tênis Vans Sk8-Hi unissex cano alto'),
(40, 'Nike', 'Nike Air Jordan 1 Low - Masculino', '/tenis_produtos.png', 899.99, 799.99, 11, 4.8, 167, 'casual', 'masculino', 'novo', 20, 'Tênis Nike Air Jordan 1 Low masculino icônico'),
(41, 'Under Armour', 'Under Armour Project Rock 4 - Masculino', '/tenis_produtos.png', 899.99, 749.99, 17, 4.5, 31, 'treino', 'masculino', 'novo', 12, 'Tênis Under Armour Project Rock 4 treino'),
(42, 'New Balance', 'New Balance Fresh Foam 1080v11 - Feminino', '/tenis_produtos.png', 899.99, 749.99, 17, 4.7, 54, 'corrida', 'feminino', 'novo', 16, 'Tênis New Balance Fresh Foam 1080v11 feminino'),
(43, 'Puma', 'Puma Classic XXI - Unissex', '/tenis_produtos.png', 399.99, 349.99, 13, 4.4, 78, 'casual', 'unissex', 'novo', 28, 'Tênis Puma Classic XXI unissex retro'),
(44, 'Asics', 'Asics GT-2000 10 - Masculino', '/tenis_produtos.png', 799.99, 649.99, 19, 4.5, 47, 'corrida', 'masculino', 'novo', 22, 'Tênis Asics GT-2000 10 masculino estável'),
(45, 'Converse', 'Converse Chuck 70 - Unissex', '/tenis_produtos.png', 499.99, 429.99, 14, 4.8, 91, 'casual', 'unissex', 'novo', 30, 'Tênis Converse Chuck 70 unissex premium');

-- Inserir usuários de exemplo com senhas hash para "123456"
INSERT INTO usuarios (nome, email, senha_hash, tipo_usuario, status, aceite_lgpd, data_aceite_lgpd, telefone) VALUES
('João Silva', 'joao@email.com', '$2b$12$LQv3c1yqBwlVHpPjrCeyeOuKHIVXA7ggNMXPdcT6XN8X4gZ5rF3qK', 'usuario', 'ativo', 1, NOW(), '(85) 99999-1111'),
('Ethan Rafael', 'ethan@loja.com', '$2b$12$LQv3c1yqBwlVHpPjrCeyeOuKHIVXA7ggNMXPdcT6XN8X4gZ5rF3qK', 'colaborador', 'ativo', 1, NOW(), '(85) 88888-2222'),
('Tamiles Supervisora', 'tamiles@loja.com', '$2b$12$LQv3c1yqBwlVHpPjrCeyeOuKHIVXA7ggNMXPdcT6XN8X4gZ5rF3qK', 'supervisor', 'ativo', 1, NOW(), '(85) 77777-3333'),
('Thiago Diretor', 'thiago@loja.com', '$2b$12$LQv3c1yqBwlVHpPjrCeyeOuKHIVXA7ggNMXPdcT6XN8X4gZ5rF3qK', 'diretor', 'ativo', 1, NOW(), '(85) 66666-4444'),
('Dionizio Cliente', 'dionizio@cliente.com', '$2b$12$LQv3c1yqBwlVHpPjrCeyeOuKHIVXA7ggNMXPdcT6XN8X4gZ5rF3qK', 'usuario', 'ativo', 1, NOW(), '(85) 55555-5555');

-- Inserir endereços de exemplo
INSERT INTO enderecos_usuarios (usuario_id, tipo, cep, rua, numero, bairro, cidade, estado, eh_principal) VALUES
(1, 'residencial', '01234-567', 'Rua Deus me livre', '123', 'Pirambu', 'Fortaleza', 'CE', 1),
(1, 'comercial', '01234-890', 'Rua do Queijo', '456', 'Cidade Jardim', 'Fortaleza', 'CE', 0),
(5, 'residencial', '12345-678', 'Rua já morreu', '789', 'Bom Jardim', 'Fortaleza', 'CE', 1);

-- Inserir algumas promoções relâmpago de exemplo
INSERT INTO promocoes_relampago (nome, produto_id, desconto_percentual, preco_promocional, data_inicio, data_fim, quantidade_limite, criado_por, ativo) VALUES
('Promoção Nike Air Max', 1, 60, 399.99, NOW(), DATE_ADD(NOW(), INTERVAL 24 HOUR), 10, 3, 1),
('Oferta Adidas Ultraboost', 2, 55, 449.99, NOW(), DATE_ADD(NOW(), INTERVAL 48 HOUR), 15, 3, 1),
('Desconto Vans Old Skool', 25, 25, 299.99, NOW(), DATE_ADD(NOW(), INTERVAL 72 HOUR), 20, 3, 1);

-- Inserir itens no carrinho de exemplo
INSERT INTO carrinho (usuario_id, produto_id, quantidade, preco_unitario) VALUES
(1, 1, 1, 499.99),
(1, 25, 2, 349.99),
(5, 16, 1, 499.99),
(5, 26, 1, 299.99);

-- Inserir algumas avaliações de exemplo
INSERT INTO avaliacoes_produtos (produto_id, usuario_id, nota, comentario, aprovado) VALUES
(1, 1, 5, 'Excelente tênis, muito confortável!', 1),
(1, 5, 4, 'Bom produto, recomendo.', 1),
(25, 1, 5, 'Vans clássico, sempre uma boa escolha.', 1),
(26, 5, 5, 'Converse All Star nunca decepciona!', 1);

-- Inserir consentimentos LGPD de exemplo
INSERT INTO consentimentos_lgpd (usuario_id, tipo_consentimento, consentimento_dado, ip_usuario) VALUES
(1, 'cookies', 1, '192.168.1.100'),
(1, 'marketing', 1, '192.168.1.100'),
(1, 'analytics', 1, '192.168.1.100'),
(5, 'cookies', 1, '192.168.1.101'),
(5, 'marketing', 0, '192.168.1.101');
