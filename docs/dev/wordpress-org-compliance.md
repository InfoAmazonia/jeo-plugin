# WordPress.org Plugin Directory — Compliance Guidelines

> Consolidado a partir das diretrizes oficiais do WordPress.org Plugin Directory.  
> Fonte: https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/  
> Ultima atualizacao das diretrizes: Marco 2024

---

## 1. Licenca

**Diretriz:** Plugins must be compatible with the GNU General Public License v2 (or later).

- Todo o codigo, dados e imagens hospedados no diretorio WordPress.org devem ser compativeis com GPL ou GPL-Compatible.
- Bibliotecas de terceiros incluidas tambem devem ser compativeis.
- Recomendado: usar a mesma licenca do WordPress — GPLv2 or later.

---

## 2. Responsabilidade do Desenvolvedor

**Diretriz:** Developers are responsible for the contents and actions of their plugins.

- O desenvolvedor e o unico responsavel por garantir que todos os arquivos do plugin estejam em conformidade.
- Escrever codigo intencionalmente para contornar diretrizes e proibido.
- Antes de fazer upload para SVN, confirmar a licenca de todos os arquivos (codigo, imagens, bibliotecas).
- Cumprir os termos de uso de todas as APIs e servicos de terceiros utilizados.

---

## 3. Versao Estavel Disponivel

**Diretriz:** A stable version of a plugin must be available from its WordPress Plugin Directory page.

- A unica versao distribuida pelo WordPress.org e a do diretorio.
- Distribuir codigo por metodos alternativos sem manter o codigo hospedado atualizado pode resultar em remocao.
- O trunk/readme.txt deve sempre refletir a versao atual do plugin.

---

## 4. Codigo Legivel

**Diretriz:** Code must be (mostly) human readable.

- Nao e permitido ofuscar codigo com tecnicas similares a p,a,c,k,e,r, uglify mangle, ou convencoes de nomes obscuras ($z12sdf813d).
- O codigo-fonte deve estar incluido no plugin ou haver um link no readme para o local de desenvolvimento.
- Recomendado documentar como usar as ferramentas de build.

---

## 5. Sem Trialware

**Diretriz:** Trialware is not permitted.

- Funcionalidade nao pode ser restrita ou bloqueada, liberada apenas por pagamento ou upgrade.
- Funcionalidade nao pode ser desabilitada apos periodo de trial ou quota atingida.
- Plugins que fornecem apenas acesso sandbox a APIs tambem sao proibidos.
- Permitido: upsell de produtos adicionais, desde que nao viole a diretriz 11 (hijacking).

---

## 6. Software as a Service (SaaS) Permitido

**Diretriz:** Software as a Service is permitted.

- Plugins que atuam como interface para servicos externos sao permitidos, mesmo pagos.
- O servico deve ter funcionalidade de substancia e ser documentado no readme.
- Nao permitido:
  - Servico que existe apenas para validar licencas/keys.
  - Mover codigo arbitrario para fora do plugin para o servico parecer fornecer funcionalidade extra.
  - Storefronts que nao sao servicos.

---

## 7. Sem Rastreamento Sem Consentimento

**Diretriz:** Plugins may not track users without their consent.

- Plugins nao podem contatar servidores externos sem consentimento explicito e autorizado.
- Exemplos proibidos:
  - Coleta automatizada de dados do usuario sem confirmacao explicita.
  - Induzir usuarios a submeter informacao como requisito para usar o plugin.
  - Offloading de assets (imagens, scripts) nao relacionados a um servico.
  - Mecanismos de publicidade de terceiros que rastreiam uso/views.
- Excecao: SaaS como Twitter, Amazon CDN, Akismet — consentimento e implicito ao configurar.

---

## 8. Sem Codigo Executavel Via Terceiros

**Diretriz:** Plugins may not send executable code via third-party systems.

- Externamente carregar codigo de servicos documentados e permitido, mas a comunicacao deve ser segura.
- Nao permitido:
  - Instalar plugins, temas ou add-ons de servidores que nao sejam WordPress.org.
  - Instalar versoes premium do mesmo plugin.
  - Chamar CDN de terceiros por razoes que nao sejam inclusao de fontes; todo JS/CSS nao relacionado a servico deve ser incluido localmente.
  - Usar iframes para conectar paginas de admin; APIs devem ser usadas para minimizar riscos.

---

## 9. Legalidade e Etica

**Diretriz:** Developers and their plugins must not do anything illegal, dishonest, or morally offensive.

