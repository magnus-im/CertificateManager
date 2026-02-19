---
name: readme-architect
description: Analisa a estrutura do projeto e atualiza o arquivo README.md. Use quando o projeto evolui, novas funcionalidades são adicionadas ou para garantir que a documentação esteja atualizada.
---

# README Architect Skill

Esta skill é responsável por criar e manter o arquivo `README.md` do projeto, garantindo que ele esteja sempre atualizado, completo e siga um padrão visual profissional e consistente.

## Quando usar esta skill

- Quando o arquivo `README.md` não existir.
- Quando novas funcionalidades, módulos ou tecnologias forem adicionadas ao projeto.
- Quando houver mudanças na estrutura de pastas ou nos scripts de instalação.
- Quando o usuário solicitar explicitamente uma atualização da documentação.

## Como usar

Siga estes passos rigorosamente para garantir a qualidade da documentação.

### Passo 1: Análise de Contexto

Antes de escrever qualquer coisa, você deve entender o projeto profundamente:

1.  **Leia o `package.json`**: Identifique o nome do projeto, versão, scripts disponíveis e dependências principais (Tech Stack).
2.  **Liste a estrutura de arquivos**: Use `list_dir` na raiz e em pastas chave (`src`, `server`, `client`, etc.) para entender a arquitetura.
3.  **Procure por documentação existente**:
    -   Verifique se existe um arquivo `antigravity.md` (ou similar na pasta `.gemini/` ou raiz) que contenha anotações de arquitetura.
    -   Leia o `README.md` atual (se existir) para manter a consistência de informações que não podem ser inferidas (como explicações de negócio).

### Passo 2: Geração de Conteúdo

O arquivo `README.md` DEVE ser gerado em **Português do Brasil (pt-br)** e seguir a seguinte estrutura de seções. Use os emojis indicados para manter o estilo visual.

#### Estrutura Obrigatória

1.  **Cabeçalho Centralizado**:
    -   Use HTML (`<div align="center">`) para centralizar o Título e Subtítulo.
    -   **Badges**: Inclua badges do Shields.io abaixo do título (Status, Licença, Versão).
2.  **Descrição Detalhada**: 1-2 parágrafos explicando o problema que o projeto resolve e suas principais capacidades.
3.  **🚀 Funcionalidades (Features)**:
    -   Liste as funcionalidades principais em bullet points.
    -   Agrupe por módulos se o sistema for complexo (ex: "Módulo Gestão", "Módulo Cliente").
    -   *Dica*: Inferir funcionalidades baseando-se nos nomes das rotas (`routes.ts`), componentes (`components/`), e schemas de banco de dados (`schema.ts`).
4.  **🏗️ Arquitetura Técnica (Tech Stack)**:
    -   Liste Frontend, Backend, Banco de Dados, DevOps, etc.
    -   Destaque bibliotecas importantes (ex: Tailwind, React Query, Drizzle, etc.).
5.  **📂 Estrutura de Arquivos**:
    -   Gere uma árvore de arquivos simplificada das pastas principais.
    -   Adicione breves comentários explicando o propósito de cada diretório.
6.  **🛠️ Instalação e Uso**:
    -   **Pré-requisitos do Sistema**: Liste claramente o que precisa estar instalado *antes* (Node.js, PostgreSQL, Docker).
    -   **Aviso Importante**: Deixe claro que `npm install` cuida apenas das dependências do *projeto*, não do sistema operacional.
    -   Passo a passo numerado para rodar localmente (instalar deps, configurar env, rodar migrations, iniciar server).
    -   Liste os scripts principais (`npm run dev`, `npm run build`, etc.) com explicações.
    -   **Importante**: Mencione explicitamente que ao rodar `npm run dev`, o Frontend (Vite) roda na porta **5173** e o Backend na porta **5000**.
7.  **🔐 Credenciais (Opcional)**:
    -   Use **Tabelas Markdown** para listar usuários padrão (se houver seed).
    -   Exemplo: `| Usuário | Senha | Acesso |`
8.  **📝 Licença**:
    -   Mencione a licença do projeto (MIT, Proprietária, etc.).

### Passo 3: Guia de Estilo e Formatação

-   **Codificação**: O arquivo deve ser salvo estritamente em **UTF-8** (padrão GitHub).
-   **Layout Visual**:
    -   **Centralização**: Use HTML `<div align="center">` apenas no cabeçalho.
    -   **Badges**: Use badges para dar um aspecto profissional (`https://img.shields.io/...`).
    -   **Tabelas**: Sempre use tabelas para listas de dados estruturados (credenciais, variaveis de ambiente).
-   **Emojis**: Use emojis nos títulos de nível 2 (`##`) para dar vida ao documento.
    -   Exemplos: 🚀, 🏗️, 🔧, 📂, 📝, 🤝, 📞.
-   **Clareza**: Use linguagem clara, direta e profissional.
-   **Markdown**: Use formatação rica (negrito, itálico, code blocks) para melhorar a legibilidade.

### Passo 4: Execução

1.  Gere o conteúdo completo em memória seguindo o layout aprimorado.
2.  Use a ferramenta `write_to_file` para criar ou sobrescrever o arquivo `README.md` na raiz do projeto.
3.  Opcional: Se o projeto tiver uma pasta `docs/`, verifique se há necessidade de criar arquivos auxiliares, mas mantenha o `README.md` principal como a fonte da verdade.
