// Implementação completa de upgrade de visitante para usuário
const express = require('express');
const router = express.Router();

// POST /api/upgrade/visitante-para-usuario
router.post('/visitante-para-usuario', async (req, res) => {
  try {
    // Dados do usuário para upgrade
    const { email, senha, dados } = req.body;
    
    if (!email || !senha || !dados) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Email, senha e dados de upgrade são obrigatórios'
      });
    }
    
    // Autenticar usuário
    const Usuario = require('../modelos/Usuario');
    
    try {
      // 1. Autenticar usuário
      const auth = await Usuario.autenticar(email, senha);
      
      if (!auth || !auth.usuario) {
        return res.status(401).json({
          sucesso: false,
          mensagem: 'Credenciais inválidas'
        });
      }
      
      const usuario = auth.usuario;
        // 2. Verificar se é visitante
      if (usuario.tipo_usuario !== 'visitante') {
        return res.status(400).json({
          sucesso: false,
          mensagem: 'Apenas visitantes podem ser atualizados para usuário'
        });
      }// 3. Atualizar usuário
      const atualizacao = {
        // Obrigatórios
        telefone: dados.telefone,
        data_nascimento: dados.data_nascimento || dados.dataNascimento,
        tipo_usuario: 'usuario'  // Apenas este campo existe na tabela
      };
      
      // Campos opcionais para a tabela de usuários (sem dados de endereço)
      if (dados.cpf) atualizacao.cpf = dados.cpf;
      
      // Vamos salvar os dados de endereço em uma variável separada
      // para adicionar à tabela enderecos_usuarios após atualizar o usuário
        // Atualizar via método do modelo
      await usuario.atualizar(atualizacao);
      
      // Salvar o endereço na tabela de endereços
      if (dados.endereco_completo || dados.cep || dados.cidade || dados.estado || dados.bairro) {
        const bancoDados = require('../banco/conexao');
        
        // Inserir o novo endereço
        const sqlEndereco = `
          INSERT INTO enderecos_usuarios 
          (usuario_id, tipo, cep, rua, bairro, cidade, estado, eh_principal)
          VALUES (?, ?, ?, ?, ?, ?, ?, 1)
        `;
        
        await bancoDados.executarConsulta(sqlEndereco, [
          usuario.id,
          'residencial',
          dados.cep || '',
          dados.endereco_completo || '',
          dados.bairro || '',
          dados.cidade || '',
          dados.estado || '',
        ]);
      }
      
      // 4. Reautenticar para obter novos dados
      const novoAuth = await Usuario.autenticar(email, senha);
      
      // 5. Responder com sucesso
      return res.json({
        sucesso: true,
        mensagem: 'Usuário atualizado com sucesso para nível 2',
        dados: {
          usuario: novoAuth.usuario,
          token: novoAuth.token
        }
      });
      
    } catch (authError) {
      console.error('Erro na atualização de tipo:', authError);
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Erro ao processar atualização: ' + authError.message
      });
    }
    
  } catch (error) {
    console.error('Erro geral na rota de upgrade:', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno do servidor'
    });
  }
});

module.exports = router;
