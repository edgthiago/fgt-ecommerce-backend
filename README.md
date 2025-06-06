# 🛒 FGT E-commerce Backend

Backend Node.js para sistema de e-commerce com MySQL.

## 🚀 Deploy Automático via Railway

Este repositório está configurado para deploy automático no Railway.

### 📋 Configuração de Variáveis de Ambiente

Configure as seguintes variáveis no Railway:

```
NODE_ENV=production
PORT=5000
DB_HOST=containers-us-west-XXX.railway.app
DB_PORT=3306
DB_USER=root
DB_PASSWORD=SUA_SENHA_MYSQL_RAILWAY
DB_NAME=railway
JWT_SECRET=sua_chave_secreta_jwt_super_segura_2025
CORS_ORIGIN=http://localhost:3000,https://seu-frontend.vercel.app
```

### 🗄️ Banco de Dados

O sistema usa MySQL. No Railway:
1. Adicione o serviço MySQL
2. Configure as variáveis de conexão
3. As tabelas serão criadas automaticamente

### 🔗 Endpoints Principais

- `GET /health` - Health check
- `POST /auth/login` - Login de usuário
- `GET /produtos` - Lista produtos
- `POST /pedidos` - Criar pedido

### 🛠️ Tecnologias

- Node.js 18+
- Express.js
- MySQL
- JWT Authentication
- Helmet (Security)
- Rate Limiting

### 📦 Estrutura

```
├── servidor-producao.js    # Servidor principal
├── banco/                  # Configuração do banco
├── modelos/               # Modelos de dados
├── rotas/                 # Rotas da API
├── middleware/            # Middlewares
└── utils/                 # Utilitários
```

## 🔄 Deploy

O deploy acontece automaticamente a cada push na branch main.

Para desenvolvimento local:

```bash
npm install
cp .env.example .env
# Configure suas variáveis locais
npm start
```

---

**Parte do projeto FGT E-commerce React 19**
