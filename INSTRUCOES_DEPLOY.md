# 🎯 PRÓXIMOS PASSOS - Deploy no Railway

## ✅ Repositório Backend Preparado!

O backend foi extraído e preparado em: `c:\Users\edgle\Desktop\fgt-ecommerce-backend`

### 🔗 1. Criar Repositório no GitHub

1. Acesse: https://github.com/new
2. **Nome**: `fgt-ecommerce-backend`
3. **Visibilidade**: ✅ **PÚBLICO** (importante!)
4. **Inicializar**: ❌ NÃO marque "Add a README file"
5. Clique "Create repository"

### 🚀 2. Fazer Push para GitHub

Execute estes comandos na pasta `c:\Users\edgle\Desktop\fgt-ecommerce-backend`:

```powershell
# Conectar ao GitHub (substitua SEU_USUARIO pelo seu username)
git remote add origin https://github.com/SEU_USUARIO/fgt-ecommerce-backend.git

# Renomear branch para main
git branch -M main

# Fazer push
git push -u origin main
```

### 🚂 3. Deploy no Railway

1. Acesse: https://railway.app
2. Faça login com GitHub
3. Clique "New Project"
4. Selecione "Deploy from GitHub repo"
5. Escolha o repositório `fgt-ecommerce-backend`
6. Railway detectará automaticamente o Node.js

### 🗄️ 4. Adicionar MySQL no Railway

1. No seu projeto Railway, clique "Add Service"
2. Selecione "MySQL"
3. Railway criará automaticamente

### ⚙️ 5. Configurar Variáveis de Ambiente

No Railway, adicione estas variáveis:

```
NODE_ENV=production
PORT=5000
JWT_SECRET=sua_chave_secreta_jwt_super_segura_2025
CORS_ORIGIN=http://localhost:3000
```

**Observação**: As variáveis do MySQL (DB_HOST, DB_PORT, etc.) serão criadas automaticamente pelo Railway.

### 🔍 6. Testar o Deploy

Após o deploy, teste:
- `https://seu-app.up.railway.app/health`
- `https://seu-app.up.railway.app/api/produtos`

### 🔄 7. Atualizar Frontend

No arquivo `frontend/src/config/api.js`, a configuração já detecta automaticamente URLs do Railway.

## 📝 Comandos Resumidos

```powershell
# Na pasta c:\Users\edgle\Desktop\fgt-ecommerce-backend
git remote add origin https://github.com/SEU_USUARIO/fgt-ecommerce-backend.git
git branch -M main
git push -u origin main
```

## 🎉 Vantagens desta Abordagem

- ✅ Deploy automático a cada push
- ✅ Banco MySQL gratuito incluído
- ✅ HTTPS automático
- ✅ Configuração simplificada
- ✅ Monitoramento incluído

---

**Após o deploy, você terá seu backend rodando 24/7 gratuitamente!**
