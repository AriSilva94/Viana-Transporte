import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { PageHeader } from '@renderer/components/shared/PageHeader'
import { SurfaceSection } from '@renderer/components/shared/SurfaceSection'
import { DetailPageSkeleton } from '@renderer/components/shared/DetailPageSkeleton'
import { EmptyState } from '@renderer/components/shared/EmptyState'
import { formatDate } from '@renderer/lib/format'
import { getRoleBadgeClass, getRoleLabel, findUserById } from './userHelpers'
import type { SupportedLocale, UserProfileListItem } from '../../../shared/types'

export function UserDetailPage(): JSX.Element {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { t } = useTranslation(['users', 'common'])
  const [user, setUser] = useState<UserProfileListItem | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const locale = (navigator.language || 'pt-BR') as SupportedLocale

  useEffect(() => {
    let isMounted = true

    async function loadUser(): Promise<void> {
      if (!id) {
        setIsLoading(false)
        return
      }

      try {
        const foundUser = await findUserById(id)
        if (isMounted) {
          setUser(foundUser)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadUser()

    return () => {
      isMounted = false
    }
  }, [id])

  if (isLoading) {
    return <DetailPageSkeleton />
  }

  if (!user) {
    return <EmptyState message={t('userNotFound')} />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('viewDialogTitle')}
        action={{
          label: t('common:edit'),
          onClick: () => navigate(`/users/${user.id}/edit`),
        }}
      />
      <SurfaceSection
        eyebrow={t('detailSectionEyebrow')}
        title={user.email}
        description={t('detailSectionDescription')}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-brand-sand/12 p-4">
            <span className="text-sm text-muted-foreground">{t('email')}</span>
            <p className="mt-1 font-medium">{user.email}</p>
          </div>
          <div className="rounded-2xl bg-brand-sky/10 p-4">
            <span className="text-sm text-muted-foreground">{t('role')}</span>
            <div className="mt-2">
              <span
                className={`inline-flex items-center rounded-full border border-black/5 px-2.5 py-1 text-xs font-medium shadow-sm ${getRoleBadgeClass(user.role)}`}
              >
                {getRoleLabel(user.role, t)}
              </span>
            </div>
          </div>
          <div className="rounded-2xl bg-white/70 p-4 md:col-span-2">
            <span className="text-sm text-muted-foreground">{t('createdAt')}</span>
            <p className="mt-1 font-medium">{formatDate(user.createdAt, locale)}</p>
          </div>
        </div>
      </SurfaceSection>
    </div>
  )
}
