# Manutenção de dependências

O JEO usa a manutenção de dependências nativa do GitHub para atualizações de rotina e mantém
a lógica customizada do repositório limitada a verificações de release e de runtime específicas do plugin.

## Manutenção automatizada

- O Dependabot abre pull requests semanais contra o `develop` para atualizações de npm, Composer
  e GitHub Actions.
- O Dependency Review roda em pull requests e falha quando uma mudança de dependência
  introduz uma vulnerabilidade de alta severidade ou pior.
- `npm audit --package-lock-only` e `composer audit --locked` continuam sendo os
  comandos locais para verificar os lockfiles atuais.

## Revisando pull requests de atualização

1. Verifique se a atualização é de patch, minor, major ou uma mudança de GitHub Action.
2. Revise o resultado do Dependency Review em busca de advisories recém-introduzidos.
3. Execute as verificações locais relevantes:
   - Atualização de npm ou frontend: `npm ci`, `npm run build`, `npm run build:report`
     e `npm run test:unit`.
   - Atualização de PHP ou Composer: `composer install`, `composer audit --locked`,
     `vendor/bin/phpcs --standard=phpcs.xml.dist` e
     `vendor/bin/phpcs --standard=phpcs-compat.xml.dist`.
   - Atualização sensível ao runtime: execute o teste de smoke do WordPress ou aguarde o
     workflow WordPress Smoke Tests.
4. Para atualizações major, confirme que os fluxos de editor, mapa, mapa narrativo, Discovery,
   geocodificação e renderização pública afetados pelo pacote ainda se comportam corretamente.

## Overrides

O bloco `overrides` no `package.json` é reservado para pins temporários de segurança,
compatibilidade ou pacotes locais. Cada override deve ser removido quando a dependência
upstream não precisar mais dele.

Ao adicionar ou alterar um override, inclua o motivo e a condição de remoção na descrição
do pull request. Revisite os overrides ativos após atualizações major de `@wordpress/scripts`,
Gutenberg, React ou webpack.
