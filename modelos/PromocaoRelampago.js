const mysql = require('mysql2/promise');
const conexao = require('../banco/conexao');
const Produto = require('./Produto');

class PromocaoRelampago {  constructor(dados) {
    this.id = dados.id;
    this.nome = dados.nome;
    this.produto_id = dados.produto_id;
    this.desconto_percentual = dados.desconto_percentual;
    this.preco_promocional = dados.preco_promocional;
    this.quantidade_limite = dados.quantidade_limite;
    this.quantidade_vendida = dados.quantidade_vendida;
    this.data_inicio = dados.data_inicio;
    this.data_fim = dados.data_fim;
    this.ativo = dados.ativo;
    this.criado_por = dados.criado_por;
    this.data_criacao = dados.data_criacao;
  }

  // Buscar todas as promoções
  static async buscarTodas(filtros = {}) {
    try {
      let sql = `
        SELECT 
          pr.*,
          p.nome as produto_nome,
          p.marca as produto_marca,
          p.imagem as produto_imagem,
          p.preco_atual as produto_preco_original,
          u.nome as criador_nome
        FROM promocoes_relampago pr
        INNER JOIN produtos p ON pr.produto_id = p.id
        LEFT JOIN usuarios u ON pr.criado_por = u.id
        WHERE 1=1
      `;
      const parametros = [];      // Filtro por status ativo
      if (filtros.apenas_ativas) {
        sql += ` AND pr.ativo = 1 AND pr.data_inicio <= NOW() AND pr.data_fim >= NOW()`;
      }

      // Filtro por visibilidade (removido pois coluna não existe)
      if (filtros.apenas_visiveis) {
        // Coluna visivel não existe na tabela, removendo este filtro
        console.log('Aviso: Filtro apenas_visiveis ignorado - coluna não existe na tabela');
      }

      // Filtro por produto
      if (filtros.produto_id) {
        sql += ` AND pr.produto_id = ?`;
        parametros.push(filtros.produto_id);
      }

      // Filtro por período
      if (filtros.data_inicio) {
        sql += ` AND pr.data_fim >= ?`;
        parametros.push(filtros.data_inicio);
      }

      if (filtros.data_fim) {
        sql += ` AND pr.data_inicio <= ?`;
        parametros.push(filtros.data_fim);
      }

      sql += ` ORDER BY pr.data_criacao DESC`;

      // Paginação
      if (filtros.limite) {
        sql += ` LIMIT ?`;
        parametros.push(parseInt(filtros.limite));
        
        if (filtros.offset) {
          sql += ` OFFSET ?`;
          parametros.push(parseInt(filtros.offset));
        }
      }

      const resultados = await conexao.executarConsulta(sql, parametros);
      
      return resultados.map(promocao => ({
        ...new PromocaoRelampago(promocao),
        produto: {
          nome: promocao.produto_nome,
          marca: promocao.produto_marca,
          imagem: promocao.produto_imagem,
          preco_original: promocao.produto_preco_original
        },
        criador_nome: promocao.criador_nome
      }));
    } catch (erro) {
      console.error('Erro ao buscar promoções:', erro);
      throw new Error('Erro interno do servidor ao buscar promoções');
    }
  }

  // Buscar promoção por ID
  static async buscarPorId(id) {
    try {      const resultados = await conexao.executarConsulta(`        SELECT 
          pr.*,
          p.nome as produto_nome,
          p.marca as produto_marca,
          p.imagem as produto_imagem,
          p.preco_atual as produto_preco_original,
          p.quantidade_estoque as produto_estoque,
          u.nome as criador_nome
        FROM promocoes_relampago pr
        INNER JOIN produtos p ON pr.produto_id = p.id
        LEFT JOIN usuarios u ON pr.criado_por = u.id
        WHERE pr.id = ?
      `, [id]);
      
      if (resultados.length === 0) {
        return null;
      }
      
      const promocao = resultados[0];
      return {
        ...new PromocaoRelampago(promocao),
        produto: {
          nome: promocao.produto_nome,
          marca: promocao.produto_marca,
          imagem: promocao.produto_imagem,
          preco_original: promocao.produto_preco_original,
          estoque: promocao.produto_estoque
        },
        criador_nome: promocao.criador_nome
      };
    } catch (erro) {
      console.error('Erro ao buscar promoção por ID:', erro);
      throw new Error('Erro interno do servidor ao buscar promoção');
    }
  }

