<div align="center">

# Certificate Manager
### Plataforma SaaS Multi-tenant para Gestão de Qualidade

![Status](https://img.shields.io/badge/status-active-success.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.1.0-blue.svg)

</div>

---

O **Certificate Manager** é uma solução completa para gestão de certificações de qualidade, rastreabilidade de matérias-primas e controle de estoque, projetada primariamente como uma plataforma SaaS Multi-tenant robusta e escalável. 

O sistema elimina a complexidade de gerenciar a entrada de laudos de fornecedores e a emissão técnica para clientes finais. Ele assegura total conformidade, estruturação hierárquica de informações químicas ou físicas de produtos e rastreabilidade ponta a ponta dos lotes industriais.

## 🚀 Funcionalidades

### 🏢 Módulo SaaS (Tenant Management)
* **Isolamento Multi-tenant**: Dados categorizados e isolados de forma segura por empresa (`tenant_id`).
* **Gestão de Planos e Assinaturas**: Controle granular de recursos e acesso via planos (ex: Básico, Intermediário, Completo).
* **Feature Gating**: Ativação e desativação centralizada de módulos baseados na assinatura de cada empresa.

### 📦 Módulo de Produtos e Estoque
* **Arquitetura Hierárquica**: Organização em Categorias > Subcategorias > Produto Base > Variantes (SKUs).
* **Especificações Técnicas**: Cadastro de características físico-químicas, parâmetros de aceitação mínima/máxima e métodos de análise.
* **Gestão de Documentos**: Armazenamento e visualização de documentações críticas anexadas, como FISPQ, laudos originais e Fichas Técnicas.

### 📥 Módulo de Importação NF-e (Novo)
* **Engenharia de XML**: Upload e processamento automatizado de Notas Fiscais Eletrônicas em formato XML.
* **Mapeamento de Produtos (De-Para)**: Vínculo inteligente salvando correlações entre códigos de fornecedores e o catálogo interno.
* **Fila de Inspeção**: Geração automática de pendências no recebimento, otimizando o workflow do controle de qualidade.

### 📜 Módulo de Certificados e Rastreabilidade
* **Boletins de Entrada**: Registro minucioso de laudos recebidos de fornecedores para aprovação/reprovação técnica.
* **Boletins de Saída (Emissão)**: Ferramenta ágil para geração de laudos técnicos otimizados para clientes em PDF.
* **Rastreabilidade Ponta a Ponta**: Mapeamento e navegação visual permitindo auditar o uso de lotes de fabricantes específicos através da cadeia até o cliente final.

## 🏗️ Arquitetura Técnica (Tech Stack)

### Frontend
* **React 18** + **TypeScript**: Construção de interface reativa e tipagem estática.
* **Vite**: Ferramenta de build de altíssima performance estruturada para módulos nativos.
* **Tailwind CSS** + **shadcn/ui**: Utilitários e design system para aparência moderna e consistente.
* **TanStack React Query**: Controle e cache do estado que flui do servidor via requisições API.
* **Wouter**: Roteamento leve no ecossistema React.

### Backend
* **Node.js** com **Express**: Criação de APIs RESTful estruturadas e manuteníveis.
* **Drizzle ORM**: Integração de banco de dados fortemente tipada (type-safe).
* **PostgreSQL**: SGBD Relacional robusto focado em integridade, suportando perfeitamente relacionamento multi-tenant.
* **Zod**: Validação centralizada garantindo contratos estritos entre cliente e servidor com *drizzle-zod*.
* **Passport.js**: Autenticação baseada em sessão garantindo segurança das rotas e perfis.

## 📂 Estrutura de Arquivos

```text
.
├── client/                 # Aplicação Frontend (React/Vite)
│   ├── src/
│   │   ├── components/     # UI base (shadcn) e visuais compartilhados
│   │   ├── lib/            # Helpers e utilitários
│   │   └── pages/          # Telas (Admin, Produtos, NFe, Emissões, Rastreabilidade)
├── server/                 # API Backend (Node/Express)
│   ├── middlewares/        # Proteções (Auth, Tenant Isolado, Uploads)
│   ├── services/           # Lógica de negócio (Subscrições, XML Parser)
│   ├── routes.ts           # Definição e agrupamento de todos os endpoints REST
│   └── storage.ts          # Encapsulamento de regras interativas e consultas SQL
├── shared/                 # Modelos compartilhados entre Front/Back
│   └── schema.ts           # Schema relacional extenso (Drizzle/Zod)
└── scripts/                # Rotinas e automações gerais
    ├── seed.ts             # Dados iniciais obrigatórios (Root admin, Planos SaaS)
    └── reset-db.ts         # Auxílio em desenvolvimento para wipe do PostgreSQL
```

## 🛠️ Instalação e Uso

### Pré-requisitos
* **Node.js** (v20 ou superior)
* **PostgreSQL** (v12 ou superior)

> **Aviso Importante**: O comando `npm install` cuida apenas das dependências do *projeto* (pacotes NPM), não do sistema operacional. Certifique-se de ter os pré-requisitos instalados em sua máquina.

### Passo a Passo

1. Instale todas as dependências do projeto:
```bash
npm install
```

2. Configure o ambiente de banco de dados:
   Crie um arquivo `.env` na raiz utilizando o modelo `.env.example`. Preencha a string de conexão na variável `DATABASE_URL`.

3. Crie e popule o banco de dados:
```bash
# Sincroniza as tabelas do projeto com o PostgreSQL local
npm run db:push

# Popula usuários administrativos, planos SaaS e módulos
npm run db:seed
```

4. Execute os serviços concurrentemente:
```bash
npm run dev
```
**Importante**: Ao rodar o serviço em ambiente local:
* O ambiente **Frontend (Vite)** estará na porta **5173** (`http://localhost:5173`)
* O ambiente **Backend (Node)** estará na porta **5000** (`http://localhost:5000`)

## 🔐 Credenciais (Seed)

| Usuário | Senha | Acesso | Ambiente Padrão |
| :--- | :--- | :--- | :--- |
| `admin` | `admin123` | Administrador Master | Tenant Ouro de Acesso |

## 📝 Licença

Este projeto é desenvolvido sob os termos da licença **MIT**.