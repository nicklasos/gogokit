import { useState } from 'react'
import { Button, Card, Modal, Tooltip } from 'antd'
import { AppstoreOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useCurrentUser } from '@/auth/authStore'
import { MarkdownViewer } from '@/shared/components/markdown/MarkdownViewer'
import { PageHeader } from '@/shared/components/PageHeader'
import { PageStack } from '@/shared/components/PageStack'
import { ResponsiveTable } from '@/shared/components/ResponsiveTable'
import { RowActions } from '@/shared/components/RowActions'
import { usePageParams, useTablePagination } from '@/shared/hooks/usePageParams'
import { formatDateTime } from '@/shared/utils/format'
import { markdownToPlainText } from '@/shared/utils/markdownLinks'
import message from '@/shared/utils/message'
import { useDeleteExample, useExamples } from '../hooks'
import { canDeleteExample, canUpdateExample } from '../policy'
import type { Example } from '../types'

export default function ExamplesPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useCurrentUser()
  const paging = usePageParams()
  const examples = useExamples(paging.params)
  const remove = useDeleteExample()
  const pagination = useTablePagination(paging, examples.data)
  const [viewing, setViewing] = useState<Example | null>(null)

  const onDelete = (example: Example) => remove.mutate(example.id, { onSuccess: () => message.success(t('examples.deleted')) })

  const actions = (example: Example) => (
    <RowActions
      entity="example"
      id={example.id}
      onEdit={canUpdateExample(user, example) ? () => navigate(`/examples/${example.id}/edit`) : undefined}
      onDelete={canDeleteExample(user, example) ? () => onDelete(example) : undefined}
      deleteTitle={t('examples.deleteConfirm')}
    >
      <Tooltip title={t('examples.view')}>
        <Button type="text" icon={<EyeOutlined />} size="small" onClick={() => setViewing(example)} data-testid={`view-example-button-${example.id}`} />
      </Tooltip>
    </RowActions>
  )

  const columns: ColumnsType<Example> = [
    { title: t('examples.titleField'), dataIndex: 'title', key: 'title', ellipsis: true },
    {
      title: t('examples.descriptionField'),
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (value: string) => markdownToPlainText(value, 120),
    },
    {
      title: t('common.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value: string) => formatDateTime(value),
    },
    { title: t('common.actions'), key: 'actions', width: 140, fixed: 'right', render: (_, example) => actions(example) },
  ]

  return (
    <PageStack testId="examples-page">
      <Card>
        <PageHeader
          icon={<AppstoreOutlined />}
          title={t('examples.title')}
          mainAction={
            <Button data-testid="examples-add-button" type="primary" icon={<PlusOutlined />} onClick={() => navigate('/examples/new')}>
              {t('examples.add')}
            </Button>
          }
        />
        <ResponsiveTable
          testId="examples-table"
          items={examples.data?.data}
          loading={examples.isFetching || remove.isPending}
          columns={columns}
          emptyText={t('examples.empty')}
          pagination={pagination}
          cardTitle={(example) => example.title}
          cardTestId={(example) => `example-card-${example.id}`}
          renderCard={(example) => (
            <>
              <div>{markdownToPlainText(example.description, 120)}</div>
              <div>
                {t('common.createdAt')}: {formatDateTime(example.created_at)}
              </div>
            </>
          )}
          cardActions={actions}
        />
      </Card>

      <Modal open={viewing != null} title={viewing?.title} onCancel={() => setViewing(null)} footer={null} destroyOnHidden>
        <MarkdownViewer content={viewing?.description} testId="example-view-content" />
      </Modal>
    </PageStack>
  )
}
