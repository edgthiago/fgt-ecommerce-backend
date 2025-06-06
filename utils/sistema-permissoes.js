// Sistema de Permissões e Níveis de Usuário
// Arquivo: sistema-permissoes.js

const NIVEIS_USUARIO = {
  VISITANTE: 'visitante',
  USUARIO: 'usuario', // nível 2 - após completar cadastro
  COLABORADOR: 'colaborador',
  SUPERVISOR: 'supervisor', 
  DIRETOR: 'diretor'
};

const PERMISSOES = {
  // === VISITANTE ===
  VISUALIZAR_PRODUTOS: 'visualizar_produtos',
  COMPARAR_PRODUTOS: 'comparar_produtos',
  ADICIONAR_CARRINHO: 'adicionar_carrinho',
  
  // === USUÁRIO NÍVEL 2 ===
  FINALIZAR_COMPRA: 'finalizar_compra',
  COMENTAR_PRODUTO_COMPRADO: 'comentar_produto_comprado',
  VISUALIZAR_HISTORICO_COMPRAS: 'visualizar_historico_compras',
  GERENCIAR_PERFIL: 'gerenciar_perfil',
  AVALIAR_PRODUTOS: 'avaliar_produtos',
  
  // === COLABORADOR ===
  ADICIONAR_PRODUTOS: 'adicionar_produtos',
  EDITAR_PRODUTOS: 'editar_produtos',
  REMOVER_PRODUTOS: 'remover_produtos',
  VERIFICAR_ESTOQUE: 'verificar_estoque',
  ATUALIZAR_ESTOQUE: 'atualizar_estoque',
  VISUALIZAR_VENDAS_BASICO: 'visualizar_vendas_basico',
  PROCESSAR_PEDIDOS: 'processar_pedidos',
  
  // === SUPERVISOR ===
  GESTAO_MARKETING: 'gestao_marketing',
  CRIAR_PROMOCOES: 'criar_promocoes',
  EDITAR_PROMOCOES: 'editar_promocoes',
  REMOVER_PROMOCOES: 'remover_promocoes',
  RELATORIOS_VENDAS: 'relatorios_vendas',
  RELATORIOS_MARKETING: 'relatorios_marketing',
  GERENCIAR_CAMPANHAS: 'gerenciar_campanhas',
  ANALYTICS_AVANCADO: 'analytics_avancado',
  GERENCIAR_COLABORADORES: 'gerenciar_colaboradores',
  CONFIGURAR_DESCONTO_GERAL: 'configurar_desconto_geral',
  
  // === DIRETOR ===
  ACESSO_TOTAL: 'acesso_total',
  GERENCIAR_USUARIOS: 'gerenciar_usuarios',
  CONFIGURACOES_SISTEMA: 'configuracoes_sistema',
  RELATORIOS_FINANCEIROS: 'relatorios_financeiros',
  BACKUP_SISTEMA: 'backup_sistema',
  LOGS_SISTEMA: 'logs_sistema',
  DEFINIR_PERMISSOES: 'definir_permissoes'
};

// Definindo permissões por nível sem referência circular
const PERMISSOES_VISITANTE = [
  PERMISSOES.VISUALIZAR_PRODUTOS,
  PERMISSOES.COMPARAR_PRODUTOS,
  PERMISSOES.ADICIONAR_CARRINHO
];

const PERMISSOES_USUARIO = [
  ...PERMISSOES_VISITANTE,
  // Permissões específicas de usuário nível 2
  PERMISSOES.FINALIZAR_COMPRA,
  PERMISSOES.COMENTAR_PRODUTO_COMPRADO,
  PERMISSOES.VISUALIZAR_HISTORICO_COMPRAS,
  PERMISSOES.GERENCIAR_PERFIL,
  PERMISSOES.AVALIAR_PRODUTOS
];

const PERMISSOES_COLABORADOR = [
  ...PERMISSOES_USUARIO,
  // Permissões específicas de colaborador
  PERMISSOES.ADICIONAR_PRODUTOS,
  PERMISSOES.EDITAR_PRODUTOS,
  PERMISSOES.REMOVER_PRODUTOS,
  PERMISSOES.VERIFICAR_ESTOQUE,
  PERMISSOES.ATUALIZAR_ESTOQUE,
  PERMISSOES.VISUALIZAR_VENDAS_BASICO,
  PERMISSOES.PROCESSAR_PEDIDOS
];

const PERMISSOES_SUPERVISOR = [
  ...PERMISSOES_COLABORADOR,
  // Permissões específicas de supervisor
  PERMISSOES.GESTAO_MARKETING,
  PERMISSOES.CRIAR_PROMOCOES,
  PERMISSOES.EDITAR_PROMOCOES,
  PERMISSOES.REMOVER_PROMOCOES,
  PERMISSOES.RELATORIOS_VENDAS,
  PERMISSOES.RELATORIOS_MARKETING,
  PERMISSOES.GERENCIAR_CAMPANHAS,
  PERMISSOES.ANALYTICS_AVANCADO,
  PERMISSOES.GERENCIAR_COLABORADORES,
  PERMISSOES.CONFIGURAR_DESCONTO_GERAL
];

const PERMISSOES_DIRETOR = [
  ...PERMISSOES_SUPERVISOR,
  // Permissões específicas de diretor
  PERMISSOES.ACESSO_TOTAL,
  PERMISSOES.GERENCIAR_USUARIOS,
  PERMISSOES.CONFIGURACOES_SISTEMA,
  PERMISSOES.RELATORIOS_FINANCEIROS,
  PERMISSOES.BACKUP_SISTEMA,
  PERMISSOES.LOGS_SISTEMA,
  PERMISSOES.DEFINIR_PERMISSOES
];

