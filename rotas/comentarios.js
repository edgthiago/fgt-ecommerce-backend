const express = require('express');
const router = express.Router();
const Comentario = require('../modelos/Comentario');
const { PERMISSOES, middleware } = require('../utils/sistema-permissoes');
const { verificarAutenticacao } = require('../middleware/autenticacao');

// Buscar comentários de um produto (rota pública)
router.get('/produtos/:produtoId/comentarios', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const resultado = await Comentario.buscarPorProduto(produtoId);
    
    if (resultado.sucesso) {
      res.json(resultado.dados);
    } else {
      res.status(500).json({ message: resultado.mensagem });
    }
  } catch (error) {
    console.error('Erro ao buscar comentários:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

// Criar novo comentário (requer autenticação e permissão)
router.post('/produtos/:produtoId/comentarios', 
  verificarAutenticacao, 
  middleware.verificarComentario,
  async (req, res) => {    try {
      const { produtoId } = req.params;
      const { comentario, avaliacao } = req.body;
      const usuarioId = req.usuario.id;

      // Converter produtoId de string para número
      const produtoIdNumero = parseInt(produtoId, 10);

      console.log(`🔍 DEBUG COMENTÁRIO - Usuário ${usuarioId} tentando comentar produto ${produtoId}`);
      console.log(`🔍 DEBUG TIPOS - usuarioId: ${typeof usuarioId} = ${usuarioId}, produtoId: ${typeof produtoIdNumero} = ${produtoIdNumero}`);

      // Validações básicas
      if (!comentario || comentario.trim().length < 10) {
        return res.status(400).json({ 
          message: 'Comentário deve ter pelo menos 10 caracteres' 
        });
      }

      if (!avaliacao || avaliacao < 1 || avaliacao > 5) {
        return res.status(400).json({ 
          message: 'Avaliação deve ser entre 1 e 5 estrelas' 
        });
      }      // Verificar se usuário já comentou
      console.log(`🔍 Verificando se usuário já comentou...`);
      const jaComentou = await Comentario.jaComentou(usuarioId, produtoIdNumero);
      console.log(`🔍 Resultado jaComentou:`, jaComentou);
      if (jaComentou.jaComentou) {
        console.log(`❌ Usuário já comentou - retornando erro 400`);
        return res.status(400).json({ 
          message: 'Você já avaliou este produto' 
        });
      }      // Verificar se usuário pode avaliar (comprou o produto)
      console.log(`🔍 Verificando se usuário pode avaliar...`);
      const podeAvaliar = await Comentario.podeAvaliar(usuarioId, produtoIdNumero);
      console.log(`🔍 Resultado podeAvaliar:`, podeAvaliar);
      
      if (!podeAvaliar.podeAvaliar) {
        console.log(`❌ Usuário não pode avaliar - retornando erro 403`);
        return res.status(403).json({
          sucesso: false,
          mensagem: 'Apenas usuários que compraram o produto podem comentar'
        });
      }
      
      console.log(`✅ Usuário pode comentar - criando comentário...`);
        const dadosComentario = {
        usuario_id: usuarioId,
        produto_id: produtoIdNumero,
        comentario: comentario.trim(),
        avaliacao: parseInt(avaliacao),
        compra_verificada: true // Se chegou até aqui, é porque comprou
      };

      const resultado = await Comentario.criar(dadosComentario);

      if (resultado.sucesso) {
        // Buscar o comentário criado com dados do usuário
        const comentarios = await Comentario.buscarPorProduto(produtoId);
        const novoComentario = comentarios.dados.find(c => c.id === resultado.id);
        
        res.status(201).json(novoComentario);
      } else {
        res.status(500).json({ message: resultado.mensagem });
      }
    } catch (error) {
      console.error('Erro ao criar comentário:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

// Verificar se usuário pode avaliar produto
router.get('/usuarios/:usuarioId/pode-avaliar/:produtoId',
  verificarAutenticacao,
  async (req, res) => {
    try {
      const { usuarioId, produtoId } = req.params;
      
      // Verificar se é o próprio usuário ou admin
      if (req.usuario.id !== parseInt(usuarioId) && !req.usuario.isAdmin) {
        return res.status(403).json({ 
          message: 'Acesso negado' 
        });
      }

      // Verificar se já comentou
      const jaComentou = await Comentario.jaComentou(usuarioId, produtoId);
      if (jaComentou.jaComentou) {
        return res.json({ podeAvaliar: false, motivo: 'Já avaliou este produto' });
      }

      // Verificar se comprou o produto
      const podeAvaliar = await Comentario.podeAvaliar(usuarioId, produtoId);
      
      res.json({ 
        podeAvaliar: podeAvaliar.podeAvaliar,
        motivo: podeAvaliar.podeAvaliar ? 'Pode avaliar' : 'Precisa comprar o produto primeiro'
      });
    } catch (error) {
      console.error('Erro ao verificar permissão de avaliação:', error);
      res.status(500).json({ message: 'Erro interno do servidor' });
    }
  }
);

// Buscar estatísticas de avaliação de um produto
router.get('/produtos/:produtoId/estatisticas-avaliacao', async (req, res) => {
  try {
    const { produtoId } = req.params;
    
    const resultado = await Comentario.estatisticasAvaliacao(produtoId);
    
    if (resultado.sucesso) {
      res.json(resultado.dados);
    } else {
      res.status(500).json({ message: resultado.mensagem });
    }
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

module.exports = router;
