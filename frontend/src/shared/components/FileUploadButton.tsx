import type { ReactNode } from 'react'
import { Button, Upload } from 'antd'
import { UploadOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import message from '@/shared/utils/message'

interface Props {
  testId: string
  children: ReactNode
  /** Called with each chosen file that passed the checks; the caller does the upload. */
  onSelect: (file: File) => void
  /** File extensions with the dot, e.g. `['.jpg', '.png']`. Omit to accept anything. */
  accept?: readonly string[]
  maxSizeMB?: number
  loading?: boolean
  multiple?: boolean
}

/**
 * A button that opens the file picker. It checks type and size before handing the file
 * over, which saves a round trip; the server checks again and is the one that counts.
 */
export function FileUploadButton({ testId, children, onSelect, accept, maxSizeMB, loading, multiple }: Props) {
  const { t } = useTranslation()

  const check = (file: File): boolean => {
    const extension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase()
    if (accept && !accept.includes(extension)) {
      message.error(t('errors.uploads.type_not_allowed'))
      return false
    }
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      message.error(t('uploads.tooLarge', { max: maxSizeMB }))
      return false
    }
    return true
  }

  return (
    <span data-testid={testId}>
      <Upload
        accept={accept?.join(',')}
        multiple={multiple}
        showUploadList={false}
        beforeUpload={(file) => {
          if (check(file)) onSelect(file)
          return false
        }}
      >
        <Button type="primary" icon={<UploadOutlined />} loading={loading} data-testid={`${testId}-button`}>
          {children}
        </Button>
      </Upload>
    </span>
  )
}
