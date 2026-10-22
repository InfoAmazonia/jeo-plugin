# Plano de Implementação: NeuronAI Structured Output para Georeferencing

## Contexto

Atualmente o JEO força o schema JSON de georeferencing injetando instruções agressivas no system prompt (`AI_Adapter::get_system_prompt()`). O LLM retorna texto livre e o JEO usa regex (`parse_json_from_text()`) para extrair o JSON — uma abordagem frágil que depende da "obediência" do modelo ao prompt.

O NeuronAI (v3.3+) possui recurso nativo de **Structured Output** que:
- Gera JSON Schema automaticamente a partir de classes PHP tipadas
- Envia o schema ao provider (OpenAI, Gemini, Anthropic, etc.) via API nativa
- Faz parsing, desserialização e validação automática da resposta
- Possui retry automático informando ao LLM quais campos falharam

## Objetivo

Migrar o georeferencing do JEO para usar NeuronAI Structured Output como **caminho primário**, mantendo o parser de texto atual como **fallback robusto**, com **zero impacto** no funcionamento atual.

## Como Funciona o Structured Output do NeuronAI

### 1. Definição de Schema via PHP

```php
use NeuronAI\StructuredOutput\SchemaProperty;
use NeuronAI\StructuredOutput\Validation\NotBlank;
use NeuronAI\StructuredOutput\Validation\GreaterThanEqual;
use NeuronAI\StructuredOutput\Validation\LowerThanEqual;

class LocationOutput {
    #[SchemaProperty(description: "The location name")]
    #[NotBlank]
    public string $name;

    #[SchemaProperty(description: "Latitude as float or string")]
    public float $lat;

    #[SchemaProperty(description: "Longitude as float or string")]
    public float $lon;

    #[SchemaProperty(description: "Short relevant snippet from the text")]
    public string $quote;

    #[SchemaProperty(description: "Confidence score 0-100")]
    #[GreaterThanEqual(0)]
    #[LowerThanEqual(100)]
    public int $confidence;

    #[SchemaProperty(description: "Whether this is the primary geographic focus")]
    public bool $is_primary;
}
```

### 2. Array de Objetos

O NeuronAI não suporta array como raiz do schema. Usamos uma **classe wrapper**:

```php
class GeoreferenceResult {
    #[SchemaProperty(
        description: "List of geographic locations found in the text",
        anyOf: [LocationOutput::class]
    )]
    public array $locations;
}
```

O LLM retorna: `{"locations": [{"name": "...", "lat": -3.13, ...}]}`

### 3. Execução

```php
$result = $agent->structured(
    messages: new UserMessage($user_text),
    class: GeoreferenceResult::class,
    maxRetries: 3
);

$locations = $result->locations; // array de LocationOutput objects
```

### 4. Retry Automático

Se o LLM omitir um campo obrigatório ou usar tipo errado, o NeuronAI:
1. Captura o erro de validação
2. Reenvia a requisição informando exatamente o que falhou
3. Repete até `maxRetries` (default: 1, recomendado: 3)

## Arquitetura Proposta

### Estratégia de Zero Impacto

**Feature Toggle** (`ai_use_structured_output`) com fallback transparente:

```
┌─────────────────────────────────────────┐
│  Neuron_Adapter::georeference()         │
│                                         │
│  IF ai_use_structured_output = true     │
│    TRY structured output                │
│      RETURN locations array             │
│    CATCH any exception                  │
│      FALLBACK to parse_json_from_text() │
│  ELSE                                   │
│    USE parse_json_from_text() (current) │
│                                         │
└─────────────────────────────────────────┘
```

### Componentes

#### 1. Classes de Structured Output (novas)

**Arquivo:** `src/includes/ai/structured/location-output.php`
**Arquivo:** `src/includes/ai/structured/georeference-result.php`

- `LocationOutput` — representa um ponto de georeferencing
- `GeoreferenceResult` — wrapper com array de `LocationOutput`

#### 2. Neuron_Agent (modificado)

**Arquivo:** `src/includes/ai/class-neuron-agent.php`

Novo método `run_georeference_structured()`:
- Chama `$this->structured()` com `GeoreferenceResult::class`
- Retorna array de arrays (para compatibilidade com `parse_json_from_text()`)
- Remove a necessidade do schema agressivo no prompt

#### 3. Neuron_Adapter (modificado)

**Arquivo:** `src/includes/ai/class-neuron-adapter.php`

Novo fluxo `georeference()`:
1. Se `ai_use_structured_output` estiver ativo:
   - Chama `run_georeference_structured()`
   - Se sucesso, converte objetos para array e retorna
   - Se falha (exceção), loga e cai no fallback