// Mapeamento de permissões por nível
const PERMISSOES_POR_NIVEL = {
  [NIVEIS_USUARIO.VISITANTE]: PERMISSOES_VISITANTE,
  [NIVEIS_USUARIO.USUARIO]: PERMISSOES_USUARIO,
  [NIVEIS_USUARIO.COLABORADOR]: PERMISSOES_COLABORADOR,
  [NIVEIS_USUARIO.SUPERVISOR]: PERMISSOES_SUPERVISOR,
  [NIVEIS_USUARIO.DIRETOR]: PERMISSOES_DIRETOR
};

// Função para verificar se usuário tem permissão
function verificarPermissao(tipoUsuario, permissao) {
  const permissoesUsuario = PERMISSOES_POR_NIVEL[tipoUsuario] || [];
  return permissoesUsuario.includes(permissao) || tipoUsuario === NIVEIS_USUARIO.DIRETOR;
}

// Função para obter todas as permissões de um usuário
function obterPermissoesUsuario(tipoUsuario) {
  return PERMISSOES_POR_NIVEL[tipoUsuario] || [];
}

// Função para verificar se pode finalizar compra
function podeFinalizarCompra(tipoUsuario) {
  return verificarPermissao(tipoUsuario, PERMISSOES.FINALIZAR_COMPRA);
}

// Função para verificar se pode comentar produto (apenas se comprou)
function podeComentarProduto(tipoUsuario, comprouProduto = false) {
  return verificarPermissao(tipoUsuario, PERMISSOES.COMENTAR_PRODUTO_COMPRADO) && comprouProduto;
}

// Configurações específicas por cargo
const CONFIGURACOES_CARGO = {
  [NIVEIS_USUARIO.COLABORADOR]: {
    nome_exibicao: 'Colaborador',
    cor_badge: '#28a745',
    descricao: 'Gerencia produtos e estoque',
    areas_acesso: [
      'Catálogo de Produtos',
      'Controle de Estoque', 
      'Processamento de Pedidos',
      'Relatórios Básicos de Vendas'
    ],
    limitacoes: [
      'Não pode criar promoções',
      'Não pode acessar relatórios financeiros',
      'Não pode gerenciar outros usuários'
    ]
  },
  
  [NIVEIS_USUARIO.SUPERVISOR]: {
    nome_exibicao: 'Supervisor',
    cor_badge: '#fd7e14',
    descricao: 'Gerencia marketing e equipe',
    areas_acesso: [
      'Todas as áreas do Colaborador',
      'Gestão de Marketing',
      'Criação de Promoções e Campanhas',
      'Relatórios de Vendas e Marketing',
      'Analytics Avançados',
      'Gerenciamento de Colaboradores'
    ],
    limitacoes: [
      'Não pode acessar configurações do sistema',
      'Não pode gerenciar usuários de nível superior',
      'Não pode fazer backup do sistema'
    ]
  },
  
  [NIVEIS_USUARIO.DIRETOR]: {
    nome_exibicao: 'Diretor',
    cor_badge: '#dc3545',
    descricao: 'Acesso total ao sistema',
    areas_acesso: [
      'Acesso Total',
      'Todas as funcionalidades',
      'Configurações do Sistema',
      'Relatórios Financeiros Completos',
      'Gerenciamento de Usuários',
      'Backup e Logs do Sistema'
    ],
    limitacoes: []
  }
};

// Middleware para verificar permissões
const middleware = {
  // Verificar se pode acessar rota administrativa
  verificarAcessoAdmin: (permissaoRequerida) => {
    return (req, res, next) => {
      if (!req.usuario) {
        return res.status(401).json({ 
          sucesso: false, 
          mensagem: 'Acesso negado. Faça login primeiro.' 
        });
      }
      
      if (!verificarPermissao(req.usuario.tipo_usuario, permissaoRequerida)) {
        return res.status(403).json({ 
          sucesso: false, 
          mensagem: 'Acesso negado. Permissão insuficiente.' 
        });
      }
      
      next();
    };
  },
    // Verificar se pode finalizar compra
  verificarCompra: (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: 'Para finalizar a compra, você precisa estar logado.',
        acao_requerida: 'login'
      });
    }
    
    if (!podeFinalizarCompra(req.usuario.tipo_usuario)) {
      return res.status(403).json({ 
        sucesso: false, 
        mensagem: 'Para finalizar compras, você precisa completar seu cadastro.',
        acao_requerida: 'completar_cadastro'
      });
    }
    
    next();
  },

  // Verificar se pode comentar produto (middleware específico para comentários)
  verificarComentario: (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ 
        sucesso: false, 
        mensagem: 'Para comentar produtos, você precisa estar logado.',
        acao_requerida: 'login'
      });
    }
    
    // Verificar se tem permissão básica para comentar
    if (!verificarPermissao(req.usuario.tipo_usuario, PERMISSOES.COMENTAR_PRODUTO_COMPRADO)) {
      return res.status(403).json({ 
        sucesso: false, 
        mensagem: 'Para comentar produtos, você precisa completar seu cadastro.',
        acao_requerida: 'completar_cadastro'
      });
    }
    
    next();
  }
};

module.exports = {
  NIVEIS_USUARIO,
  PERMISSOES,
  PERMISSOES_POR_NIVEL,
  CONFIGURACOES_CARGO,
  verificarPermissao,
  obterPermissoesUsuario,
  podeFinalizarCompra,
  podeComentarProduto,
  middleware
};
