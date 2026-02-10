# Projeto Certificate Manager - Análise e Conclusões

Este documento contém a análise técnica e o entendimento do projeto "Certificate Manager" (também referido como Tenant Management System). Ele servirá como base de conhecimento viva, sendo atualizado conforme o projeto evolui.

## 1. Visão Geral do Projeto

O **Certificate Manager** é uma plataforma **SaaS Multi-tenant** projetada para gestão de certificados de qualidade, produtos e rastreabilidade. O sistema permite que múltiplas empresas (tenants) utilizem a plataforma com isolamento de dados e funcionalidades baseadas em planos de assinatura.

### Principais Características
- **Multi-tenancy**: Isolamento lógico de dados por `tenant_id`.
- **Sistema de Planos**: Diferentes níveis de acesso (Básico, Intermediário, Completo) que habilitam/desabilitam módulos.
- **Controle de Acesso Granular**: Permissões baseadas em funcionalidades (`features`) e não apenas em papéis fixos.
- **Core Business**: Gestão de produtos, certificados de entrada (matéria-prima) e emissão de certificados de saída (produtos acabados).

## 2. Arquitetura Técnica

O projeto segue uma arquitetura moderna de aplicação web monolítica (modularizada).

### Tech Stack
- **Frontend**: 
  - React 18
  - TypeScript
  - Vite (Build tool)
  - Tailwind CSS + shadcn/ui (UI/UX)
  - TanStack Query (Gerenciamento de estado/server state)
  - Wouter (Roteamento leve)

- **Backend**:
  - Node.js
  - Express
  - TypeScript
  - Passport.js (Autenticação via Sessão/Cookie)

- **Banco de Dados**:
  - PostgreSQL
  - Drizzle ORM (Modelagem e Migrations)
  - Zod (Validação de schemas compartilhados entre front e back)

### Estrutura de Pastas
- `client/`: Código fonte do frontend (Pages, Components, Hooks).
- `server/`: Código fonte do backend (Routes, Auth, Middlewares, Services).
- `shared/`: Código compartilhado (Schemas do Drizzle/Zod, Tipos).
- `Readme/`: Documentação detalhada do projeto.
- `migrations/`: Arquivos de migração do banco de dados (Drizzle Kit).

## 3. Modelo de Dados (Core)

A modelagem de dados (definida em `shared/schema.ts`) é robusta e bem relacional.

### Entidades Principais
1.  **SaaS / Admin**:
    -   `plans`: Definição dos planos (A, B, C) e seus limites (storage, usuários).
    -   `modules`: Módulos do sistema (Core, Products, Certificates, etc.).
    -   `job_features`: Funcionalidades específicas dentro dos módulos.
    -   `plan_modules`: Associação N:N entre planos e módulos.
    -   `tenants`: Empresas clientes.

2.  **Produtos e Inventário**:
    -   Estrutura Hierárquica: `product_categories` -> `product_subcategories` -> `product_base` -> `products` (Variantes/SKUs).
    -   Características: `product_characteristics` (parâmetros de qualidade).

3.  **Certificados**:
    -   `entry_certificates`: Certificados recebidos de fornecedores (Link com `suppliers`, `manufacturers`, `products`).
    -   `entry_certificate_results`: Resultados dos testes de qualidade.
    -   `issued_certificates`: Certificados emitidos para clientes (Link com `clients`, `entry_certificates`).

## 4. Sistema de Permissões e Segurança

O sistema implementa uma segurança em camadas:

1.  **Autenticação**: Via `passport-local` e sessões express.
2.  **Isolamento de Tenant**: Middleware que garante que usuários só acessem dados do seu `tenant_id`.
3.  **Feature Gating**: Middleware `checkFeatureAccess` verifica se:
    -   O Tenant possui um plano ativo.
    -   O plano do Tenant inclui o módulo da funcionalidade.
    -   A rota acessada corresponde a uma `feature_path` habilitada.

Documentação de referência: `Readme/SISTEMA_PERMISSOES.md`.

## 5. Infraestrutura e Deploy

O projeto está configurado para ser flexível no deploy:
-   **Local**: `npm run dev` (Concorrência de front e back).
-   **Replit**: Otimizado para o ambiente Replit (`.replit` config).
-   **Docker**: Possui `Dockerfile` para conteinerização.
-   **Banco de Dados**: Requer PostgreSQL (local ou gerenciado como Neon/RDS).

## 6. Estado Atual e Próximos Passos (Observados)

O projeto parece estar em estágio avançado de desenvolvimento do Core.
-   **Implementado**: Estrutura base, autenticação, gestão de produtos, uploads, visualização de certificados HTML.
-   **Em Evolução**: Relatórios avançados, webhooks, integrações externas (conforme roadmap no Readme).

### Ambiente de Desenvolvimento Local (Configurado)
-   **Node.js**: v20 instalado.
-   **Banco de Dados**: PostgreSQL local configurado com usuário `appuser`.
-   **Driver**: Adaptado para `pg` (node-postgres) para compatibilidade local.
-   **Scripts**:
    -   `npm run db:seed`: Popula dados básicos (Planos, Módulos).
    -   `npm run db:reset`: Reseta totalmente o banco de dados.

## 7. Organização de Arquivos (Atualizada)

-   **`docs/`**: Documentação do projeto (antiga pasta `Readme`).
    -   `modulos_e_features.md`, `SISTEMA_PERMISSOES.md`: Documentação de referência (não utilizados pelo código).
    -   `archive/`: Guias de deploy antigos/depreciados.
-   **`scripts/`**: Scripts de manutenção (seed, reset).
-   **`server/`**: Código do backend.
-   **`client/`**: Código do frontend.
-   **`shared/`**: Schemas e tipos compartilhados.
-   **`README.md`**: Guia principal (na raiz).

---
*Última atualização: 10/02/2026*
