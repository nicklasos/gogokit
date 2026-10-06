import { lazy, Suspense } from 'react'
import { Skeleton } from 'antd'
import type { MarkdownEditorProps } from './MarkdownEditorImpl'

// The editor is by far the heaviest widget in the app, so it is downloaded only by
// pages that render it, and only when they do.
const Editor = lazy(() => import('./MarkdownEditorImpl'))

/**
 * A WYSIWYG markdown editor: headings, bold and italic, lists, quotes and links
 * (including phone and email links). The value is markdown text.
 *
 * Use it as a controlled field: `<Form.Item name="body"><MarkdownEditor testId="..." /></Form.Item>`.
 * Show the result with `MarkdownViewer`.
 */
export function MarkdownEditor(props: MarkdownEditorProps) {
  return (
    <Suspense fallback={<Skeleton active paragraph={{ rows: 4 }} />}>
      <Editor {...props} />
    </Suspense>
  )
}

export type { MarkdownEditorProps }
