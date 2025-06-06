# Use Node.js oficial como imagem base
FROM node:18-alpine

# Define o diretório de trabalho
WORKDIR /app

# Copia os arquivos de configuração do npm
COPY package*.json ./

# Instala as dependências
RUN npm ci --only=production

# Copiar código da aplicação
COPY . .

# Cria o diretório de uploads
RUN mkdir -p uploads

# Cria o diretório de logs
RUN mkdir -p logs

# Expõe a porta da aplicação
EXPOSE 10000

# Define as variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=10000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:10000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando para iniciar aplicação
CMD ["npm", "start"]
