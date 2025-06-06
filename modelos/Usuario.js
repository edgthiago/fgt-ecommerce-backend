const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const conexao = require('../banco/conexao');

class Usuario {
  constructor(dados) {
    this.id = dados.id;
    this.nome = dados.nome;
    this.email = dados.email;
    this.senha_hash = dados.senha_hash; // Hash da senha
    this.tipo_usuario = dados.tipo_usuario;
    this.status = dados.status;
    this.telefone = dados.telefone;
    this.data_nascimento = dados.data_nascimento;
    this.aceite_lgpd = dados.aceite_lgpd;
    this.data_aceite_lgpd = dados.data_aceite_lgpd;
    this.tentativas_login = dados.tentativas_login;
    this.bloqueado_ate = dados.bloqueado_ate;
    this.ultimo_login = dados.ultimo_login;
    this.ip_ultimo_login = dados.ip_ultimo_login;
    this.token_recuperacao = dados.token_recuperacao;
    this.token_expiracao = dados.token_expiracao;
    this.data_criacao = dados.data_criacao;
    this.data_atualizacao = dados.data_atualizacao;
  }

  // Buscar todos os usuários (apenas para admins)
  static async buscarTodos(filtros = {}) {
    try {
      let sql = 'SELECT * FROM usuarios WHERE 1=1';
      const parametros = [];

      // Filtro por nível de acesso
      if (filtros.nivel_acesso) {
        sql += ' AND nivel_acesso = ?';
        parametros.push(filtros.nivel_acesso);
      }

      // Filtro por status ativo
      if (filtros.ativo !== undefined) {
        sql += ' AND ativo = ?';
        parametros.push(filtros.ativo);
      }

      // Filtro por termo de pesquisa
      if (filtros.termo_pesquisa) {
        sql += ' AND (nome LIKE ? OR email LIKE ?)';
        parametros.push(`%${filtros.termo_pesquisa}%`, `%${filtros.termo_pesquisa}%`);
      }

      sql += ' ORDER BY data_criacao DESC';

      // Paginação
      if (filtros.limite) {
        sql += ' LIMIT ?';
        parametros.push(parseInt(filtros.limite));
        
        if (filtros.offset) {
          sql += ' OFFSET ?';
          parametros.push(parseInt(filtros.offset));
        }
      }

      const resultados = await conexao.executarConsulta(sql, parametros);
      return resultados.map(usuario => {
        const u = new Usuario(usuario);
        delete u.senha; // Não retornar hash da senha
        return u;
      });
    } catch (erro) {
      console.error('Erro ao buscar usuários:', erro);
      throw new Error('Erro interno do servidor ao buscar usuários');
    }
  }
  // Buscar usuário por ID
  static async buscarPorId(id, incluirSenha = false) {
    try {
      const resultados = await conexao.executarConsulta(
        'SELECT * FROM usuarios WHERE id = ?',
        [id]
      );
      
      if (resultados.length === 0) {
        return null;
      }
      
      const usuario = new Usuario(resultados[0]);
      if (!incluirSenha) {
        delete usuario.senha_hash;
      }
      return usuario;
    } catch (erro) {
      console.error('Erro ao buscar usuário por ID:', erro);
      throw new Error('Erro interno do servidor ao buscar usuário');
    }
  }

  // Buscar usuário por email
  static async buscarPorEmail(email, incluirSenha = false) {
    try {
      const resultados = await conexao.executarConsulta(
        'SELECT * FROM usuarios WHERE email = ?',
        [email]
      );
      
      if (resultados.length === 0) {
        return null;
      }
      
      const usuario = new Usuario(resultados[0]);
      if (!incluirSenha) {
        delete usuario.senha_hash;
      }
      return usuario;
    } catch (erro) {
      console.error('Erro ao buscar usuário por email:', erro);
      throw new Error('Erro interno do servidor ao buscar usuário');
    }
  }

