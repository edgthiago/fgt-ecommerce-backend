// Middleware de autenticação e autorização para loja de tênis
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

require('dotenv').config();
const JWT_SECRET = process.env.JWT_SECRET || 'chave_super_secreta_loja_tenis_2024';
const SALT_ROUNDS = 12;

// Níveis de permissão hierárquicos
const NIVEIS_PERMISSAO = {
    'visitante': 1,
    'usuario': 2,
    'colaborador': 3,
    'supervisor': 4,
    'diretor': 5
};

// Gerar hash da senha
async function gerarHashSenha(senha) {
    try {
        return await bcrypt.hash(senha, SALT_ROUNDS);
    } catch (erro) {
        console.error('❌ Erro ao gerar hash da senha:', erro);
        throw new Error('Erro interno no processamento da senha');
    }
}

// Verificar senha
async function verificarSenha(senha, hash) {
    try {
        return await bcrypt.compare(senha, hash);
    } catch (erro) {
        console.error('❌ Erro ao verificar senha:', erro);
        return false;
    }
}

// Gerar token JWT
function gerarToken(usuario) {
    try {
        // Usar nivel_acesso se existir, senão usar tipo_usuario
        const nivelAcesso = usuario.nivel_acesso || usuario.tipo_usuario;
          
        const payload = { 
            userId: usuario.id, 
            email: usuario.email, 
            nivelAcesso: nivelAcesso,
            nome: usuario.nome
        };
        
        return jwt.sign(payload, JWT_SECRET, { 
            expiresIn: '24h',
            issuer: 'loja-tenis-api',
            audience: 'loja-tenis-frontend'
        });
    } catch (erro) {
        console.error('❌ Erro ao gerar token:', erro);
        throw new Error('Erro interno na autenticação');
    }
}

// Middleware para verificar autenticação
async function verificarAutenticacao(req, res, next) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ 
                sucesso: false, 
                erro: 'Token de acesso requerido',
                codigo: 'TOKEN_REQUERIDO'
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
          // Buscar usuário diretamente no banco
        const bancoDados = require('../banco/conexao');
        const rows = await bancoDados.executarConsulta(
            'SELECT id, nome, email, tipo_usuario, status, telefone, data_nascimento FROM usuarios WHERE id = ? AND status = "ativo"',
            [decoded.userId]
        );
        
        if (rows.length === 0) {
            return res.status(401).json({ 
                sucesso: false, 
                erro: 'Usuário não encontrado ou inativo',
                codigo: 'USUARIO_NAO_ENCONTRADO'
            });
        }        // Atribuir o usuário à requisição
        req.usuario = rows[0];
        
        // Garantir que nivel_acesso está presente (para compatibilidade)
        if (!req.usuario.nivel_acesso && req.usuario.tipo_usuario) {
            req.usuario.nivel_acesso = req.usuario.tipo_usuario;
        }
        
        next();
    } catch (erro) {
        console.error('❌ Erro na verificação de autenticação:', erro);
        
        if (erro.name === 'TokenExpiredError') {
            return res.status(401).json({
                sucesso: false, 
                erro: 'Token expirado, faça login novamente',
                codigo: 'TOKEN_EXPIRADO'
            });
        } else if (erro.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                sucesso: false, 
                erro: 'Token inválido',
                codigo: 'TOKEN_INVALIDO'
            });
        } else {
            return res.status(500).json({ 
                sucesso: false, 
                erro: 'Erro interno na verificação do token',
                codigo: 'ERRO_INTERNO'
            });
        }
    }
}

// Middleware para verificar permissões
function verificarPermissao(nivelMinimo) {
    return function(req, res, next) {
        try {
            if (!req.usuario) {
                return res.status(401).json({ 
                    sucesso: false, 
                    erro: 'Usuário não autenticado',
                    codigo: 'NAO_AUTENTICADO'
                });
            }            // Verificar tanto tipo_usuario quanto nivel_acesso para garantir compatibilidade
            const tipoUsuario = req.usuario.tipo_usuario || req.usuario.nivel_acesso || 'visitante';
            const nivelUsuario = NIVEIS_PERMISSAO[tipoUsuario] || 1;
            const nivelRequerido = NIVEIS_PERMISSAO[nivelMinimo] || 1;

            if (nivelUsuario < nivelRequerido) {
                return res.status(403).json({ 
                    sucesso: false, 
                    erro: `Acesso negado. Nível necessário: ${nivelMinimo}`,
                    codigo: 'ACESSO_NEGADO'
                });
            }

            next();
        } catch (erro) {
            console.error('❌ Erro na verificação de permissão:', erro);
            return res.status(500).json({ 
                sucesso: false, 
                erro: 'Erro interno na verificação de permissão',
                codigo: 'ERRO_INTERNO'
            });
        }
    };
}

// Rate limiting para tentativas de login
function limitarTentativasLogin(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const agora = Date.now();
    const limiteJanela = 15 * 60 * 1000; // 15 minutos
    const maximoTentativas = 5;

    if (!global.tentativasLogin) {
        global.tentativasLogin = new Map();
    }

    const tentativas = global.tentativasLogin.get(ip) || { count: 0, ultimaTentativa: 0 };

    // Reset se passou da janela de tempo
    if (agora - tentativas.ultimaTentativa > limiteJanela) {
        tentativas.count = 0;
    }

    if (tentativas.count >= maximoTentativas) {
        const tempoRestante = Math.ceil((tentativas.ultimaTentativa + limiteJanela - agora) / 1000 / 60);
        
        return res.status(429).json({
            sucesso: false,
            erro: `Muitas tentativas de login. Tente novamente em ${tempoRestante} minutos.`,
            codigo: 'RATE_LIMIT_EXCEDIDO',
            tempo_restante: tempoRestante
        });
    }

    // Incrementar contador apenas em caso de erro
    req.incrementarTentativasLogin = function() {
        tentativas.count++;
        tentativas.ultimaTentativa = agora;
        global.tentativasLogin.set(ip, tentativas);
    };

    // Reset contador em caso de sucesso
    req.resetarTentativasLogin = function() {
        global.tentativasLogin.delete(ip);
    };

    next();
}

module.exports = {
    gerarHashSenha,
    verificarSenha,
    gerarToken,
    verificarAutenticacao,
    verificarPermissao,
    limitarTentativasLogin,
    NIVEIS_PERMISSAO
};
