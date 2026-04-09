# Auto-Update Setup — Viana Transporte

A funcionalidade de auto-update foi implementada com sucesso. O app agora detecta automaticamente novas versões e as instala silenciosamente.

## 🎯 Como Funciona

1. **Ao iniciar o app**, o updater aguarda 3 segundos e depois checa automaticamente por novas versões no GitHub Releases
2. **Se houver uma nova versão**, ela é baixada em background
3. **Quando o download terminar**, uma notificação aparece pedindo para o usuário reiniciar o app
4. **Ao clicar em "Reiniciar"**, o app fecha, instala a atualização e abre novamente

## 🚀 Como Publicar uma Nova Versão

### Pré-requisitos (primeira vez apenas)

1. **Criar um repositório no GitHub** (se ainda não tiver)
   ```bash
   # No GitHub, crie um novo repositório (pode ser privado)
   # Copie o HTTPS URL (ex: https://github.com/seu-usuario/viana-transporte.git)
   ```

2. **Configurar o repositório remoto no seu projeto**
   ```bash
   git remote add origin https://github.com/seu-usuario/viana-transporte.git
   git push -u origin master
   ```

3. **Atualizar as credenciais no package.json**
   ```json
   "publish": {
     "provider": "github",
     "owner": "seu-usuario",
     "repo": "viana-transporte"
   }
   ```

### Publicar uma Atualização

1. **Incrementar a versão** no `package.json`
   ```json
   "version": "1.0.1"  // era 1.0.0
   ```

2. **Fazer commit e push**
   ```bash
   git add package.json
   git commit -m "chore: bump to v1.0.1"
   git push origin master
   ```

3. **Criar uma tag e fazer push dela**
   ```bash
   git tag v1.0.1
   git push origin v1.0.1
   ```

4. **GitHub Actions se encarrega do resto**
   - O workflow `.github/workflows/release.yml` é acionado automaticamente
   - Faz o build do Windows (.exe)
   - Publica na aba "Releases" do GitHub com metadados (`latest.yml`)
   - Os usuários com a versão anterior verão a notificação automaticamente

## 📁 Arquivos Modificados/Criados

### Main Process
- `src/main/services/updater.ts` — Serviço que gerencia o autoUpdater
- `src/main/ipc/updater.ts` — IPC handlers para checar/instalar atualizações
- `src/main/index.ts` — Inicializa o updater após criar a janela

### Renderer / React
- `src/renderer/hooks/useUpdater.ts` — Hook que consome eventos de update
- `src/renderer/components/UpdateNotification.tsx` — Componente de notificação
- `src/renderer/App.tsx` — Monta o componente globalmente

### Tipos e IPC
- `src/shared/types.ts` — Interfaces `UpdaterAPI`, `UpdateInfo`, `DownloadProgress`
- `src/preload/index.ts` — Expõe namespace `updater` via contextBridge

### CI/CD
- `.github/workflows/release.yml` — GitHub Actions que builda e publica automaticamente
- `package.json` — Adicionadas dependências `electron-updater` e `electron-log`

## 🔍 Testando Localmente (Opcional)

Para testar o fluxo de update sem publicar no GitHub, você pode:

1. **Simular uma atualização manualmente**
   ```bash
   # Mudar versão em package.json
   # npm run build
   # electron ./out/main/index.js
   ```

2. **Verificar logs** (o app escreve logs em):
   - Windows: `%APPDATA%/MightyRept/logs/`
   - Contêm informações sobre tentativas de update

## ⚙️ Configurações Avançadas

Se precisar ajustar o comportamento, edite `src/main/services/updater.ts`:

```ts
autoUpdater.autoDownload = true        // Baixa automaticamente
autoUpdater.autoInstallOnAppQuit = true // Instala ao fechar
```

Você também pode forçar uma verificação manual no UI (exemplo em um menu):
```ts
await window.api.updater.checkForUpdates()
```

## 📝 Notas Importantes

- **GitHub Token**: O GitHub Actions usa `GITHUB_TOKEN` automaticamente (não precisa configurar)
- **Repositório Privado**: Funciona normalmente, mas o instalador será baixado pelo GitHub token
- **Assinatura de Código**: Não está configurada (opcional para Windows). Para adicionar, veja documentação do electron-builder
- **Download Incremental**: No Windows NSIS, apenas as mudanças são baixadas (não o executável inteiro)

## 🐛 Troubleshooting

**Problema**: App não detecta updates
- Verificar se está rodando a versão 1.0.0 e há uma tag v1.0.1+ no GitHub
- Verificar logs em `%APPDATA%/MightyRept/logs/`

**Problema**: GitHub Actions falha ao publicar
- Verificar se o repositório é público OU se tem permissões corretas
- Verificar se a tag foi criada corretamente (`v*.*.*`)

**Problema**: Múltiplas máquinas com versões diferentes
- Cada máquina vai detectar a nova versão quando a tag for publicada
- Updates não são forçados, usuário pode ignorar (próxima vez vai aparecer novamente)

---

Pronto! O sistema está completamente funcional. 🎉
