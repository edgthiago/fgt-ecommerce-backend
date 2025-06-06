const mysql = require('mysql2/promise');
const conexao = require('../banco/conexao');

class Pedido {
  constructor(dados) {
    this.id = dados.id;
    this.usuario_id = dados.usuario_id;
    this.endereco_entrega_id = dados.endereco_entrega_id;
    this.valor_total = dados.valor_total;
    this.valor_desconto = dados.valor_desconto || 0;
    this.valor_frete = dados.valor_frete || 0;
    this.status_pedido = dados.status_pedido || 'pendente';
    this.forma_pagamento = dados.forma_pagamento;
    this.observacoes = dados.observacoes;
    this.data_pedido = dados.data_pedido;
    this.data_atualizacao = dados.data_atualizacao;
  }

  // Criar novo pedido
  static async criar(dadosPedido) {
    try {
      console.log('📦 Criando novo pedido...');
      
      // Verificar se as tabelas existem, se não, criar
      await Pedido.garantirTabelasExistem();

      const sql = `
        INSERT INTO pedidos (
          usuario_id, 
          valor_total, 
          valor_desconto, 
          valor_frete, 
          status_pedido, 
          forma_pagamento, 
          observacoes
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      const resultado = await conexao.executarConsulta(sql, [
        dadosPedido.usuario_id,
        dadosPedido.valor_total,
        dadosPedido.valor_desconto || 0,
        dadosPedido.valor_frete || 0,
        dadosPedido.status_pedido || 'pendente',
        dadosPedido.forma_pagamento,
        dadosPedido.observacoes || ''
      ]);

      console.log('✅ Pedido criado com ID:', resultado.insertId);
      return resultado.insertId;
    } catch (erro) {
      console.error('❌ Erro ao criar pedido:', erro);
      throw new Error('Erro interno do servidor ao criar pedido');
    }
  }

  // Adicionar item ao pedido
  static async adicionarItem(pedidoId, item) {
    try {
      const sql = `
        INSERT INTO itens_pedido (
          pedido_id, 
          produto_id, 
          quantidade, 
          preco_unitario, 
          subtotal
        ) VALUES (?, ?, ?, ?, ?)
      `;

      const subtotal = item.quantidade * item.preco_unitario;
      
      await conexao.executarConsulta(sql, [
        pedidoId,
        item.produto_id,
        item.quantidade,
        item.preco_unitario,
        subtotal
      ]);

      console.log(`✅ Item adicionado ao pedido ${pedidoId}: Produto ${item.produto_id}`);
    } catch (erro) {
      console.error('❌ Erro ao adicionar item ao pedido:', erro);
      throw new Error('Erro interno do servidor ao adicionar item ao pedido');
    }
  }

  // Buscar pedido por ID
  static async buscarPorId(pedidoId) {
    try {
      const sqlPedido = `
        SELECT * FROM pedidos WHERE id = ?
      `;
      
      const pedidos = await conexao.executarConsulta(sqlPedido, [pedidoId]);
      
      if (pedidos.length === 0) {
        return null;
      }

      const sqlItens = `
        SELECT 
          ip.*,
          p.nome as produto_nome,
          p.marca as produto_marca,
          p.imagem as produto_imagem
        FROM itens_pedido ip
        INNER JOIN produtos p ON ip.produto_id = p.id
        WHERE ip.pedido_id = ?
      `;

      const itens = await conexao.executarConsulta(sqlItens, [pedidoId]);

      return {
        ...new Pedido(pedidos[0]),
        itens
      };
    } catch (erro) {
      console.error('❌ Erro ao buscar pedido:', erro);
      throw new Error('Erro interno do servidor ao buscar pedido');
    }
  }
  // Garantir que as tabelas existem
  static async garantirTabelasExistem() {
    try {
      // Criar tabela pedidos se não existir (sem foreign keys para evitar problemas)
      await conexao.executarConsulta(`
        CREATE TABLE IF NOT EXISTS pedidos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NOT NULL,
          endereco_entrega_id INT,
          valor_total DECIMAL(10, 2) NOT NULL,
          valor_desconto DECIMAL(10, 2) DEFAULT 0,
          valor_frete DECIMAL(10, 2) DEFAULT 0,
          status_pedido VARCHAR(20) DEFAULT 'pendente',
          forma_pagamento VARCHAR(50),
          observacoes TEXT,
          data_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);

      // Criar tabela itens_pedido se não existir (sem foreign keys para evitar problemas)
      await conexao.executarConsulta(`
        CREATE TABLE IF NOT EXISTS itens_pedido (
          id INT AUTO_INCREMENT PRIMARY KEY,
          pedido_id INT NOT NULL,
          produto_id INT NOT NULL,
          quantidade INT NOT NULL,
          preco_unitario DECIMAL(10, 2) NOT NULL,
          desconto_aplicado DECIMAL(10, 2) DEFAULT 0,
          subtotal DECIMAL(10, 2) NOT NULL
        )
      `);

      console.log('✅ Tabelas de pedidos verificadas/criadas');
    } catch (erro) {
      console.error('❌ Erro ao criar tabelas de pedidos:', erro);
      // Não lançar erro aqui para não quebrar o sistema
    }
  }

  // Buscar pedidos por usuário
  static async buscarPorUsuario(usuarioId, limite = 10) {
    try {
      const sql = `
        SELECT 
          p.*,
          COUNT(ip.id) as total_itens,
          SUM(ip.quantidade) as total_produtos
        FROM pedidos p
        LEFT JOIN itens_pedido ip ON p.id = ip.pedido_id
        WHERE p.usuario_id = ?
        GROUP BY p.id
        ORDER BY p.data_pedido DESC
        LIMIT ?
      `;

      const pedidos = await conexao.executarConsulta(sql, [usuarioId, limite]);
      
      return pedidos.map(pedido => new Pedido(pedido));
    } catch (erro) {
      console.error('❌ Erro ao buscar pedidos do usuário:', erro);
      throw new Error('Erro interno do servidor ao buscar pedidos');
    }
  }
}

module.exports = Pedido;