  // Buscar promoções ativas
  static async buscarAtivas() {
    try {
      return await PromocaoRelampago.buscarTodas({
        apenas_ativas: true,
        apenas_visiveis: true
      });
    } catch (erro) {
      console.error('Erro ao buscar promoções ativas:', erro);
      throw new Error('Erro interno do servidor ao buscar promoções ativas');
    }
  }

  // Criar nova promoção
  static async criar(dadosPromocao, criadoPor) {
    try {
      // Verificar se o produto existe
      const produto = await Produto.buscarPorId(dadosPromocao.produto_id);
      if (!produto) {
        throw new Error('Produto não encontrado');
      }

      // Verificar se já existe promoção ativa para este produto
      const promocaoExistente = await PromocaoRelampago.buscarTodas({
        produto_id: dadosPromocao.produto_id,
        apenas_ativas: true
      });

      if (promocaoExistente.length > 0) {
        throw new Error('Já existe uma promoção ativa para este produto');
      }

      // Calcular preço promocional se não fornecido
      let precoPromocional = dadosPromocao.preco_promocional;
      if (!precoPromocional && dadosPromocao.desconto_percentual) {
        precoPromocional = produto.preco_atual * (1 - dadosPromocao.desconto_percentual / 100);
      }

      // Calcular desconto percentual se não fornecido
      let descontoPercentual = dadosPromocao.desconto_percentual;
      if (!descontoPercentual && precoPromocional) {
        descontoPercentual = ((produto.preco_atual - precoPromocional) / produto.preco_atual) * 100;
      }      const sql = `
        INSERT INTO promocoes_relampago (
          nome, produto_id, desconto_percentual, preco_promocional,
          quantidade_limite, data_inicio, data_fim, ativo, criado_por
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const parametros = [
        dadosPromocao.nome,
        dadosPromocao.produto_id,
        descontoPercentual,
        precoPromocional,
        dadosPromocao.quantidade_limite || produto.estoque,
        dadosPromocao.data_inicio,
        dadosPromocao.data_fim,
        dadosPromocao.ativo !== false, // true por padrão
        criadoPor
      ];

      const resultado = await conexao.executarConsulta(sql, parametros);
      return await PromocaoRelampago.buscarPorId(resultado.insertId);
    } catch (erro) {
      console.error('Erro ao criar promoção:', erro);
      throw erro;
    }
  }

  // Atualizar promoção
  async atualizar(dadosAtualizacao) {
    try {
      const campos = [];
      const parametros = [];      // Campos que podem ser atualizados
      const camposPermitidos = [
        'nome', 'desconto_percentual', 'preco_promocional',
        'quantidade_limite', 'data_inicio', 'data_fim', 'ativo'
      ];

      camposPermitidos.forEach(campo => {
        if (dadosAtualizacao[campo] !== undefined) {
          campos.push(`${campo} = ?`);
          parametros.push(dadosAtualizacao[campo]);
        }
      });

      if (campos.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      parametros.push(this.id);

      const sql = `
        UPDATE promocoes_relampago 
        SET ${campos.join(', ')}
        WHERE id = ?
      `;

      await conexao.executarConsulta(sql, parametros);
      return await PromocaoRelampago.buscarPorId(this.id);
    } catch (erro) {
      console.error('Erro ao atualizar promoção:', erro);
      throw new Error('Erro interno do servidor ao atualizar promoção');
    }
  }

  // Ativar/desativar promoção
  async alterarStatus(ativa) {
    try {
      await conexao.executarConsulta(
        'UPDATE promocoes_relampago SET ativo = ? WHERE id = ?',
        [ativa, this.id]
      );

      this.ativo = ativa;
      return this;
    } catch (erro) {
      console.error('Erro ao alterar status da promoção:', erro);
      throw new Error('Erro interno do servidor ao alterar status da promoção');
    }
  }

  // Verificar se promoção está vigente
  estaVigente() {
    const agora = new Date();
    const inicio = new Date(this.data_inicio);
    const fim = new Date(this.data_fim);
    
    return this.ativo && agora >= inicio && agora <= fim;
  }
  // Verificar se promoção tem estoque disponível
  temEstoqueDisponivel() {
    return (this.quantidade_limite - this.quantidade_vendida) > 0;
  }

  // Registrar venda na promoção
  async registrarVenda(quantidade = 1) {
    try {
      if (!this.estaVigente()) {
        throw new Error('Promoção não está vigente');
      }

      if (!this.temEstoqueDisponivel()) {
        throw new Error('Estoque da promoção esgotado');
      }      if ((this.quantidade_vendida + quantidade) > this.quantidade_limite) {
        throw new Error('Quantidade solicitada excede estoque disponível da promoção');
      }

      const novaQuantidadeVendida = this.quantidade_vendida + quantidade;
      
      await conexao.executarConsulta(
        'UPDATE promocoes_relampago SET quantidade_vendida = ? WHERE id = ?',
        [novaQuantidadeVendida, this.id]
      );

      this.quantidade_vendida = novaQuantidadeVendida;      // Se esgotou o estoque, desativar automaticamente
      if (this.quantidade_vendida >= this.quantidade_limite) {
        await this.alterarStatus(false);
      }

      return this;
    } catch (erro) {
      console.error('Erro ao registrar venda da promoção:', erro);
      throw erro;
    }
  }

  // Deletar promoção
  async deletar() {
    try {
      await conexao.executarConsulta('DELETE FROM promocoes_relampago WHERE id = ?', [this.id]);
      return true;
    } catch (erro) {
      console.error('Erro ao deletar promoção:', erro);
      throw new Error('Erro interno do servidor ao deletar promoção');
    }
  }

  // Buscar promoções que estão prestes a expirar
  static async buscarProximasExpiracao(horasAntes = 24) {
    try {
      const dataLimite = new Date();
      dataLimite.setHours(dataLimite.getHours() + horasAntes);      const resultados = await conexao.executarConsulta(`
        SELECT 
          pr.*,
          p.nome as produto_nome,
          p.marca as produto_marca
        FROM promocoes_relampago pr
        INNER JOIN produtos p ON pr.produto_id = p.id
        WHERE pr.ativo = 1 
          AND pr.data_fim <= ?
          AND pr.data_fim > NOW()
        ORDER BY pr.data_fim ASC
      `, [dataLimite]);

      return resultados.map(promocao => ({
        ...new PromocaoRelampago(promocao),
        produto: {
          nome: promocao.produto_nome,
          marca: promocao.produto_marca
        }
      }));
    } catch (erro) {
      console.error('Erro ao buscar promoções próximas do vencimento:', erro);
      throw new Error('Erro interno do servidor ao buscar promoções próximas do vencimento');
    }
  }

  // Obter estatísticas das promoções
  static async obterEstatisticas() {
    try {      const promocoesAtivas = await conexao.executarConsulta(`
        SELECT COUNT(*) as total 
        FROM promocoes_relampago 
        WHERE ativo = 1 AND data_inicio <= NOW() AND data_fim >= NOW()
      `);

      const promocoesTotais = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago');

      const vendasPromocoes = await conexao.executarConsulta(`
        SELECT 
          SUM(quantidade_vendida) as total_vendas,
          AVG(desconto_percentual) as desconto_medio,
          SUM(quantidade_vendida * preco_promocional) as receita_promocional
        FROM promocoes_relampago
      `);

      const topPromocoes = await conexao.executarConsulta(`
        SELECT 
          pr.nome,
          p.nome as produto_nome,
          pr.quantidade_vendida,
          pr.desconto_percentual,
          (pr.quantidade_vendida * pr.preco_promocional) as receita
        FROM promocoes_relampago pr
        INNER JOIN produtos p ON pr.produto_id = p.id
        ORDER BY pr.quantidade_vendida DESC
        LIMIT 5
      `);
      
      return {
        promocoes_ativas: promocoesAtivas[0].total,
        promocoes_totais: promocoesTotais[0].total,
        total_vendas_promocionais: vendasPromocoes[0].total_vendas || 0,
        desconto_medio: vendasPromocoes[0].desconto_medio || 0,
        receita_promocional: vendasPromocoes[0].receita_promocional || 0,
        top_promocoes: topPromocoes
      };
    } catch (erro) {
      console.error('Erro ao obter estatísticas das promoções:', erro);
      throw new Error('Erro interno do servidor ao obter estatísticas');
    }
  }

  // Verificar e desativar promoções expiradas
  static async desativarExpiradas() {
    try {      const resultado = await conexao.executarConsulta(`
        UPDATE promocoes_relampago 
        SET ativo = 0
        WHERE ativo = 1 AND data_fim < NOW()
      `);

      return resultado.affectedRows;
    } catch (erro) {
      console.error('Erro ao desativar promoções expiradas:', erro);
      throw new Error('Erro interno do servidor ao desativar promoções expiradas');
    }
  }
}

module.exports = PromocaoRelampago;
