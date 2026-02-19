# Guia Completo de Instalação e Execução Local

Este guia unifica todas as instruções para configurar, instalar e executar o **Certificate Manager** em um ambiente local (Ubuntu/Linux ou WSL).

## 📋 Pré-requisitos
- **Sistema Operacional**: Ubuntu 20.04 LTS+, Debian 11+ ou WSL2 (Windows).
- **Node.js**: Versão 20+
- **PostgreSQL**: Versão 12+
- **Git**

## 🚀 Passo 1: Preparação do Sistema

### 1.1 Atualizar Sistema e Instalar Ferramentas Básicas
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git wget build-essential
```

### 1.2 Instalar Node.js 20
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar instalação
node --version  # Deve mostrar v20.x.x
npm --version   # Deve mostrar 10.x.x ou superior
```

### 1.3 Instalar PostgreSQL
```bash
sudo apt install -y postgresql postgresql-contrib

# Iniciar e habilitar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 🗄️ Passo 2: Configuração do Banco de Dados

Configuraremos o banco com as credenciais padrão do projeto.

```bash
# Acessar console do PostgreSQL
sudo -u postgres psql
```

**Execute os comandos SQL abaixo:**
```sql
-- Criar usuário com senha padrão
CREATE USER appuser WITH PASSWORD 'StrongPass2024!';

-- Criar banco de dados
CREATE DATABASE tenant_management_db OWNER appuser;

-- Conceder permissões
GRANT ALL PRIVILEGES ON DATABASE tenant_management_db TO appuser;

-- Sair
\q
```

## 📦 Passo 3: Configuração do Projeto

### 3.1 Clonar e Instalar
```bash
cd ~
git clone https://github.com/mcsafx/CertificateManager.git
cd CertificateManager

# Instalar dependências
npm install
```

### 3.2 Configurar Variáveis de Ambiente
Crie o arquivo `.env` na raiz do projeto:

```bash
touch .env
```

**Conteúdo padrão para Localhost:**
```env
# Database Configuration
DATABASE_URL="postgresql://appuser:StrongPass2024!@localhost:5432/tenant_management_db"

# Application Configuration
NODE_ENV=development
PORT=5000

# Session Configuration
SESSION_SECRET="dev-secret-key-123"

# Application URLs
VITE_API_URL=http://localhost:5000
```

### 3.3 Inicializar Banco de Dados (Schema e Dados)
Utilize os comandos do Drizzle ORM para criar as tabelas e popular os dados iniciais (Planos, Módulos, Admin).

```bash
# Criar tabelas (Push Schema)
npm run db:push

# Popular dados iniciais (Seed)
npm run db:seed
```

> **Nota:** Não crie tabelas manualmente. O comando `db:push` garante que o banco esteja sincronizado com o código.

## ▶️ Passo 4: Executar a Aplicação

### Iniciar em Modo Desenvolvimento
Este comando inicia tanto o Backend (Porta 5000) quanto o Frontend (Porta 5173).

```bash
npm run dev
```

### Acessar o Sistema
1. Abra o navegador.
2. Acesse: **http://localhost:5173**
3. Login Padrão:
   - **Usuário:** `admin`
   - **Senha:** `admin123`

---

## 🔄 Rotina Diária (Startup)

Para iniciar o projeto diariamente:

1. **Verifique o Banco**:
   ```bash
   sudo systemctl status postgresql
   # Se parado: sudo systemctl start postgresql
   ```

2. **Inicie a Aplicação**:
   ```bash
   cd ~/CertificateManager
   npm run dev
   ```

3. **Acesse**: http://localhost:5173

## 🔧 Troubleshooting

### Porta 5000 em uso
```bash
sudo lsof -i :5000
sudo kill -9 <PID>
```

### Erro de Conexão com Banco
- Verifique se o PostgreSQL está rodando.
- Verifique se as credenciais no `.env` batem com as criadas no Passo 2.
- Em caso de erro de senha ("password authentication failed"), redefina:
  ```sql
  ALTER USER appuser WITH PASSWORD 'StrongPass2024!';
  ```

### Erro "Relation does not exist"
- Execute `npm run db:push` para recriar as tabelas.
