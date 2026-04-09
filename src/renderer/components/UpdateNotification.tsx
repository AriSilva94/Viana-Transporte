import { useEffect, useState } from 'react'
import { useUpdater } from '../hooks/useUpdater'
import { AlertCircle, Download, Check, Loader2, X } from 'lucide-react'

export function UpdateNotification(): JSX.Element | null {
  const { updateDownloaded, updateAvailable, downloadProgress, error, installUpdate } = useUpdater()
  const [dismissed, setDismissed] = useState(false)

  // Reset dismissed state when update state changes
  useEffect(() => {
    if (updateDownloaded || error) {
      setDismissed(false)
    }
  }, [updateDownloaded, error])

  if (dismissed || (!updateDownloaded && !error)) {
    return null
  }

  if (error) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <div className="rounded-[28px] border border-red-200 bg-red-50/90 backdrop-blur-sm p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-red-900">Erro ao verificar atualização</p>
            <p className="text-xs text-red-700 mt-1">{error.message}</p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 text-red-600 hover:text-red-700"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  if (updateDownloaded) {
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <div className="rounded-[28px] border border-green-200 bg-green-50/90 backdrop-blur-sm p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-green-900">Nova versão disponível</p>
            <p className="text-xs text-green-700 mt-1">Clique em reiniciar para instalar a atualização</p>
          </div>
          <button
            onClick={async () => {
              await installUpdate()
            }}
            className="flex-shrink-0 ml-2 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium transition-colors"
          >
            Reiniciar
          </button>
        </div>
      </div>
    )
  }

  if (updateAvailable && downloadProgress) {
    const percent = Math.round(downloadProgress.percent)
    return (
      <div className="fixed bottom-4 right-4 z-50 max-w-md">
        <div className="rounded-[28px] border border-brand-sky/30 bg-white/84 backdrop-blur-sm p-4 flex items-start gap-3">
          <Loader2 className="w-5 h-5 text-brand-deep flex-shrink-0 mt-0.5 animate-spin" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-brand-ink">Baixando atualização</p>
            <div className="mt-2 w-full">
              <div className="flex justify-between items-center mb-1">
                <p className="text-xs text-gray-600">{percent}%</p>
              </div>
              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-deep transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