- Manipulacao artificial de resultados de busca (keyword stuffing, black hat SEO).
- Oferecer aumento de trafego.
- Compensar, enganar ou extorquir por reviews.
- Criar contas falsas para reviews (sockpuppeting).
- Utilizar recursos do servidor sem permissao (botnets, crypto-mining).

---

## 10. Sem Links/Creditos Externos Sem Permissao

**Diretriz:** Plugins may not embed external links or credits on the public site without explicitly asking the user's permission.

- Nao adicionar links ou creditos no frontend sem opt-in explicito do usuario.

---

## 11. Nao Hijack o Dashboard

**Diretriz:** Plugins should not hijack the admin dashboard.

- Nao adicionar widgets obrigatorios, notificacoes intrusivas, ou redirecionamentos forcados apos ativacao.
- Upsell deve ser moderado e nao interferir na experiencia de admin.

---

## 12. Readme Sem Spam

**Diretriz:** Public facing pages on WordPress.org (readmes) must not spam.

- Maximo de 12 tags.
- Sem affiliate links desnecessarios.
- Sem tags de plugins concorrentes.
- Sem keyword stuffing ou blackhat SEO.
- Readmes devem ser escritos para pessoas, nao bots.
- Links afiliados devem ser divulgados e apontar diretamente para o servico.

---

## 13. Usar Bibliotecas Padrao do WordPress

**Diretriz:** Plugins must use WordPress' default libraries.

- WordPress inclui jQuery, Atom Lib, SimplePie, PHPMailer, PHPass, etc.
- Plugins nao podem incluir essas bibliotecas no proprio codigo.
- Devem usar as versoes empacotadas com o WordPress.

---

## 14. Evitar Commits Frequentes

**Diretriz:** Frequent commits to a plugin should be avoided.

- O repositorio SVN e de release, nao de desenvolvimento.
- Apenas codigo pronto para deploy deve ser enviado.
- Commits rapidos e repetidos que apenas ajustam aspectos menores podem ser vistos como gaming da lista Recently Updated.

---

## 15. Incrementar Versao a Cada Release

**Diretriz:** Plugin version numbers must be incremented for each new release.

- Usuarios so sao alertados de updates quando a versao aumenta.
- O readme.txt do trunk deve sempre refletir a versao atual.

---

## 16. Plugin Completo na Submissao

**Diretriz:** A complete plugin must be available at the time of submission.

- Nao e possivel reservar nomes para uso futuro.
- Um zip completo e exigido na submissao.

---

## 17. Respeitar Marcas Registradas

**Diretriz:** Plugins must respect trademarks, copyrights, and project names.

- Nao usar marcas registradas ou nomes de outros projetos como termo inicial do slug.
- Exemplo: nao usar wordpress no slug.

---

## Requisitos Adicionais de Seguranca e Privacidade

### Seguranca
- Todo input do usuario deve ser validado e sanitizado.
- Todo output deve ser escapado.
- Usar nonces para proteger acoes.
- Verificar capabilities antes de executar acoes administrativas.
- Nao gerar notices/warnings com WP_DEBUG ativado.

### Privacidade
- Plugins que coletam, usam, armazenam ou passam dados pessoais a terceiros devem usar wp_add_privacy_policy_content().
- Devem fornecer callbacks de Personal Data Exporter e Personal Data Eraser quando aplicavel.
- Devem documentar quais dados sao coletados, como sao usados e com quem sao compartilhados.

### Plugin Check (PCP)
- O WordPress.org exige que novos plugins passem no Plugin Check antes da aprovaao.
- Plugins re-listados apos problemas de seguranca tambem devem passar nos checks de seguranca.
- O PCP verifica: seguranca, performance, acessibilidade, i18n, e conformidade com diretrizes.

---

## Checklist de Submissao

- [ ] Licenca GPL compativel (GPLv2 ou later)
- [ ] readme.txt valido com todos os headers obrigatorios
- [ ] Codigo legivel, nao ofuscado
- [ ] Sem trialware
- [ ] Sem tracking sem consentimento explicito
- [ ] Sem codigo executavel de terceiros (exceto SaaS documentado)
- [ ] Sem hijack de dashboard
- [ ] Maximo 12 tags no readme
- [ ] Usa bibliotecas padrao do WordPress (nao inclui jQuery, etc.)
- [ ] Versao incrementada
- [ ] Plugin completo e funcional
- [ ] Nome do plugin nao viola marcas registradas
- [ ] Seguranca: input sanitizado, output escapado, nonces, capabilities
- [ ] Privacidade: wp_add_privacy_policy_content() se aplicavel
- [ ] Passa no Plugin Check (PCP)
