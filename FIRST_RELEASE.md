# 🚀 Primeira Release — Viana Transporte

Siga este guia para criar e publicar a primeira versão com auto-update ativo.

## Passo 1: Incrementar a Versão

Abra `package.json` e mude:
```json
"version": "1.0.1"
```

## Passo 2: Commit e Tag

```bash
git add package.json
git commit -m "chore: bump to v1.0.1"
git push origin main
```

## Passo 3: Criar a Tag

```bash
git tag v1.0.1
git push origin v1.0.1
```

## ✅ Pronto!

O GitHub Actions será acionado automaticamente:

1. **Workflow Iniciado**: Acesse https://github.com/AriSilva94/Viana-Transporte/actions
2. **Build em Progresso**: Aguarde ~5-10 minutos
3. **Release Publicada**: Quando terminar, verá em https://github.com/AriSilva94/Viana-Transporte/releases

## 🧪 Testar o Update

Depois que a release for publicada:

1. **Instale a versão anterior** (a v1.0.0 que estava rodando)
2. **Abra o app** — aguarde 3 segundos
3. **Veja a notificação** de update disponível
4. **Clique "Reiniciar"** — app vai baixar e instalar v1.0.1

## 📝 Próximas Atualizações

Sempre que quiser uma nova versão:

```bash
# 1. Editar package.json
# "version": "1.0.2"

# 2. Commit + tag
git add package.json && git commit -m "chore: bump to v1.0.2"
git push origin main
git tag v1.0.2 && git push origin v1.0.2

# Pronto! GitHub Actions cuida do resto
```

---

**Nota:** Se o GitHub Actions falhar, verifique a aba "Actions" e procure por erros nos logs.
