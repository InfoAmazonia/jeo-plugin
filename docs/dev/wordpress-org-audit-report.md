# WordPress.org Plugin Directory — Audit Report

> Data da auditoria: 2026-05-11
> Versao auditada: JEO 3.6.5
> Plugin: JEO WP (jeo/jeo.php)
> Baseado nas diretrizes oficiais: https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/

---

## Resumo Executivo

| Categoria | Status | Acoes Requeridas |
|---|---|---|
| Licenca | ALERTA | Texto da licenca e GPL v3, mas header declara GPL-2.0+ |
| readme.txt | FALHA | Faltam Tags (0/1-12), Requires PHP desatualizado |
| Seguranca — Input/Output | FALHA | CSS injection via loaders.php; AJAX sem capability check |
| Seguranca — REST/AJAX | PASS | Nonces e permission_callbacks presentes |
| Seguranca — DB/Arquivos | PASS | Queries preparadas, caminhos hardcoded |
| Privacidade | FALHA | Sem wp_add_privacy_policy_content(), sem exporter/eraser |
| External Assets | ALERTA | Select2 do CDN, MapLibre do unpkg, Google Fonts |
| Dashboard Hijacking | PASS | Sem redirecionamentos forçados ou notificacoes intrusivas |
| Trialware/Upsell | PASS | Sem funcionalidade bloqueada |
| Tracking | PASS | Sem analytics/telemetry |
| Bibliotecas WP | PASS | Nao inclui jQuery ou outras libs padrao localmente |
| Uninstall | FALHA | Cleanup incompleto — deixa AI logs e vector stores |
| Build/Code Quality | PASS | Codigo legivel, sem eval/exec, sem ofuscacao |

**Veredicto: NAO ADERENTE para submissao na WordPress.org Plugin Directory.**

---

## 1. Licenca (Diretriz #1)

| Item | Status | Detalhe |
|---|---|---|
| LICENSE (repo root) | ALERTA | Texto e GPL v3, nao GPL v2 |
| src/LICENSE.txt | ALERTA | Texto e GPL v3 |
| readme.txt License | PASS | Declara GPL-2.0+ |
| jeo.php License | PASS | Declara GPL-2.0+ |

**Recomendacao:** O arquivo LICENSE deveria conter o texto da GPL v2, ou o header deveria ser atualizado para GPL-3.0-or-later para alinhar com o arquivo.

---

## 2. readme.txt (Diretriz #12, #15)

| Header | Status | Valor |
|---|---|---|
| Contributors | PASS | earthjournalism |
| Tags | FALHA | **AUSENTE** — necessario 1 a 12 tags |
| Tested up to | PASS | 6.8.2 |
| Stable tag | PASS | 3.6.5 |
| Requires PHP | ALERTA | 8.0 (mas jeo.php exige 8.2+ em runtime) |
| Requires at least | PASS | 6.6 |
| License | PASS | GPL-2.0+ |
| Third Party Services | PASS | Presente |

**Acoes:**
1. Adicionar header `Tags:` com 1-12 tags relevantes (ex: maps, geolocation, gutenberg, storymap, cartography, mapbox, maplibre, blocks, interactive, journalism, openstreetmap, spatial)
2. Sincronizar `Requires PHP` com o runtime check (8.2).

---

## 3. Seguranca

### 3.1 Superglobals e Sanitizacao — PASS

Todos os acessos a `$_GET`/`$_POST` estao sanitizados via `sanitize_text_field`, `sanitize_key`, etc.

### 3.2 REST API — PASS

Todas as rotas REST tem `permission_callback` apropriado.

### 3.3 AJAX Endpoints — ALERTA

| Endpoint | Nonce | Capability |
|---|---|---|
| `wp_ajax_jeo_geocode` | `check_ajax_referer` | **AUSENTE** |
| `wp_ajax_jeo_reverse_geocode` | `check_ajax_referer` | **AUSENTE** |

**Recomendacao:** Adicionar `current_user_can('edit_posts')` para defesa em profundidade.

### 3.4 Output Escaping — FALHA CRITICA

**Arquivo:** `src/includes/loaders.php`, funcao `jeo_custom_settings_css()`

Valores das settings sao concatenados diretamente em CSS sem escape adequado:
- `$jeo_font` usa `wp_kses(..., null)` — nao escapa aspas CSS
- `$jeo_info_font_size` sem casting numerico
- Cores sem `sanitize_hex_color()`

**Fix necessario:** Aplicar `esc_attr()` a fontes, `floatval()` a tamanhos, `sanitize_hex_color()` a cores.

---

## 4. Privacidade

### 4.1 wp_add_privacy_policy_content() — FALHA

**Status:** NAO implementado.

O plugin coleta e processa dados pessoais (geolocalizacao, logs de AI, vector stores).

**Fix:** Implementar `wp_add_privacy_policy_content()` descrevendo:
- Servicos de terceiros usados
- Retencao de dados de geolocalizacao
- Retencao de logs de AI

