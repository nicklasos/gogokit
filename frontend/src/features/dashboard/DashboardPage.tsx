import { Card, Typography } from 'antd'
import { DashboardOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/auth/authStore'
import { PageHeader } from '@/shared/components/PageHeader'
import { PageStack } from '@/shared/components/PageStack'

export default function DashboardPage() {
  const { t } = useTranslation()
  const user = useCurrentUser()

  return (
    <PageStack testId="dashboard-page">
      <Card>
        <PageHeader icon={<DashboardOutlined />} title={t('dashboard.title')} />
        <Typography.Paragraph data-testid="dashboard-welcome" style={{ marginBottom: 0 }}>
          {t('dashboard.welcome', { name: user?.name || user?.email || '' })}
        </Typography.Paragraph>
        <Typography.Text type="secondary">{t('dashboard.subtitle')}</Typography.Text>
      </Card>
    </PageStack>
  )
}
