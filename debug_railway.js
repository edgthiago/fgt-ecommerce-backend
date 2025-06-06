// Teste de diagnóstico para Railway
const express = require('express');
const Produto = require('./modelos/Produto');
const conexao = require('./banco/conexao');

const app = express();

// Endpoint de diagnóstico
app.get('/debug/destaques', async (req, res) => {
  try {
    console.log('=== DEBUG DESTAQUES START ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('DB_HOST:', process.env.DB_HOST);
    console.log('DB_PORT:', process.env.DB_PORT);
    
    // Teste 1: Conexão básica
    console.log('Teste 1: Testando conexão...');
    const testConnection = await conexao.executarConsulta('SELECT 1 as test');
    console.log('Conexão OK:', testConnection);
    
    // Teste 2: Promoções ativas
    console.log('Teste 2: Verificando promoções...');
    const promocoes = await conexao.executarConsulta('SELECT COUNT(*) as total FROM promocoes_relampago WHERE ativo = 1');
    console.log('Promoções ativas:', promocoes);
    
    // Teste 3: Query específica
    console.log('Teste 3: Query EXISTS...');
    const queryExists = await conexao.executarConsulta(`
      SELECT COUNT(*) as total FROM produtos 
      WHERE EXISTS (
        SELECT 1 FROM promocoes_relampago pr 
        WHERE pr.produto_id = produtos.id 
        AND pr.ativo = 1 
        AND pr.data_inicio <= NOW() 
        AND pr.data_fim >= NOW()
      )
    `);
    console.log('Produtos com EXISTS:', queryExists);
    
    // Teste 4: Modelo Produto
    console.log('Teste 4: Testando modelo...');
    const filtros = {
      apenas_destaques: true,
      apenas_em_estoque: true,
      limite: 8
    };
    
    const produtos = await Produto.buscarTodos(filtros);
    console.log('Produtos do modelo:', produtos.length);
    
    console.log('=== DEBUG DESTAQUES END ===');
    
    res.json({
      sucesso: true,
      debug: {
        conexao: 'OK',
        promocoes_ativas: promocoes[0].total,
        produtos_exists: queryExists[0].total,
        produtos_modelo: produtos.length,
        produtos: produtos.map(p => ({ id: p.id, nome: p.nome }))
      }
    });
    
  } catch (erro) {
    console.error('ERRO NO DEBUG:', erro);
    res.status(500).json({
      sucesso: false,
      erro: erro.message,
      stack: erro.stack
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🔍 Servidor de debug rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}/debug/destaques`);
});
