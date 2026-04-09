import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { useTranslation } from 'react-i18next'

interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  title: string
  description: string
}

function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
}: ConfirmDialogProps): JSX.Element | null {
  const { t } = useTranslation('common')

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onCancel() }}>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button variant="destructive" onClick={onConfirm} data-testid="confirm-button">
          {t('confirm')}
        </Button>
      </DialogFooter>
    </Dialog>
  )
}

export { ConfirmDialog }