2. Fallback: usa o fluxo atual (`get_system_prompt()` + `parse_json_from_text()`)

#### 4. AI_Settings (modificado)

**Arquivo:** `src/includes/ai/settings/tab-general.php`

Novo toggle:
- **Label:** "Use NeuronAI Structured Output"
- **Descrição:** "Use native schema enforcement instead of prompt-based JSON extraction. Falls back to text parsing if structured output fails."
- **Default:** `false` (inicialmente, para testes graduais)

#### 5. AI_Adapter (modificado)

**Arquivo:** `src/includes/class-ai-adapter.php`

Ajuste em `get_system_prompt()`:
- Quando `ai_use_structured_output` está ativo, o schema agressivo não precisa mais ser injetado
- Ou pode ser mantido como safety net, mas com nota de depreciação

## Passos de Implementação

### Fase 1: Infraestrutura (sem impacto no runtime)

1. **Criar classes de structured output**
   - `src/includes/ai/structured/location-output.php`
   - `src/includes/ai/structured/georeference-result.php`
   - Adicionar autoload no `composer.json` (se necessário) ou usar `require_once`

2. **Adicionar setting `ai_use_structured_output`**
   - `class-settings.php`: default `false`, tipo boolean
   - `tab-general.php`: checkbox com descrição

3. **Criar novo método no Neuron_Agent**
   - `run_georeference_structured($system_prompt, $user_text, &$input_tokens, &$output_tokens)`
   - Usa `$this->structured()` com `GeoreferenceResult::class, maxRetries: 3`
   - Converte `LocationOutput[]` para array associativo (compatibilidade)

4. **Modificar Neuron_Adapter**
   - Adicionar lógica de feature toggle
   - Try/catch para structured output com fallback para `parse_json_from_text()`

### Fase 2: Testes (isolated)

1. **Testar com provider Gemini**
   - Gemini já usa `responseMimeType: application/json` — structured output é nativo
   - Verificar se o schema gerado é enviado corretamente

2. **Testar com provider OpenAI**
   - OpenAI suporta `json_schema` no modo structured — verificar compatibilidade

3. **Testar fallback**
   - Desligar structured output e confirmar que o fluxo antigo continua funcionando
   - Simular falha no structured output (ex: modelo que não suporta) e verificar fallback

4. **Smoke test**
   - Rodar `scripts/wordpress-smoke.sh` com structured output ligado e desligado

### Fase 3: Rollout Gradual

1. **Default false em produção**
   - Monitorar logs de erros por 1-2 semanas

2. **Habilitar para providers específicos**
   - Gemini e OpenAI primeiro (melhor suporte a structured output)
   - DeepSeek, Anthropic, Mistral em seguida

3. **Tornar default true**
   - Após validação em produção
   - Remover o schema agressivo do prompt (reduz tokens de input)

## Riscos e Mitigações

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| Provider não suporta JSON Schema nativo | Média | Alto | Fallback automático para `parse_json_from_text()` |
| LLM ignora schema e retorna texto livre | Baixa | Médio | Retry do Neuron (maxRetries: 3) + fallback |
| Schema gerado é muito grande (consumo de tokens) | Baixa | Médio | Monitorar; schema é menor que o prompt atual |
| Quebra de compatibilidade com custom prompts | Média | Alto | Feature toggle; custom prompts continuam usando texto livre |
| `lat`/`lon` como float vs string | Baixa | Médio | Usar `string` no schema e converter no adapter |

## Benefícios Esperados

1. **Maior confiabilidade**: schema validado pelo provider, não apenas "sugerido" no prompt
2. **Menos tokens de input**: remove ~300-400 tokens do schema agressivo do prompt
3. **Retry inteligente**: Neuron informa exatamente qual campo falhou ao LLM
4. **Tipagem forte**: propriedades validadas como `float`, `int`, `bool` antes de chegar ao JEO
5. **Extensibilidade**: fácil adicionar novos campos (ex: `country`, `region`) na classe PHP

## Arquivos Envolvidos

### Novos
- `src/includes/ai/structured/location-output.php`
- `src/includes/ai/structured/georeference-result.php`

### Modificados
- `src/includes/ai/class-neuron-agent.php`
- `src/includes/ai/class-neuron-adapter.php`
- `src/includes/class-ai-adapter.php`
- `src/includes/settings/class-settings.php`
- `src/includes/ai/settings/tab-general.php`
- `src/includes/ai/class-ai-settings.php` (se necessário)

---

*Plano criado em 2026-05-06. Revisar após implementação da Fase 1.*
