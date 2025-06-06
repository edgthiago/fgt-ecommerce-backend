const conexao = require('../banco/conexao');

class Comentario {
  constructor(dados) {
    this.usuario_id = dados.usuario_id;
    this.produto_id = dados.produto_id;
    this.comentario = dados.comentario;
    this.avaliacao = dados.avaliacao;
    this.compra_verificada = dados.compra_verificada || false;
  }
  // Criar novo comentário
  static async criar(dadosComentario) {
    try {
      const query = `
        INSERT INTO comentarios_produtos 
        (usuario_id, produto_id, comentario, avaliacao, compra_verificada, data_criacao)
        VALUES (?, ?, ?, ?, ?, NOW())
      `;
      
      const resultado = await conexao.executarConsulta(query, [
        dadosComentario.usuario_id,
        dadosComentario.produto_id,
        dadosComentario.comentario,
        dadosComentario.avaliacao,
        dadosComentario.compra_verificada
      ]);

      return {
        sucesso: true,
        id: resultado.insertId,
        mensagem: 'Comentário criado com sucesso'
      };
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      return {
        sucesso: false,
        mensagem: 'Erro ao criar comentário'
      };
    }
  }

  // Buscar comentários por produto
  static async buscarPorProduto(produtoId) {
    try {
      const query = `
        SELECT 
          c.*,
          u.nome as usuario_nome,
          u.email as usuario_email
        FROM comentarios_produtos c
        INNER JOIN usuarios u ON c.usuario_id = u.id
        WHERE c.produto_id = ?
        ORDER BY c.data_criacao DESC      `;
      
      const comentarios = await conexao.executarConsulta(query, [produtoId]);
      
      return {
        sucesso: true,
        dados: comentarios
      };
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
      return {
        sucesso: false,
        mensagem: 'Erro ao buscar comentários'
      };
    }
  }  // Verificar se usuário pode comentar (comprou o produto)
  static async podeAvaliar(usuarioId, produtoId) {
    try {
      // Primeiro verificar na tabela pedidos tradicional
      const queryPedidos = `
        SELECT COUNT(*) as total
        FROM pedidos p
        INNER JOIN itens_pedido ip ON p.id = ip.pedido_id
        WHERE p.usuario_id = ? 
        AND ip.produto_id = ?
        AND p.status_pedido IN ('confirmado', 'preparando', 'enviado', 'entregue')
      `;
      
      const resultadoPedidos = await conexao.executarConsulta(queryPedidos, [usuarioId, produtoId]);
      
      // Se encontrou na tabela tradicional, pode avaliar
      if (resultadoPedidos[0].total > 0) {
        return {
          sucesso: true,
          podeAvaliar: true
        };
      }      // Se não encontrou, verificar na tabela pedidos_simples
      console.log(`🔍 [Modelo] Verificando pedidos_simples para usuário ${usuarioId}, produto ${produtoId}`);
      const queryPedidosSimples = `
        SELECT COUNT(*) as total
        FROM pedidos_simples ps
        WHERE ps.usuario_id = ? 
        AND JSON_CONTAINS(ps.itens_json, JSON_OBJECT('produto_id', ?), '$')
        AND ps.status_pedido IN ('confirmado', 'preparando', 'enviado', 'entregue', 'concluido')
      `;
      
      console.log(`🔍 [Modelo] Query: ${queryPedidosSimples}`);
      console.log(`🔍 [Modelo] Parâmetros: [${usuarioId}, ${produtoId}]`);
      
      const resultadoPedidosSimples = await conexao.executarConsulta(queryPedidosSimples, [usuarioId, produtoId]);
      console.log(`🔍 [Modelo] Resultado da query:`, resultadoPedidosSimples);
      
      const podeAvaliar = resultadoPedidosSimples[0].total > 0;
      console.log(`🔍 [Modelo] Pode avaliar: ${podeAvaliar} (total: ${resultadoPedidosSimples[0].total})`);
      
      return {
        sucesso: true,
        podeAvaliar: podeAvaliar
      };
    } catch (error) {
      console.error('Erro ao verificar permissão de avaliação:', error);
      return {
        sucesso: false,
        podeAvaliar: false
      };
    }
  }

  // Verificar se usuário já comentou o produto
  static async jaComentou(usuarioId, produtoId) {
    try {
      const query = `
        SELECT COUNT(*) as total
        FROM comentarios_produtos
        WHERE usuario_id = ? AND produto_id = ?      `;
      
      const resultado = await conexao.executarConsulta(query, [usuarioId, produtoId]);
      
      return {
        sucesso: true,
        jaComentou: resultado[0].total > 0
      };
    } catch (error) {
      console.error('Erro ao verificar comentário existente:', error);
      return {
        sucesso: false,
        jaComentou: false
      };
    }
  }

  // Calcular estatísticas de avaliação por produto
  static async estatisticasAvaliacao(produtoId) {
    try {
      const query = `
        SELECT 
          AVG(avaliacao) as media_avaliacao,
          COUNT(*) as total_avaliacoes,
          SUM(CASE WHEN avaliacao = 5 THEN 1 ELSE 0 END) as cinco_estrelas,
          SUM(CASE WHEN avaliacao = 4 THEN 1 ELSE 0 END) as quatro_estrelas,
          SUM(CASE WHEN avaliacao = 3 THEN 1 ELSE 0 END) as tres_estrelas,
          SUM(CASE WHEN avaliacao = 2 THEN 1 ELSE 0 END) as duas_estrelas,
          SUM(CASE WHEN avaliacao = 1 THEN 1 ELSE 0 END) as uma_estrela
        FROM comentarios_produtos        WHERE produto_id = ?
      `;
      
      const resultado = await conexao.executarConsulta(query, [produtoId]);
      
      return {
        sucesso: true,
        dados: resultado[0]
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      return {
        sucesso: false,
        mensagem: 'Erro ao calcular estatísticas'
      };
    }
  }
}

module.exports = Comentario;