  // Criar novo usuário
  static async criar(dadosUsuario) {
    try {
      // Verificar se email já existe
      const usuarioExistente = await Usuario.buscarPorEmail(dadosUsuario.email);
      if (usuarioExistente) {
        throw new Error('Email já está em uso');
      }

      // Hash da senha
      const senhaHash = await bcrypt.hash(dadosUsuario.senha, 12);      const sql = `
        INSERT INTO usuarios (
          nome, email, senha_hash, tipo_usuario, status, telefone, data_nascimento
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;
      
      const parametros = [
        dadosUsuario.nome,
        dadosUsuario.email,
        senhaHash,
        dadosUsuario.nivel_acesso || 'usuario',
        'ativo', // Status padrão
        dadosUsuario.telefone || null,
        dadosUsuario.data_nascimento || null
      ];

      const resultado = await conexao.executarConsulta(sql, parametros);
      return await Usuario.buscarPorId(resultado.insertId);
    } catch (erro) {
      console.error('Erro ao criar usuário:', erro);
      if (erro.message === 'Email já está em uso') {
        throw erro;
      }
      throw new Error('Erro interno do servidor ao criar usuário');
    }
  }

  // Autenticar usuário
  static async autenticar(email, senha) {
    try {      const usuario = await Usuario.buscarPorEmail(email, true);
      
      if (!usuario) {
        throw new Error('Credenciais inválidas');
      }

      if (usuario.status !== 'ativo') {
        throw new Error('Sua conta foi desativada. Entre em contato com o suporte');
      }

      // Verificar se está bloqueado
      if (usuario.bloqueado_ate && new Date() < new Date(usuario.bloqueado_ate)) {
        const minutosRestantes = Math.ceil((new Date(usuario.bloqueado_ate) - new Date()) / (1000 * 60));
        throw new Error(`Conta bloqueada. Tente novamente em ${minutosRestantes} minutos`);
      }      // Verificar senha
      const senhaValida = await bcrypt.compare(senha, usuario.senha_hash);
      
      if (!senhaValida) {
        // Incrementar tentativas de login
        await usuario.incrementarTentativasLogin();
        throw new Error('Credenciais inválidas');
      }

      // Login bem-sucedido - resetar tentativas e atualizar último login
      await usuario.resetarTentativasLogin();
      await usuario.atualizarUltimoLogin();      // Gerar token JWT
      const token = jwt.sign(
        { 
          userId: usuario.id, 
          email: usuario.email, 
          nivelAcesso: usuario.tipo_usuario || usuario.nivel_acesso
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      delete usuario.senha_hash; // Não retornar hash da senha
        // Para compatibilidade com código que espera nivel_acesso
      usuario.nivel_acesso = usuario.tipo_usuario;
      
      return { usuario, token };
    } catch (erro) {
      console.error('Erro na autenticação:', erro);
      throw erro;
    }
  }
  // Atualizar usuário
  async atualizar(dadosAtualizacao) {
    try {
      const campos = [];
      const parametros = [];
      
      // Campos que podem ser atualizados
      const camposPermitidos = [
        'nome', 'telefone', 'data_nascimento', 'endereco_completo',
        'cidade', 'estado', 'cep', 'aceita_marketing', 'tipo_usuario', 'nivel_acesso', 'cpf', 'bairro'
      ];

      // Debug para visualizar o que está sendo atualizado
      console.log('Campos a atualizar:', dadosAtualizacao);      camposPermitidos.forEach(campo => {
        // Verificamos se o campo existe na tabela, filtrando 'nivel_acesso' que não existe
        if (dadosAtualizacao[campo] !== undefined && campo !== 'nivel_acesso') {
          campos.push(`${campo} = ?`);
          parametros.push(dadosAtualizacao[campo]);
        }
      });

      // Atualização de senha (se fornecida)
      if (dadosAtualizacao.senha) {
        const senhaHash = await bcrypt.hash(dadosAtualizacao.senha, 12);
        campos.push('senha_hash = ?');  // Corrigido para senha_hash em vez de senha
        parametros.push(senhaHash);
      }

      if (campos.length === 0) {
        throw new Error('Nenhum campo para atualizar');
      }

      parametros.push(this.id);
      
      console.log('SQL campos:', campos);

      const sql = `
        UPDATE usuarios 
        SET ${campos.join(', ')}, data_atualizacao = CURRENT_TIMESTAMP
        WHERE id = ?
      `;

      console.log('SQL Query:', sql);
      console.log('Parâmetros:', parametros);

      await conexao.executarConsulta(sql, parametros);
      return await Usuario.buscarPorId(this.id);
    } catch (erro) {
      console.error('Erro ao atualizar usuário:', erro);
      throw new Error('Erro interno do servidor ao atualizar usuário: ' + erro.message);
    }
  }

  // Alterar nível de acesso (apenas para administradores)
  async alterarNivelAcesso(novoNivel) {
    try {
      const niveisPermitidos = ['visitante', 'usuario', 'colaborador', 'supervisor', 'diretor'];
      if (!niveisPermitidos.includes(novoNivel)) {
        throw new Error('Nível de acesso inválido');
      }

      await conexao.executarConsulta(
        'UPDATE usuarios SET nivel_acesso = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
        [novoNivel, this.id]
      );

      this.nivel_acesso = novoNivel;
      return this;
    } catch (erro) {
      console.error('Erro ao alterar nível de acesso:', erro);
      throw new Error('Erro interno do servidor ao alterar nível de acesso');
    }
  }

  // Ativar/desativar usuário
  async alterarStatusAtivo(ativo) {
    try {
      await conexao.executarConsulta(
        'UPDATE usuarios SET ativo = ?, data_atualizacao = CURRENT_TIMESTAMP WHERE id = ?',
        [ativo, this.id]
      );

      this.ativo = ativo;
      return this;
    } catch (erro) {
      console.error('Erro ao alterar status do usuário:', erro);
      throw new Error('Erro interno do servidor ao alterar status do usuário');
    }
  }

  // Incrementar tentativas de login
  async incrementarTentativasLogin() {
    try {
      const novasTentativas = (this.tentativas_login || 0) + 1;
      let sql = 'UPDATE usuarios SET tentativas_login = ?';
      let parametros = [novasTentativas];

      // Bloquear por 15 minutos após 5 tentativas
      if (novasTentativas >= 5) {
        const bloqueadoAte = new Date();
        bloqueadoAte.setMinutes(bloqueadoAte.getMinutes() + 15);
        sql += ', bloqueado_ate = ?';
        parametros.push(bloqueadoAte);
      }

      sql += ' WHERE id = ?';
      parametros.push(this.id);

      await conexao.executarConsulta(sql, parametros);
    } catch (erro) {
      console.error('Erro ao incrementar tentativas de login:', erro);
    }
  }

  // Resetar tentativas de login
  async resetarTentativasLogin() {
    try {
      await conexao.executarConsulta(
        'UPDATE usuarios SET tentativas_login = 0, bloqueado_ate = NULL WHERE id = ?',
        [this.id]
      );
    } catch (erro) {
      console.error('Erro ao resetar tentativas de login:', erro);
    }
  }

  // Atualizar último login
  async atualizarUltimoLogin() {
    try {
      await conexao.executarConsulta(
        'UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id = ?',
        [this.id]
      );
    } catch (erro) {
      console.error('Erro ao atualizar último login:', erro);
    }
  }

  // Deletar conta (LGPD)
  async deletarConta() {
    try {
      // Primeiro, deletar dados relacionados
      await conexao.executarConsulta('DELETE FROM carrinho WHERE usuario_id = ?', [this.id]);
      await conexao.executarConsulta('DELETE FROM consentimentos_lgpd WHERE usuario_id = ?', [this.id]);
      
      // Depois deletar o usuário
      await conexao.executarConsulta('DELETE FROM usuarios WHERE id = ?', [this.id]);
      return true;
    } catch (erro) {
      console.error('Erro ao deletar conta:', erro);
      throw new Error('Erro interno do servidor ao deletar conta');
    }
  }

  // Exportar dados do usuário (LGPD)
  async exportarDados() {
    try {
      // Buscar dados do usuário
      const usuario = await Usuario.buscarPorId(this.id);
      
      // Buscar carrinho
      const carrinho = await conexao.executarConsulta(
        'SELECT * FROM carrinho WHERE usuario_id = ?',
        [this.id]
      );

      // Buscar consentimentos LGPD
      const consentimentos = await conexao.executarConsulta(
        'SELECT * FROM consentimentos_lgpd WHERE usuario_id = ?',
        [this.id]
      );

      return {
        usuario: usuario,
        carrinho: carrinho,
        consentimentos_lgpd: consentimentos,
        data_exportacao: new Date().toISOString()
      };
    } catch (erro) {
      console.error('Erro ao exportar dados:', erro);
      throw new Error('Erro interno do servidor ao exportar dados');
    }
  }

  // Verificar permissão
  temPermissao(nivelNecessario) {
    const hierarquia = {
      'visitante': 1,
      'usuario': 2,
      'colaborador': 3,
      'supervisor': 4,
      'diretor': 5
    };

    const nivelUsuario = hierarquia[this.nivel_acesso] || 0;
    const nivelMinimo = hierarquia[nivelNecessario] || 999;

    return nivelUsuario >= nivelMinimo;
  }
  // Obter estatísticas de usuários
  static async obterEstatisticas() {
    try {
      const totalUsuarios = await conexao.executarConsulta('SELECT COUNT(*) as total FROM usuarios');
      const usuariosAtivos = await conexao.executarConsulta('SELECT COUNT(*) as total FROM usuarios WHERE status = "ativo"');
      const usuariosPorNivel = await conexao.executarConsulta(`
        SELECT tipo_usuario, COUNT(*) as total 
        FROM usuarios 
        GROUP BY tipo_usuario
      `);
      
      return {
        total_usuarios: totalUsuarios[0].total,
        usuarios_ativos: usuariosAtivos[0].total,
        usuarios_por_nivel: usuariosPorNivel.reduce((acc, item) => {
          acc[item.tipo_usuario] = item.total;
          return acc;
        }, {})
      };
    } catch (erro) {
      console.error('Erro ao obter estatísticas de usuários:', erro);
      throw new Error('Erro interno do servidor ao obter estatísticas');
    }
  }
}

module.exports = Usuario;
