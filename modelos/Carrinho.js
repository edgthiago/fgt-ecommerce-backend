const mysql = require('mysql2/promise');
const conexao = require('../banco/conexao');
const Produto = require('./Produto');
const Pedido = require('./Pedido');

class Carrinho {  constructor(dados) {
    this.id = dados.id;
    this.usuario_id = dados.usuario_id;
    this.produto_id = dados.produto_id;
    this.quantidade = dados.quantidade;
    this.tamanho = dados.tamanho;
    this.cor = dados.cor;
    this.preco_unitario = dados.preco_unitario;
    this.data_adicionado = dados.data_adicionado;
  }
  // Buscar itens do carrinho por usuário
  static async buscarPorUsuario(usuarioId) {
    try {
      console.log('🔍 Buscando carrinho para usuário ID:', usuarioId);
        const sql = `
        SELECT 
          c.*,
          p.nome as produto_nome,
          p.marca as produto_marca,
          p.imagem as produto_imagem,
          p.preco_atual as produto_preco_atual,
          p.quantidade_estoque as produto_estoque
        FROM carrinho c
        INNER JOIN produtos p ON c.produto_id = p.id
        WHERE c.usuario_id = ?
        ORDER BY c.data_adicionado DESC
      `;

      console.log('🔍 Executando SQL:', sql);
      const resultados = await conexao.executarConsulta(sql, [usuarioId]);
      console.log('🔍 Resultados encontrados:', resultados.length);
      
      return resultados.map(item => ({
        ...new Carrinho(item),
        produto: {
          nome: item.produto_nome,
          marca: item.produto_marca,
          imagem: item.produto_imagem,
          preco_atual: item.produto_preco_atual,
          estoque: item.produto_estoque
        }
      }));
    } catch (erro) {
      console.error('❌ Erro ao buscar carrinho do usuário:', erro);
      throw new Error('Erro interno do servidor ao buscar carrinho');
    }
  }  // Buscar item específico do carrinho
  static async buscarItem(usuarioId, produtoId, tamanho, cor) {
    try {
      const resultados = await conexao.executarConsulta(`
        SELECT * FROM carrinho 
        WHERE usuario_id = ? AND produto_id = ? AND tamanho = ? AND cor = ?
      `, [usuarioId, produtoId, tamanho, cor]);
      
      if (resultados.length === 0) {
        return null;
      }
      
      return new Carrinho(resultados[0]);
    } catch (erro) {
      console.error('Erro ao buscar item do carrinho:', erro);
      throw new Error('Erro interno do servidor ao buscar item do carrinho');
    }
  }

