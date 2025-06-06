const mysql = require('mysql2/promise');
const conexao = require('../banco/conexao');

class Produto {  constructor(dados) {
    this.id = dados.id;
    this.marca = dados.marca;
    this.nome = dados.nome;
    this.imagem = dados.imagem;
    this.preco_antigo = dados.preco_antigo;
    this.preco_atual = dados.preco_atual;
    this.desconto = dados.desconto;
    this.avaliacao = dados.avaliacao;
    this.numero_avaliacoes = dados.total_avaliacoes || dados.numero_avaliacoes || 0;
    this.categoria = dados.categoria;
    this.genero = dados.genero;
    this.condicao = dados.condicao;
    this.estoque = dados.estoque || dados.quantidade_estoque || 0;
    this.descricao = dados.descricao;
    this.tamanhos_disponiveis = dados.tamanhos_disponiveis;
    this.cores_disponiveis = dados.cores_disponiveis;
    this.peso = dados.peso;
    this.material = dados.material;
    this.origem = dados.origem;
    this.garantia_meses = dados.garantia_meses;
    this.data_criacao = dados.data_criacao;
    this.data_atualizacao = dados.data_atualizacao;
  }

  // Buscar todos os produtos com filtros
  static async buscarTodos(filtros = {}) {
    try {
      let sql = `
        SELECT * FROM produtos 
        WHERE 1=1
      `;
      const parametros = [];

      // Filtro por termo de pesquisa
      if (filtros.termo_pesquisa) {
        sql += ` AND (nome LIKE ? OR marca LIKE ?)`;
        parametros.push(`%${filtros.termo_pesquisa}%`, `%${filtros.termo_pesquisa}%`);
      }

      // Filtro por marca
      if (Array.isArray(filtros.marcas) && filtros.marcas.length > 0) {
        const placeholders = filtros.marcas.map(() => '?').join(',');
        sql += ` AND marca IN (${placeholders})`;
        parametros.push(...filtros.marcas);
      }

      // Filtro por categoria
      if (Array.isArray(filtros.categorias) && filtros.categorias.length > 0) {
        const placeholders = filtros.categorias.map(() => '?').join(',');
        sql += ` AND categoria IN (${placeholders})`;
        parametros.push(...filtros.categorias);
      }

      // Filtro por gênero
      if (Array.isArray(filtros.generos) && filtros.generos.length > 0) {
        const placeholders = filtros.generos.map(() => '?').join(',');
        sql += ` AND genero IN (${placeholders})`;
        parametros.push(...filtros.generos);
      }

      // Filtro por condição
      if (filtros.condicao) {
        sql += ` AND condicao = ?`;
        parametros.push(filtros.condicao);
      }

      // Filtro por faixa de preço
      if (filtros.preco_min) {
        sql += ` AND preco_atual >= ?`;
        parametros.push(filtros.preco_min);
      }

      if (filtros.preco_max) {
        sql += ` AND preco_atual <= ?`;
        parametros.push(filtros.preco_max);
      }

      // Filtro por avaliação mínima
      if (filtros.avaliacao_minima) {
        sql += ` AND avaliacao >= ?`;
        parametros.push(filtros.avaliacao_minima);
      }      // Filtro por estoque disponível
      if (filtros.apenas_em_estoque) {
        sql += ` AND quantidade_estoque > 0`;
      }      // Filtro por produtos em destaque (com promoções ativas)
      if (filtros.apenas_destaques) {
        sql += ` AND EXISTS (
          SELECT 1 FROM promocoes_relampago pr 
          WHERE pr.produto_id = produtos.id 
          AND pr.ativo = 1 
          AND pr.data_inicio <= UTC_TIMESTAMP() 
          AND pr.data_fim >= UTC_TIMESTAMP()
        )`;
      }

      // Ordenação
      if (filtros.ordenar_por) {
        switch (filtros.ordenar_por) {
          case 'preco_asc':
            sql += ` ORDER BY preco_atual ASC`;
            break;
          case 'preco_desc':
            sql += ` ORDER BY preco_atual DESC`;
            break;
          case 'nome_asc':
            sql += ` ORDER BY nome ASC`;
            break;
          case 'nome_desc':
            sql += ` ORDER BY nome DESC`;
            break;
          case 'avaliacao_desc':
            sql += ` ORDER BY avaliacao DESC`;
            break;
          case 'mais_recente':
            sql += ` ORDER BY data_criacao DESC`;
            break;
          default:
            sql += ` ORDER BY id ASC`;
        }
      } else {
        sql += ` ORDER BY id ASC`;
      }

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
      return resultados.map(produto => new Produto(produto));
    } catch (erro) {
      console.error('Erro ao buscar produtos:', erro);
      throw new Error('Erro interno do servidor ao buscar produtos');
    }
  }  // Buscar produto por ID (versão simples para debug)
  static async buscarPorIdSimples(id) {
    try {
      const resultados = await conexao.executarConsulta(
        'SELECT * FROM produtos WHERE id = ? LIMIT 1',
        [id]
      );
      
      return resultados[0] || null;
    } catch (erro) {
      console.error('Erro ao buscar produto por ID (simples):', erro);
      throw erro;
    }
  }
  // Buscar produto por ID
  static async buscarPorId(id) {
    try {
      const resultados = await conexao.executarConsulta(
        'SELECT * FROM produtos WHERE id = ?',
        [id]
      );
      
      if (resultados.length === 0) {
        return null;
      }
      
      return new Produto(resultados[0]);
    } catch (erro) {
      console.error('Erro ao buscar produto por ID:', erro);
      throw new Error('Erro interno do servidor ao buscar produto');
    }
  }

