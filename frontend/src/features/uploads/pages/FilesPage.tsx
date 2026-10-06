import { Card, Image, Tag, Typography } from 'antd'
import { FileOutlined, FolderOpenOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { useTranslation } from 'react-i18next'
import { FileUploadButton } from '@/shared/components/FileUploadButton'
import { PageHeader } from '@/shared/components/PageHeader'
import { PageStack } from '@/shared/components/PageStack'
import { ResponsiveTable } from '@/shared/components/ResponsiveTable'
import { RowActions } from '@/shared/components/RowActions'
import { usePageParams, useTablePagination } from '@/shared/hooks/usePageParams'
import { enumLabel } from '@/shared/utils/enums'
import { formatBytes, formatDateTime } from '@/shared/utils/format'
import message from '@/shared/utils/message'
import { useDeleteUpload, useUploadFile, useUploads } from '../hooks'
import { UPLOAD_EXTENSIONS, UPLOAD_MAX_SIZE_MB, type UploadedFile } from '../types'

const THUMBNAIL = 40

function Thumbnail({ file }: { file: UploadedFile }) {
  if (file.type !== 'image') return <FileOutlined style={{ fontSize: 24 }} />
  return (
    <Image
      src={file.full_url}
      alt={file.original_filename}
      width={THUMBNAIL}
      height={THUMBNAIL}
      style={{ objectFit: 'cover', borderRadius: 4 }}
      data-testid={`file-thumbnail-${file.id}`}
    />
  )
}

export default function FilesPage() {
  const { t } = useTranslation()
  const paging = usePageParams()
  const files = useUploads(paging.params)
  const pagination = useTablePagination(paging, files.data)
  const upload = useUploadFile()
  const remove = useDeleteUpload()

  const onSelect = (file: File) => upload.mutate(file, { onSuccess: () => message.success(t('uploads.uploaded')) })
  const onDelete = (file: UploadedFile) => remove.mutate(file.id, { onSuccess: () => message.success(t('uploads.deleted')) })

  const name = (file: UploadedFile) => (
    <Typography.Link href={file.full_url} target="_blank" rel="noreferrer" data-testid={`file-link-${file.id}`}>
      {file.original_filename}
    </Typography.Link>
  )
  const typeTag = (file: UploadedFile) => <Tag bordered={false}>{enumLabel(t, 'uploadType', file.type)}</Tag>
  const actions = (file: UploadedFile) => (
    <RowActions entity="file" id={file.id} onDelete={() => onDelete(file)} deleteTitle={t('uploads.deleteConfirm')} />
  )

  const columns: ColumnsType<UploadedFile> = [
    { key: 'thumbnail', width: THUMBNAIL + 32, render: (_, file) => <Thumbnail file={file} /> },
    { title: t('uploads.name'), key: 'name', ellipsis: true, render: (_, file) => name(file) },
    { title: t('uploads.type'), key: 'type', width: 130, render: (_, file) => typeTag(file) },
    { title: t('uploads.size'), key: 'size', width: 110, align: 'right', render: (_, file) => formatBytes(file.file_size) },
    { title: t('common.createdAt'), key: 'created_at', width: 180, render: (_, file) => formatDateTime(file.created_at) },
    { title: t('common.actions'), key: 'actions', width: 90, fixed: 'right', render: (_, file) => actions(file) },
  ]

  return (
    <PageStack testId="files-page">
      <Card>
        <PageHeader
          icon={<FolderOpenOutlined />}
          title={t('uploads.title')}
          subtitle={t('uploads.hint', { max: UPLOAD_MAX_SIZE_MB })}
          mainAction={
            <FileUploadButton testId="file-upload" onSelect={onSelect} accept={UPLOAD_EXTENSIONS} maxSizeMB={UPLOAD_MAX_SIZE_MB} loading={upload.isPending} multiple>
              {t('uploads.upload')}
            </FileUploadButton>
          }
        />
        <ResponsiveTable
          testId="files-table"
          items={files.data?.data}
          loading={files.isFetching || remove.isPending}
          columns={columns}
          emptyText={t('uploads.empty')}
          pagination={pagination}
          cardTitle={name}
          cardExtra={typeTag}
          cardTestId={(file) => `file-card-${file.id}`}
          renderCard={(file) => (
            <>
              {formatBytes(file.file_size)} · {formatDateTime(file.created_at)}
            </>
          )}
          cardActions={actions}
        />
      </Card>
    </PageStack>
  )
}
