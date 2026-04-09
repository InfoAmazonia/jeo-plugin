# Planejamento: Integração JEO MCP Server (v3.7.0-alpha)

Este documento descreve a estratégia para transformar o JEO em um **Hub de Contexto Geográfico** para agentes de IA, utilizando o padrão **Model Context Protocol (MCP)** via biblioteca `php-mcp/server`.

---

## 1. Visão Geral
O objetivo é permitir que IAs externas (Cursor, Windsurf, Claude Desktop) e outros agentes consumam as capacidades de geoprocessamento e o motor de IA do JEO de forma nativa e padronizada.

### Benefícios:
- **Zero-Config para Desenvolvedores:** IDEs com suporte a MCP podem "entender" o banco de dados geográfico do JEO sem documentação manual.
- **Interoperabilidade:** O motor **Neuron AI** do JEO torna-se um provedor de ferramentas para outros sistemas.
- **Validação em Tempo Real:** Agentes podem validar coordenadas contra as camadas (layers) do WordPress antes de salvar.

---

## 2. Arquitetura de Integração

### 2.1. Camada de Transporte
Utilizaremos dois métodos de exposição:
1.  **WP-CLI (Stdio):** Focado em desenvolvedores locais. Um comando `wp jeo mcp start` iniciará o servidor via STDIN/STDOUT.
2.  **SSE (Server-Sent Events):** Endpoint REST API (`/wp-json/jeo/v1/mcp`) para conexões remotas seguras.

### 2.2. Mapeamento de Ferramentas (Tools)
As ferramentas serão registradas via PHP 8 Attributes em uma nova classe `Jeo\MCP\Bridge`.

| Nome da Ferramenta | Descrição | Classe JEO Relacionada |
| :--- | :--- | :--- |
| `extract_locations` | Extrai entidades geográficas de um texto bruto. | `AI_Adapter` |
| `validate_coordinates` | Verifica se um ponto está dentro de uma BBox ou camada. | `Geocoders` |
| `get_post_geometry` | Retorna o `_related_point` de um post específico. | `Post_Meta` |
| `search_layers` | Busca camadas GeoJSON disponíveis no sistema. | `Layers` |

### 2.3. Recursos (Resources)
Permitem que a IA "leia" dados do JEO como arquivos de contexto.
- `jeo://settings/ai-rules`: Retorna o System Prompt e regras constitucionais atuais.
- `jeo://layers/{id}/geojson`: Acessa o dado geográfico bruto de uma camada.
- `jeo://logs/ai-usage`: Estatísticas de consumo de tokens para análise da IA.

---

## 3. Plano de Implementação

### Fase 1: Fundação (MVP)
- Adicionar `php-mcp/server` ao `composer.json`.
- Implementar o comando WP-CLI básico para inicializar o `ServerBuilder`.
- Expor a ferramenta `extract_locations` (conectando ao Neuron AI).

### Fase 2: Expansão de Contexto
- Implementar `ResourceTemplates` para acessar metadados de posts.
- Adicionar suporte a `Prompts` (templates de conversação para geojornalismo).

### Fase 3: Segurança e Produção
- Implementar autenticação via Application Passwords para o transporte SSE.
- Adicionar cache (PSR-16) para respostas de ferramentas MCP pesadas.

---

## 4. Exemplo de Código (Protótipo)

```php
namespace Jeo\MCP;

use Mcp\Server\Attributes\McpTool;
use Jeo\AI\Neuron_Adapter;

class Bridge {
    #[McpTool(
        name: "jeo_extract_locations", 
        description: "Analisa um texto jornalístico e extrai locais com lat/lng usando o motor de IA do JEO."
    )]
    public function extract(string $text): array {
        // Reutiliza a lógica central do plugin
        return Neuron_Adapter::get_locations($text);
    }
}
```

---

## 5. Próximos Passos
1. Validar a performance do ReactPHP (dependência do mcp-server) dentro do ambiente WordPress.
2. Criar um repositório de testes com o Claude Desktop para validar a descoberta automática de ferramentas.

---
*Documento gerado em: 1 de Abril de 2026*
