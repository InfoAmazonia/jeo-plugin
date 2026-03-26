# Contexto do Plugin JEO - Gemini CLI (v3.5.2-experimental Final)

O JEO é uma plataforma de geojornalismo para WordPress que permite a organizações de notícias, blogueiros e ONGs publicarem matérias jornalísticas como camadas de informações em mapas digitais interativos.

**Status Atual:** O projeto atingiu a versão **3.5.2-experimental**, consolidando a central de boas-vindas multi-idioma e a hierarquia profissional de menus.

## Visão Geral do Projeto

- **Tipo:** Plugin para WordPress
- **Propósito:** Plataforma de geojornalismo interativa focada no editor Gutenberg.
- **Principais Tecnologias:**
    - **Backend:** PHP (WordPress Plugin API, OOP, Custom Autoloader).
    - **Frontend:** JavaScript e TypeScript (React, Gutenberg Blocks, `@wordpress/scripts`).
    - **Mapas:** MapLibre GL JS, Mapbox GL JS e suporte estendido via React Map GL e Leaflet.
    - **Estilização:** CSS/Sass integrado ao fluxo do Webpack.
    - **Ambiente de Desenvolvimento:** Docker Compose (WordPress + MariaDB).

## Georreferenciamento com IA (v3.5.2)

O sistema conta com um Co-Piloto Editorial capaz de extrair coordenadas geográficas e citações contextuais de forma autônoma.

### 1. Arquitetura e IA
- **Provedores Suportados:** Gemini 2.5 Flash, OpenAI GPT-4o e DeepSeek Chat.
- **Resiliência:** Uso de Temperatura 0.1 e Prompts Agressivos para garantir saídas JSON puras e estruturadas.
- **Sistema de RAG Leve:** Suporte a dicionários territoriais brasileiros embarcados (10 categorias) que são injetados no prompt para aumentar a precisão em áreas socioambientais.

### 2. Interface e Experiência do Usuário (Settings)
- **Aba Knowledge Base:** Centraliza a gestão de dicionários JSON com ferramentas de Preview (Visualizer tabular e Raw JSON) e Download.
- **Engenharia de Prompt:** Painel interativo com assistente de chat para geração de prompts e validador ao vivo. Possui auto-save em `localStorage`.
- **Skeleton Loader:** Transições suaves de 1 segundo entre as abas das configurações com prevenção de FOUC e bloqueio de cliques durante a animação.

### 3. Hierarquia de Menus e Boas-Vindas
O plugin segue uma ordem rigorosa e profissional de navegação no WP Admin:
1. **Welcome (Default):** Central de documentação dinâmica que renderiza arquivos `README*.md` (Suporta English e Português Brasil via abas).
2. **Dashboard:** Mapa global interativo com enquadramento automático (`fitBounds`).
3. **Maps:** Listagem de mapas customizados.
4. **Layers:** Gestão de camadas geográficas.
5. **Storymaps:** Editor de narrativas espaciais.
6. **Settings:** Configurações globais e de IA.
7. **AI Debug Logs:** Submenu técnico para análise de logs em Pretty-JSON.

### 4. Segurança e Ciclo de Vida
O JEO v3.5.2-experimental implementa políticas rigorosas de proteção de credenciais:
- **Ao Desativar:** O sistema limpa automaticamente as **API Keys** e arquivos de log físicos para proteger as credenciais do usuário. Um alerta de confirmação em JS na tela de plugins previne desativações acidentais.
- **Ao Excluir (Uninstall):** Todas as configurações globais (`jeo-settings`) são removidas via `uninstall.php`.
- **Preservação de Dados:** Os metadados geográficos dos posts (`_related_point`) são preservados permanentemente, garantindo a integridade do acervo jornalístico.

## Construção e Execução

### 1. Ambiente Local de Dev
```bash
# Subir ambiente (WP + MariaDB)
docker-compose up -d

# Compilar assets JS/React em tempo real
npm install
npm run start
```

### 2. Deploy Seguro para Produção (`build.sh`)
O script `build.sh` compila e zipa a versão oficial **3.5.2-experimental**, incluindo automaticamente todos os arquivos de documentação Markdown e preservando ícones essenciais.

```bash
./build.sh
```