  // Criar novo produto
  static async criar(dadosProduto) {
    try {
      const sql = `        INSERT INTO produtos (
          marca, nome, imagem, preco_antigo, preco_atual, desconto,
          avaliacao, numero_avaliacoes, categoria, genero, condicao,
          estoque, descricao, tamanhos_disponiveis, cores_disponiveis,
          peso, material, origem, garantia_meses
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const parametros = [
        dadosProduto.marca,
        dadosProduto.nome,
        dadosProduto.imagem || '/tenis_produtos.png',
        dadosProduto.preco_antigo,
        dadosProduto.preco_atual,
        dadosProduto.desconto || 0,
        dadosProduto.avaliacao || 0,
        dadosProduto.numero_avaliacoes || 0,
        dadosProduto.categoria,
        dadosProduto.genero,
        dadosProduto.condicao || 'novo',
        dadosProduto.estoque || 0,
        dadosProduto.descricao || '',
        dadosProduto.tamanhos_disponiveis || '',
        dadosProduto.cores_disponiveis || '',
        dadosProduto.peso || 0,
        dadosProduto.material || '',
        dadosProduto.origem || '',
        dadosProduto.garantia_meses || 12
      ];

      const resultado = await conexao.executarConsulta(sql, parametros);
      return await Produto.buscarPorId(resultado.insertId);
    } catch (erro) {
      console.error('Erro ao criar produto:', erro);
      throw new Error('Erro interno do servidor ao criar produto');
    }
  }

  // Atualizar produto
  async atualizar(dadosAtualizacao) {
    try {
      const campos = [];
      const parametros = [];

      // Construir dinamicamente a query baseada nos campos fornecidos
      Object.keys(dadosAtualizacao).forEach(campo => {
        if (dadosAtualizacao[campo] !== undefined && campo !== 'id') {
          campos.push(`${campo} = ?`);
          parametros.push(dadosAtualizacao[campo]);
        }
      });

      if (campos.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      parametros.push(this.id);

      const sql = `
        UPDATE produtos 
        SET ${campos.join(', ')}
        WHERE id = ?
      `;

      await conexao.executarConsulta(sql, parametros);
      return await Produto.buscarPorId(this.id);
    } catch (erro) {
      console.error('Erro ao atualizar produto:', erro);
      throw new Error('Erro interno do servidor ao atualizar produto');
    }
  }

  // Deletar produto
  async deletar() {
    try {
      await conexao.executarConsulta('DELETE FROM produtos WHERE id = ?', [this.id]);
      return true;
    } catch (erro) {
      console.error('Erro ao deletar produto:', erro);
      throw new Error('Erro interno do servidor ao deletar produto');
    }
  }

  // Atualizar estoque
  async atualizarEstoque(quantidade) {
    try {      await conexao.executarConsulta(
        'UPDATE produtos SET estoque = ? WHERE id = ?',
        [quantidade, this.id]
      );
      this.estoque = quantidade;
      return this;
    } catch (erro) {
      console.error('Erro ao atualizar estoque:', erro);
      throw new Error('Erro interno do servidor ao atualizar estoque');
    }
  }

  // Reduzir estoque (para compras)
  async reduzirEstoque(quantidade) {
    try {
      if (this.estoque < quantidade) {
        throw new Error('Estoque insuficiente');
      }

      const novoEstoque = this.estoque - quantidade;
      await this.atualizarEstoque(novoEstoque);
      return this;
    } catch (erro) {
      console.error('Erro ao reduzir estoque:', erro);
      throw erro;
    }
  }  // Buscar produtos relacionados (mesma categoria, marca diferente)
  async buscarRelacionados(limite = 4) {
    try {
      // Validar parâmetros antes da consulta
      console.log('🔍 Buscando produtos relacionados para:', {
        categoria: this.categoria,
        id: this.id,
        marca: this.marca,
        limite: limite
      });

      // Garantir que limite seja um número inteiro e seguro
      const limiteNumerico = Math.max(1, Math.min(20, parseInt(limite, 10) || 4));
      
      // Usar LIMIT diretamente na string SQL para evitar problemas de prepared statement
      const sql = `
        SELECT * FROM produtos 
        WHERE categoria = ? AND id <> ? 
        ORDER BY avaliacao DESC, total_avaliacoes DESC
        LIMIT ${limiteNumerico}
      `;
      
      const resultados = await conexao.executarConsulta(sql, [this.categoria, this.id]);

      console.log('✅ Produtos relacionados encontrados:', resultados.length);
      return resultados.map(produto => new Produto(produto));
    } catch (erro) {
      console.error('❌ Erro ao buscar produtos relacionados:', erro);
      console.error('📝 Parâmetros:', {
        categoria: this.categoria,
        id: this.id,
        marca: this.marca,
        limite: limite
      });
      throw new Error('Erro interno do servidor ao buscar produtos relacionados');
    }
  }
  // Buscar estatísticas de produtos
  static async obterEstatisticas() {
    try {
      const totalProdutos = await conexao.executarConsulta('SELECT COUNT(*) as total FROM produtos');
      const produtosEstoque = await conexao.executarConsulta('SELECT COUNT(*) as total FROM produtos WHERE quantidade_estoque > 0');
      const produtosSemEstoque = await conexao.executarConsulta('SELECT COUNT(*) as total FROM produtos WHERE quantidade_estoque = 0');
      const valorTotalEstoque = await conexao.executarConsulta('SELECT SUM(preco_atual * quantidade_estoque) as total FROM produtos');
      
      return {
        total_produtos: totalProdutos[0].total,
        produtos_em_estoque: produtosEstoque[0].total,
        produtos_sem_estoque: produtosSemEstoque[0].total,
        valor_total_estoque: valorTotalEstoque[0].total || 0
      };
    } catch (erro) {
      console.error('Erro ao obter estatísticas:', erro);
      throw new Error('Erro interno do servidor ao obter estatísticas');
    }
  }  // Método específico para buscar produtos em destaque
  static async buscarProdutosDestaque(limite = 8) {
    console.log('🚀 [MODELO] buscarProdutosDestaque chamado com limite:', limite);
    
    try {
      // Verificar se a conexão está disponível
      console.log('🔍 [MODELO] Verificando conexão:', typeof conexao);
      console.log('🔍 [MODELO] Método executarConsulta disponível:', typeof conexao.executarConsulta);
      
      // Primeiro, verificar se a tabela promocoes_relampago existe
      console.log('🔍 [MODELO] Verificando estrutura da tabela promocoes_relampago...');
      let estruturaTabela;
      try {
        estruturaTabela = await conexao.executarConsulta('DESCRIBE promocoes_relampago');
        console.log('✅ [MODELO] Tabela promocoes_relampago existe com', estruturaTabela.length, 'colunas');
        
        // Verificar se a coluna 'ativo' existe
        const colunaAtivo = estruturaTabela.find(col => col.Field === 'ativo');
        console.log('🔍 [MODELO] Coluna ativo existe:', !!colunaAtivo);
        
        if (!colunaAtivo) {
          console.log('⚠️ [MODELO] Coluna ativo não encontrada, listando colunas disponíveis:');
          estruturaTabela.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
        }
      } catch (erroTabela) {
        console.error('❌ [MODELO] Erro ao verificar tabela promocoes_relampago:', erroTabela.message);
        
        // Se a tabela não existe, retornar produtos simples baseado em critérios alternativos
        console.log('🔄 [MODELO] Usando estratégia alternativa - produtos com desconto...');
        const sqlAlternativo = `
          SELECT * FROM produtos 
          WHERE preco_antigo > preco_atual 
          AND disponivel = 1 
          AND quantidade_estoque > 0
          ORDER BY (preco_antigo - preco_atual) DESC
          LIMIT ?
        `;
        
        const resultados = await conexao.executarConsulta(sqlAlternativo, [limite]);
        console.log('✅ [MODELO] Produtos com desconto encontrados:', resultados.length);
        return resultados.map(produto => new Produto(produto));
      }
        // Query principal com múltiplas estratégias de fallback
      console.log('🔍 [MODELO] Tentativa 1: Query com alias pr');
      let sql = `
        SELECT p.* FROM produtos p
        INNER JOIN promocoes_relampago pr ON p.id = pr.produto_id
        WHERE pr.ativo = 1 
        AND pr.data_inicio <= UTC_TIMESTAMP() 
        AND pr.data_fim >= UTC_TIMESTAMP()
        AND p.disponivel = 1
        AND p.quantidade_estoque > 0
        ORDER BY p.id ASC
        LIMIT ?
      `;
      
      let resultados;
      try {
        console.log('🔍 [MODELO] SQL preparado:', sql);
        console.log('🔍 [MODELO] Parâmetros:', [limite]);
        
        console.log('🔍 [MODELO] Executando consulta...');
        resultados = await conexao.executarConsulta(sql, [limite]);
        
        console.log('✅ [MODELO] Query original funcionou');
      } catch (erroOriginal) {
        console.log('⚠️ [MODELO] Query original falhou:', erroOriginal.message);
        console.log('🔍 [MODELO] Tentativa 2: Query sem alias');
        
        // Tentativa 2: Query sem alias
        sql = `
          SELECT p.* FROM produtos p
          INNER JOIN promocoes_relampago ON p.id = promocoes_relampago.produto_id
          WHERE promocoes_relampago.ativo = 1 
          AND promocoes_relampago.data_inicio <= NOW() 
          AND promocoes_relampago.data_fim >= NOW()
          AND p.disponivel = 1
          AND p.quantidade_estoque > 0
          ORDER BY p.id ASC
          LIMIT ?
        `;
        
        try {
          resultados = await conexao.executarConsulta(sql, [limite]);
          console.log('✅ [MODELO] Query sem alias funcionou');
        } catch (erroSemAlias) {
          console.log('⚠️ [MODELO] Query sem alias falhou:', erroSemAlias.message);
          console.log('🔍 [MODELO] Tentativa 3: Query em duas etapas');
          
          // Tentativa 3: Query em duas etapas
          const sqlIds = `
            SELECT DISTINCT produto_id FROM promocoes_relampago 
            WHERE ativo = 1 
            AND data_inicio <= NOW() 
            AND data_fim >= NOW()
          `;
          
          const idsPromocao = await conexao.executarConsulta(sqlIds);
          
          if (idsPromocao.length === 0) {
            console.log('⚠️ [MODELO] Nenhum produto em promoção encontrado');
            resultados = [];
          } else {
            const ids = idsPromocao.map(row => row.produto_id);
            const placeholders = ids.map(() => '?').join(',');
            const sqlProdutos = `
              SELECT * FROM produtos 
              WHERE id IN (${placeholders}) 
              AND disponivel = 1 
              AND quantidade_estoque > 0
              ORDER BY id ASC
              LIMIT ?
            `;
            
            resultados = await conexao.executarConsulta(sqlProdutos, [...ids, limite]);
            console.log('✅ [MODELO] Query em duas etapas funcionou');
          }
        }
      }
      
      console.log('✅ [MODELO] Consulta executada com sucesso');
      console.log('✅ [MODELO] Número de resultados:', resultados ? resultados.length : 'null/undefined');
      console.log('✅ [MODELO] Dados brutos:', JSON.stringify(resultados, null, 2));
      
      const produtosMapeados = resultados.map(produto => new Produto(produto));
      console.log('✅ [MODELO] Produtos mapeados:', produtosMapeados.length);
      
      return produtosMapeados;
    } catch (erro) {
      console.error('❌ [MODELO] Erro detalhado ao buscar produtos em destaque:', erro);
      console.error('❌ [MODELO] Nome do erro:', erro.name);
      console.error('❌ [MODELO] Mensagem:', erro.message);
      console.error('❌ [MODELO] Stack trace:', erro.stack);
      console.error('❌ [MODELO] Código SQL:', erro.code);
      console.error('❌ [MODELO] Estado SQL:', erro.sqlState);
      console.error('❌ [MODELO] Mensagem SQL:', erro.sqlMessage);
      
      // Em caso de erro com a tabela promocoes_relampago, usar estratégia de fallback
      console.log('🔄 [MODELO] Tentando estratégia alternativa...');
      try {
        const sqlFallback = `
          SELECT * FROM produtos 
          WHERE preco_antigo > preco_atual 
          AND disponivel = 1 
          AND quantidade_estoque > 0
          ORDER BY (preco_antigo - preco_atual) DESC
          LIMIT ?
        `;
        
        const resultadosFallback = await conexao.executarConsulta(sqlFallback, [limite]);
        console.log('✅ [MODELO] Fallback executado com sucesso:', resultadosFallback.length, 'produtos');
        return resultadosFallback.map(produto => new Produto(produto));
      } catch (erroFallback) {
        console.error('❌ [MODELO] Erro também no fallback:', erroFallback.message);
        throw new Error(`Erro interno do servidor ao buscar produtos em destaque: ${erro.message}`);
      }
    }
  }
}

module.exports = Produto;
