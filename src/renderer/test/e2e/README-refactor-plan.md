# Plano de Refatoracao dos Testes E2E

## Objetivo

Manter os testes e2e validando fluxos reais pela UI, mas retirar da UI o que for apenas preparacao de dados e limpeza. Setup e teardown devem ser feitos por helper de API/banco controlado, enquanto cada spec exercita pela UI somente o comportamento que pretende provar.

## Regra de desenho

- Fluxo sob teste: pela UI.
- Pre-condicao de dados: por API/helper e2e.
- Limpeza: por API/helper e2e.
- Specs de CRUD continuam cobrindo CRUD pela UI, mas outros specs nao devem depender desses CRUDs para preparar dados.

## Ordem Recomendada

1. Criar helper e2e de API/test data.
2. Migrar `reports-export.spec.ts`, que hoje falha no teardown e tem o maior acoplamento.
3. Migrar specs que dependem de cliente/projeto como pre-condicao: `costs.spec.ts`, `revenues.spec.ts`, `daily-logs.spec.ts`.
4. Migrar `projects.spec.ts` para criar o cliente base por API.
5. Revisar specs de CRUD simples: `clients.spec.ts`, `machines.spec.ts`, `operators.spec.ts`.
6. Melhorar helpers comuns, especialmente navegacao e esperas pos-delete.
7. Rodar suite completa em headed e headless.

## Alvo por Spec

### `auth.spec.ts`

Continuar 100% UI. Login, login invalido e logout sao exatamente o fluxo sob teste.

### `clients.spec.ts`

Continuar UI. Este spec e o dono da cobertura de CRUD de cliente.

### `machines.spec.ts`

Continuar UI. Este spec e o dono da cobertura de CRUD de maquina.

### `operators.spec.ts`

Continuar UI. Este spec e o dono da cobertura de CRUD de operador.

### `projects.spec.ts`

Criar cliente base por API. Testar criar, filtrar, editar e excluir projeto pela UI.

### `costs.spec.ts`

Criar cliente/projeto por API. Testar criar, listar, editar e excluir custo pela UI.

### `revenues.spec.ts`

Criar cliente/projeto por API. Testar criar, listar, editar e excluir receita pela UI.

### `daily-logs.spec.ts`

Criar cliente/projeto e demais dependencias necessarias por API. Testar criar, listar, editar e excluir diario pela UI.

### `reports-export.spec.ts`

Criar cliente/projeto/custo/receita por API. Testar apenas a tela de relatorios e a exportacao pela UI.

### `dashboard.spec.ts`

Separar em smoke test com banco vazio ou seed controlado por API para validar metricas conhecidas.

## Melhorias de Estabilidade

- Fixture `page` deve iniciar autenticada por estado de sessao controlado, nao por login UI repetido.
- O `userData` do Electron em e2e deve ser isolado por teste via `VIANA_E2E_USER_DATA_DIR`.
- Chamadas de dominio no processo principal devem ler o estado atual da sessao para montar `Authorization`, sem validar `/auth/me` em cada request.
- Apos confirmar delete pela UI, esperar a linha sumir ou a lista estabilizar.
- Apos salvar formulario, esperar a rota/lista correta e o registro aparecer.
- Evitar `waitForTimeout`.
- Evitar `evaluate((el) => el.click())` quando locator normal for suficiente.
- No helper `goTo`, detectar tela de auth e falhar com mensagem clara.
- Em exportacao, esperar um sinal observavel de termino quando possivel, nao apenas o menu fechar.

## Status

- [x] Helper e2e de API/test data criado.
- [x] `reports-export.spec.ts` migrado.
- [x] `reports-export.spec.ts` validado em headed.
- [x] `costs.spec.ts`, `revenues.spec.ts` e `daily-logs.spec.ts` migrados.
- [x] `projects.spec.ts` migrado.
- [x] `clients.spec.ts`, `machines.spec.ts` e `operators.spec.ts` revisados.
- [x] `dashboard.spec.ts` revisado com smoke e seed por API.
- [x] Suite e2e validada em headed (`npm run test:e2e:api:headed` - 41 passed).
- [ ] Suite e2e validada em headless.
