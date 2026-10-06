import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import './MarkdownViewer.css'

// react-markdown drops unknown protocols; phone links are wanted.
const urlTransform = (url: string) => (/^tel:/i.test(url) ? url : defaultUrlTransform(url))

interface Props {
  content: string | null | undefined
  testId?: string
}

/**
 * Renders markdown as HTML. Raw HTML inside the markdown is shown as text, not executed,
 * so content written by one user is safe to show to another.
 */
export function MarkdownViewer({ content, testId }: Props) {
  return (
    <div className="markdown-viewer" data-testid={testId}>
      <ReactMarkdown urlTransform={urlTransform}>{content || ''}</ReactMarkdown>
    </div>
  )
}