### 4.2 Personal Data Exporter / Eraser — FALHA

**Status:** NAO implementados.

O plugin armazena dados pessoais em post meta (`_related_point`, `_jeo_ai_pending_point`) e CPT (`jeo-ai-log`).

**Fix:** Registrar callbacks via `wp_privacy_personal_data_exporter` e `wp_privacy_personal_data_eraser`.

### 4.3 Browser Geolocation — ALERTA

**Arquivo:** `src/js/src/stories-near-you/stories-near-you-frontend.js`

Chama `navigator.geolocation.getCurrentPosition()` automaticamente ao carregar a pagina, sem dialogo de consentimento.

**Fix:** Adicionar um botao "Usar minha localizacao" em vez de solicitar automaticamente.

---

## 5. External Assets (Diretriz #8)

| Dominio | Asset | Context | Status |
|---|---|---|---|
| `cdnjs.cloudflare.com` | Select2 CSS/JS | Settings page | ALERTA — nao e fonte nem SaaS |
| `unpkg.com` | MapLibre GL JS | Admin dashboard | ALERTA — deveria usar a versao do WordPress ou bundle local |
| `fonts.googleapis.com` | Google Fonts | Frontend/admin | ALERTA — WP.org prefere fontes locais |
| `fonts.openmaptiles.org` | MapLibre glyphs | Build output | **REMOVIDO** em correcao anterior |
| `raw.githubusercontent.com` | Leaflet icons | Source/build | **REMOVIDO** em correcao anterior |

**Recomendacao:** Bundle local do Select2 e considerar fontes locais.

---

## 6. Uninstall (Diretriz de Privacidade)

**Arquivo:** `src/uninstall.php`

| Dado | Cleanup | Status |
|---|---|---|
| `jeo-settings` (option) | delete_option | PASS |
| Post meta (`_related_point`, `_geocode_*`) | **PRESERVADO intencionalmente** | ALERTA |
| CPT `jeo-ai-log` | **NAO removido** | FALHA |
| Vector stores (`wp-content/uploads/jeo-ai-store/`) | **NAO removido** | FALHA |
| Options auxiliares (`jeo_bulk_ai_cron_logs`, etc.) | **NAO removidos** | FALHA |
| Transients (`jeo_nominatim_*`) | **NAO removidos** | FALHA |

**Fix:** Remover CPTs, opcoes auxiliares, transients e vector stores no uninstall. Post meta pode ser opcional.

---

## 7. Dashboard Hijacking (Diretriz #11)

**Status: PASS**

- Sem redirecionamento pos-ativacao
- Sem notificacoes persistentes ou promocionais
- Sem widgets no dashboard
- Sem upselling

---

## 8. Trialware (Diretriz #5)

**Status: PASS**

- Sem funcionalidade bloqueada por pagamento
- Sem licenca/trial/upgrade

---

## 9. Tracking (Diretriz #7)

**Status: PASS**

- Sem analytics (Google Analytics, Matomo, etc.)
- Sem tracking pixels
- Sem telemetry
- Sem setcookie()

---

## 10. Bibliotecas Padrao do WordPress (Diretriz #13)

**Status: PASS**

- Nao inclui jQuery, jQuery UI, SimplePie, PHPMailer, PHPass localmente
- Usa `wp_enqueue_script()` para dependencias do WordPress

---

## 11. Build / Code Quality (Diretriz #4)

**Status: PASS**

- Codigo fonte legivel (sem obfuscacao)
- Sem uso de `eval()`, `exec()`, `system()`, `shell_exec()`
- Bundles minificados gerados por webpack, com source disponivel em `src/js/src/`

---

## Checklist de Acoes para Deploy

### CRITICO (bloqueia aprovacao)
- [ ] **Adicionar Tags no readme.txt** (1-12 tags)
- [ ] **Corrigir CSS escaping** em `loaders.php` (`jeo_custom_settings_css()`)
- [ ] **Implementar** `wp_add_privacy_policy_content()`
- [ ] **Implementar** Personal Data Exporter e Eraser
- [ ] **Completar uninstall** (remover AI logs, vector stores, opcoes auxiliares)

### ALTO (recomendado)
- [ ] **Sincronizar** `Requires PHP` para 8.2 no readme.txt
- [ ] **Adicionar capability check** aos endpoints AJAX de geocoding
- [ ] **Adicionar consentimento explicito** para geolocalizacao no Stories Near You
- [ ] **Bundle local do Select2** (evitar CDN externo)
- [ ] **Licenca:** Alinhar texto do arquivo LICENSE com o header (GPL v2 ou v3)

### MEDIO (melhoria)
- [ ] **Fontes locais:** Considerar self-hosting das fontes Google
- [ ] **MapLibre:** Documentar que o carregamento do unpkg e uma dependencia de servico
