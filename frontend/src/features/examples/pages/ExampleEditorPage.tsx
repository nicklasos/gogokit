import { useEffect, useState } from 'react'
import { Alert, Button, Card, Form, Input, Popconfirm, Space } from 'antd'
import { useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { MarkdownEditor } from '@/shared/components/markdown/MarkdownEditor'
import { PageHeader } from '@/shared/components/PageHeader'
import { PageError, PageLoading } from '@/shared/components/PageState'
import { PageStack } from '@/shared/components/PageStack'
import { useGuardedNavigate, useUnsavedChangesContext, useUnsavedChangesGuard } from '@/shared/lib/unsavedChanges'
import message from '@/shared/utils/message'
import { applyFormErrors } from '@/shared/utils/formErrors'
import { useDeleteExample, useExample, useSaveExample } from '../hooks'
import type { ExampleRequest } from '../types'

const FORM_FIELDS = ['title', 'description'] as const

export default function ExampleEditorPage() {
  const { t } = useTranslation()
  const params = useParams()
  const id = params.id ? Number(params.id) : undefined
  const navigate = useGuardedNavigate()
  const { setDirty: setGuardDirty } = useUnsavedChangesContext()
  const [form] = Form.useForm<ExampleRequest>()
  const [dirty, setDirty] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)
  const example = useExample(id)
  const save = useSaveExample()
  const remove = useDeleteExample()

  useUnsavedChangesGuard(dirty)

  useEffect(() => {
    if (example.data) form.setFieldsValue({ title: example.data.title, description: example.data.description })
  }, [example.data, form])

  // The guard reads a ref, so it has to be cleared before navigating, not on the next render.
  const leave = () => {
    setDirty(false)
    setGuardDirty(false)
    navigate('/examples')
  }

  const back = { label: t('examples.title'), onClick: () => navigate('/examples'), testId: 'example-editor-back-button' }

  if (id != null && example.isLoading) return <PageLoading />
  if (id != null && example.isError) return <PageError error={example.error} back={back} onRetry={() => example.refetch()} />

  const onFinish = (values: ExampleRequest) => {
    setServerError(null)
    save.mutate(
      { id, body: { title: values.title.trim(), description: values.description ?? '' } },
      {
        onSuccess: () => {
          message.success(t('examples.saved'))
          leave()
        },
        onError: (error) => setServerError(applyFormErrors(form, t, error, FORM_FIELDS)),
      }
    )
  }

  const onDelete = () => {
    if (id == null) return
    remove.mutate(id, {
      onSuccess: () => {
        message.success(t('examples.deleted'))
        leave()
      },
    })
  }

  return (
    <PageStack testId="example-editor-page">
      <Card>
        <PageHeader title={id == null ? t('examples.create') : t('examples.edit')} back={back} />

        {serverError && (
          <Alert
            data-testid="example-editor-error"
            type="error"
            showIcon
            message={serverError}
            style={{ marginBottom: 16 }}
          />
        )}

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          onValuesChange={() => setDirty(true)}
          disabled={save.isPending}
          data-testid="example-editor-form"
        >
          <Form.Item name="title" label={t('examples.titleField')} rules={[{ required: true, whitespace: true, message: t('examples.titleRequired') }]}>
            <Input data-testid="example-title-input" />
          </Form.Item>

          <Form.Item name="description" label={t('examples.descriptionField')}>
            <MarkdownEditor testId="example-description-input" height={220} />
          </Form.Item>

          <Space>
            <Button data-testid="example-save-button" type="primary" htmlType="submit" loading={save.isPending}>
              {t('common.save')}
            </Button>
            {id != null && (
              <Popconfirm
                title={t('examples.deleteConfirm')}
                onConfirm={onDelete}
                okText={t('common.yes')}
                cancelText={t('common.no')}
                okButtonProps={{ danger: true, 'data-testid': 'example-editor-delete-confirm' }}
              >
                <Button data-testid="example-editor-delete-button" danger loading={remove.isPending}>
                  {t('common.delete')}
                </Button>
              </Popconfirm>
            )}
          </Space>
        </Form>
      </Card>
    </PageStack>
  )
}