  // Adicionar item ao carrinho
  static async adicionarItem(dadosItem) {
    try {
      // Verificar se o produto existe e tem estoque
      const produto = await Produto.buscarPorId(dadosItem.produto_id);
      if (!produto) {
        throw new Error('Produto não encontrado');
      }

      if (produto.estoque < dadosItem.quantidade) {
        throw new Error('Estoque insuficiente');
      }

      // Verificar se já existe o mesmo item no carrinho
      const itemExistente = await Carrinho.buscarItem(
        dadosItem.usuario_id,
        dadosItem.produto_id,
        dadosItem.tamanho,
        dadosItem.cor
      );

      if (itemExistente) {
        // Atualizar quantidade do item existente
        const novaQuantidade = itemExistente.quantidade + dadosItem.quantidade;
        
        if (produto.estoque < novaQuantidade) {
          throw new Error('Estoque insuficiente para essa quantidade');
        }

        return await itemExistente.atualizarQuantidade(novaQuantidade);      } else {
        // Criar novo item no carrinho
        const sql = `
          INSERT INTO carrinho (
            usuario_id, produto_id, quantidade, tamanho, cor, preco_unitario
          ) VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        const parametros = [
          dadosItem.usuario_id,
          dadosItem.produto_id,
          dadosItem.quantidade,
          dadosItem.tamanho,
          dadosItem.cor,
          produto.preco_atual
        ];

        const resultado = await conexao.executarConsulta(sql, parametros);
        
        // Buscar o item criado
        const itemCriado = await conexao.executarConsulta(
          'SELECT * FROM carrinho WHERE id = ?',
          [resultado.insertId]
        );
        
        return new Carrinho(itemCriado[0]);
      }
    } catch (erro) {
      console.error('Erro ao adicionar item ao carrinho:', erro);
      throw erro;
    }
  }

  // Atualizar quantidade do item
  async atualizarQuantidade(novaQuantidade) {
    try {
      if (novaQuantidade <= 0) {
        throw new Error('Quantidade deve ser maior que zero');
      }

      // Verificar estoque disponível
      const produto = await Produto.buscarPorId(this.produto_id);
      if (produto.estoque < novaQuantidade) {
        throw new Error('Estoque insuficiente');
      }

      await conexao.executarConsulta(`
        UPDATE carrinho        SET quantidade = ? 
        WHERE id = ?
      `, [novaQuantidade, this.id]);

      this.quantidade = novaQuantidade;
      return this;
    } catch (erro) {
      console.error('Erro ao atualizar quantidade do item:', erro);
      throw erro;
    }
  }

  // Remover item do carrinho
  async remover() {
    try {
      await conexao.executarConsulta('DELETE FROM carrinho WHERE id = ?', [this.id]);
      return true;
    } catch (erro) {
      console.error('Erro ao remover item do carrinho:', erro);
      throw new Error('Erro interno do servidor ao remover item do carrinho');
    }
  }

  // Remover todos os itens do carrinho do usuário
  static async limparCarrinho(usuarioId) {
    try {
      await conexao.executarConsulta('DELETE FROM carrinho WHERE usuario_id = ?', [usuarioId]);
      return true;
    } catch (erro) {
      console.error('Erro ao limpar carrinho:', erro);
      throw new Error('Erro interno do servidor ao limpar carrinho');
    }
  }

  // Calcular total do carrinho
  static async calcularTotal(usuarioId) {
    try {
      const resultado = await conexao.executarConsulta(`
        SELECT 
          SUM(quantidade * preco_unitario) as total,
          COUNT(*) as total_itens,
          SUM(quantidade) as total_produtos
        FROM carrinho 
        WHERE usuario_id = ?
      `, [usuarioId]);

      return {
        valor_total: resultado[0].total || 0,
        total_itens_distintos: resultado[0].total_itens || 0,
        total_produtos: resultado[0].total_produtos || 0
      };
    } catch (erro) {
      console.error('Erro ao calcular total do carrinho:', erro);
      throw new Error('Erro interno do servidor ao calcular total do carrinho');
    }
  }

  // Validar carrinho antes da compra
  static async validarCarrinho(usuarioId) {
    try {
      const itens = await Carrinho.buscarPorUsuario(usuarioId);
      const erros = [];

      for (const item of itens) {
        const produto = await Produto.buscarPorId(item.produto_id);
        
        if (!produto) {
          erros.push(`Produto "${item.produto.nome}" não está mais disponível`);
          continue;
        }

        if (produto.estoque < item.quantidade) {
          erros.push(`Estoque insuficiente para "${produto.nome}". Disponível: ${produto.estoque}, Solicitado: ${item.quantidade}`);
        }

        // Verificar se o preço não mudou significativamente (mais de 10%)
        const diferencaPreco = Math.abs(produto.preco_atual - item.preco_unitario) / item.preco_unitario;
        if (diferencaPreco > 0.1) {
          erros.push(`Preço do produto "${produto.nome}" foi alterado. Novo preço: R$ ${produto.preco_atual.toFixed(2)}`);
        }
      }

      return {
        valido: erros.length === 0,
        erros: erros,
        itens: itens
      };
    } catch (erro) {
      console.error('Erro ao validar carrinho:', erro);
      throw new Error('Erro interno do servidor ao validar carrinho');
    }
  }

  // Atualizar preços dos itens do carrinho
  static async atualizarPrecos(usuarioId) {
    try {
      const sql = `
        UPDATE carrinho c
        INNER JOIN produtos p ON c.produto_id = p.id        SET c.preco_unitario = p.preco_atual
        WHERE c.usuario_id = ?
      `;

      await conexao.executarConsulta(sql, [usuarioId]);
      return true;
    } catch (erro) {
      console.error('Erro ao atualizar preços do carrinho:', erro);
      throw new Error('Erro interno do servidor ao atualizar preços do carrinho');
    }
  }  // Converter carrinho em pedido - Implementação funcional
  static async finalizarCompra(usuarioId, dadosPagamento = {}) {
    try {
      console.log('🛒 Iniciando finalização de compra para usuário:', usuarioId);
      
      // Validar carrinho
      const validacao = await Carrinho.validarCarrinho(usuarioId);
      if (!validacao.valido) {
        throw new Error(`Erro na validação do carrinho: ${validacao.erros.join(', ')}`);
      }

      if (validacao.itens.length === 0) {
        throw new Error('Carrinho vazio');
      }

      // Calcular total
      const total = await Carrinho.calcularTotal(usuarioId);
      
      const valorDesconto = dadosPagamento.desconto || 0;
      const valorFrete = dadosPagamento.frete || 0;
      const valorTotal = total.valor_total + valorFrete - valorDesconto;      // Gerar ID único para o pedido
      const pedidoId = `PED-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      // Preparar dados dos itens para JSON
      const itensParaSalvar = validacao.itens.map(item => ({
        produto_id: item.produto_id,
        produto_nome: item.produto.nome,
        produto_marca: item.produto.marca,
        quantidade: item.quantidade,
        tamanho: item.tamanho,
        cor: item.cor,
        preco_unitario: item.preco_unitario,
        subtotal: item.quantidade * item.preco_unitario
      }));

      // Salvar pedido
      await conexao.executarConsulta(`
        INSERT INTO pedidos_simples (
          id, usuario_id, valor_total, valor_desconto, valor_frete,
          forma_pagamento, observacoes, status_pedido, itens_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        pedidoId,
        usuarioId,
        valorTotal,
        valorDesconto,
        valorFrete,
        dadosPagamento.metodo_pagamento || 'cartao_credito',
        dadosPagamento.observacoes || '',
        'confirmado',
        JSON.stringify(itensParaSalvar)
      ]);

      // Reduzir estoque dos produtos
      for (const item of validacao.itens) {
        try {
          const produto = await Produto.buscarPorId(item.produto_id);
          if (produto && produto.reduzirEstoque) {
            await produto.reduzirEstoque(item.quantidade);
          } else {
            // Reduzir estoque manualmente se o método não existir
            await conexao.executarConsulta(`
              UPDATE produtos 
              SET quantidade_estoque = quantidade_estoque - ? 
              WHERE id = ? AND quantidade_estoque >= ?
            `, [item.quantidade, item.produto_id, item.quantidade]);
          }
        } catch (erroEstoque) {
          console.warn('⚠️ Erro ao reduzir estoque do produto', item.produto_id, ':', erroEstoque.message);
        }
      }

      // Limpar carrinho
      await Carrinho.limparCarrinho(usuarioId);

      console.log('✅ Compra finalizada com sucesso. Pedido ID:', pedidoId);

      return {
        id: pedidoId,
        usuario_id: usuarioId,
        valor_total: valorTotal,
        valor_desconto: valorDesconto,
        valor_frete: valorFrete,
        status: 'confirmado',
        forma_pagamento: dadosPagamento.metodo_pagamento || 'cartao_credito',
        observacoes: dadosPagamento.observacoes || '',
        data_pedido: new Date().toISOString(),
        total_itens: validacao.itens.length,
        total_produtos: validacao.itens.reduce((acc, item) => acc + item.quantidade, 0),
        itens: itensParaSalvar
      };
    } catch (erro) {
      console.error('❌ Erro ao finalizar compra:', erro);
      throw erro;
    }
  }

  // Obter estatísticas do carrinho
  static async obterEstatisticas() {
    try {
      const carrinhoAtivos = await conexao.executarConsulta(`
        SELECT COUNT(DISTINCT usuario_id) as carrinho_ativos 
        FROM carrinho
      `);
      
      const itensTotal = await conexao.executarConsulta(`
        SELECT 
          COUNT(*) as total_itens,
          SUM(quantidade) as total_produtos,
          AVG(quantidade * preco_unitario) as valor_medio
        FROM carrinho
      `);

      const produtosMaisAdicionados = await conexao.executarConsulta(`
        SELECT 
          p.nome,
          p.marca,
          COUNT(*) as vezes_adicionado,
          SUM(c.quantidade) as total_quantidade
        FROM carrinho c
        INNER JOIN produtos p ON c.produto_id = p.id
        GROUP BY c.produto_id, p.nome, p.marca
        ORDER BY vezes_adicionado DESC
        LIMIT 10
      `);
      
      return {
        carrinho_ativos: carrinhoAtivos[0].carrinho_ativos,
        total_itens: itensTotal[0].total_itens || 0,
        total_produtos: itensTotal[0].total_produtos || 0,
        valor_medio_carrinho: itensTotal[0].valor_medio || 0,
        produtos_mais_adicionados: produtosMaisAdicionados
      };
    } catch (erro) {
      console.error('Erro ao obter estatísticas do carrinho:', erro);
      throw new Error('Erro interno do servidor ao obter estatísticas');
    }
  }
}

module.exports = Carrinho;
