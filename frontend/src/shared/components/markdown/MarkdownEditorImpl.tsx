import { Component, memo, useCallback, useEffect, useMemo, useRef, useState, type ErrorInfo, type ReactNode } from 'react'
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ButtonWithTooltip,
  CreateLink,
  ListsToggle,
  MDXEditor,
  UndoRedo,
  headingsPlugin,
  linkDialogPlugin,
  linkDialogState$,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  openLinkEditDialog$,
  quotePlugin,
  toolbarPlugin,
  useCellValue,
  usePublisher,
  type MDXEditorMethods,
} from '@mdxeditor/editor'
import { Button } from 'antd'
import { MailOutlined, PhoneOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'
import '@mdxeditor/editor/style.css'
import { getProtocolValue, normalizeMarkdownLinks, stripKnownLinkProtocol } from '@/shared/utils/markdownLinks'
import { formatEditorTranslation, isTranslationDomError } from './editorSupport'
import { MarkdownViewer } from './MarkdownViewer'
import './MarkdownEditor.css'

export interface MarkdownEditorProps {
  /** Markdown source. Works as a controlled field inside an Ant Design `Form.Item`. */
  value?: string
  onChange?: (markdown: string) => void
  placeholder?: string
  /** Minimum height of the writing area, in pixels. */
  height?: number
  /** Shows the content read-only instead of the editor. */
  disabled?: boolean
  /**
   * Delay before `onChange` fires, in milliseconds. Zero (the default) reports every
   * change, which a form needs so that submitting right after typing sees the last
   * keystroke. Raise it only when each change triggers something expensive.
   */
  debounceMs?: number
  testId?: string
}

type Protocol = 'tel' | 'mailto'
type EditorTranslate = (key: string, defaultValue: string, interpolations?: Record<string, unknown>) => string

interface BoundaryProps {
  fallback: (retry: () => void) => ReactNode
  shouldAutoRecover: (error: unknown) => boolean
  onAutoRecover: () => void
  children: ReactNode
}

/** The editor is a large third-party widget; a crash inside it must not take the form down with it. */
class EditorErrorBoundary extends Component<BoundaryProps, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Markdown editor crashed', error, info.componentStack)
    if (this.props.shouldAutoRecover(error)) {
      this.props.onAutoRecover()
      this.reset()
    }
  }

  reset = () => this.setState({ failed: false })

  render() {
    return this.state.failed ? this.props.fallback(this.reset) : this.props.children
  }
}

/** Page translation must leave the text being edited alone, or the editor loses track of its own nodes. */
function disableElementTranslation(element: Element) {
  element.setAttribute('translate', 'no')
  element.classList.add('notranslate')
}

/**
 * When the link dialog opens from a phone or email button, shows the number or address
 * without its `tel:` / `mailto:` prefix. The prefix is put back when the markdown is saved.
 */
function LinkDefaultsController({ pendingProtocol }: { pendingProtocol: { current: Protocol | null } }) {
  const dialog = useCellValue(linkDialogState$)
  const setDialog = usePublisher(linkDialogState$)
  const previousType = useRef(dialog.type)

  useEffect(() => {
    const wasEdit = previousType.current === 'edit'
    previousType.current = dialog.type
    if (dialog.type !== 'edit' || wasEdit || !dialog.rectangle) return

    let nextUrl = (dialog.url || '').trim()
    if (pendingProtocol.current) {
      nextUrl = getProtocolValue(nextUrl, pendingProtocol.current)
      pendingProtocol.current = null
    }

    const url = stripKnownLinkProtocol(nextUrl)
    const title = (dialog.title || '').trim() ? stripKnownLinkProtocol(dialog.title) : url
    const initialUrl = (dialog.initialUrl || '').trim() ? stripKnownLinkProtocol(dialog.initialUrl) : url

    if (url !== dialog.url || title !== dialog.title || initialUrl !== dialog.initialUrl) {
      setDialog({ ...dialog, url, title, initialUrl })
    }
  }, [dialog, pendingProtocol, setDialog])

  return null
}

function ProtocolLinkControls({ translate }: { translate: EditorTranslate }) {
  const pendingProtocol = useRef<Protocol | null>(null)
  const openLinkDialog = usePublisher(openLinkEditDialog$)

  const open = (protocol: Protocol) => {
    pendingProtocol.current = protocol
    openLinkDialog()
  }

  return (
    <>
      <ButtonWithTooltip title={translate('customLinks.phone.tooltip', 'Insert phone link')} onClick={() => open('tel')} style={{ paddingInline: 10 }}>
        <PhoneOutlined />
      </ButtonWithTooltip>
      <ButtonWithTooltip title={translate('customLinks.email.tooltip', 'Insert email link')} onClick={() => open('mailto')} style={{ paddingInline: 10 }}>
        <MailOutlined />
      </ButtonWithTooltip>
      <LinkDefaultsController pendingProtocol={pendingProtocol} />
    </>
  )
}

function MarkdownEditorImpl({ value, onChange, placeholder, height = 300, disabled = false, debounceMs = 0, testId }: MarkdownEditorProps) {
  const { t } = useTranslation()
  const editorRef = useRef<MDXEditorMethods>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lastValue = useRef(value ?? '')
  const [initialMarkdown] = useState(value ?? '')
  // Remounts the editor: the only way back after it has thrown.
  const [epoch, setEpoch] = useState(0)
  const pendingChange = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onChangeRef = useRef(onChange)
  const tRef = useRef(t)
  const autoRecovered = useRef(false)
  const resolvedPlaceholder = placeholder ?? t('editor.placeholder')

  useEffect(() => {
    onChangeRef.current = onChange
    tRef.current = t
  }, [onChange, t])

  const translate = useCallback<EditorTranslate>(
    (key, defaultValue, interpolations) =>
      formatEditorTranslation((k, d, i) => tRef.current(k, { defaultValue: d, ...i }), key, defaultValue, interpolations),
    []
  )

  // The editor reads `markdown` only when it mounts. Later changes from outside
  // (the record finished loading, the form was reset) have to be pushed in.
  useEffect(() => {
    const next = value ?? ''
    if (next === lastValue.current) return
    lastValue.current = next
    try {
      editorRef.current?.setMarkdown(next)
    } catch (error) {
      console.error('Failed to update the markdown editor', error)
    }
  }, [value])

  const handleChange = useCallback(
    (markdown: string, initialMarkdownNormalize: boolean) => {
      const normalized = normalizeMarkdownLinks(markdown)
      lastValue.current = normalized
      // The editor tidies the markdown it was given when it mounts. That is not an edit.
      if (initialMarkdownNormalize) return

      if (pendingChange.current) {
        clearTimeout(pendingChange.current)
        pendingChange.current = null
      }
      if (debounceMs <= 0) {
        onChangeRef.current?.(normalized)
        return
      }
      pendingChange.current = setTimeout(() => onChangeRef.current?.(normalized), debounceMs)
    },
    [debounceMs]
  )

  useEffect(
    () => () => {
      if (pendingChange.current) clearTimeout(pendingChange.current)
    },
    []
  )

  useEffect(() => {
    const root = containerRef.current
    if (!root) return undefined
    const frame = requestAnimationFrame(() => {
      root.querySelectorAll('.markdown-editor-content, .mdxeditor-root-contenteditable, [contenteditable="true"]').forEach(disableElementTranslation)
    })
    return () => cancelAnimationFrame(frame)
  }, [epoch, disabled])

  const plugins = useMemo(
    () => [
      headingsPlugin(),
      markdownShortcutPlugin(),
      listsPlugin(),
      linkPlugin(),
      linkDialogPlugin(),
      quotePlugin(),
      toolbarPlugin({
        toolbarContents: () => (
          <>
            <UndoRedo />
            <BlockTypeSelect />
            <BoldItalicUnderlineToggles options={['Bold', 'Italic']} />
            <ProtocolLinkControls translate={translate} />
            <CreateLink />
            <ListsToggle />
          </>
        ),
      }),
    ],
    [translate]
  )

  const shouldAutoRecover = useCallback((error: unknown) => {
    if (autoRecovered.current || !isTranslationDomError(error)) return false
    autoRecovered.current = true
    return true
  }, [])

  const remount = useCallback(() => setEpoch((n) => n + 1), [])

  const crashFallback = useCallback(
    (retry: () => void) => (
      <div className="markdown-editor-crash notranslate" translate="no" data-testid={testId ? `${testId}-error` : undefined} style={{ minHeight: height }}>
        <span>{t('editor.crashMessage')}</span>
        <Button
          data-testid={testId ? `${testId}-error-retry` : undefined}
          onClick={() => {
            autoRecovered.current = false
            remount()
            retry()
          }}
        >
          {t('editor.crashRetry')}
        </Button>
      </div>
    ),
    [height, remount, t, testId]
  )

  if (disabled) {
    return (
      <div ref={containerRef} className="markdown-editor markdown-editor--disabled notranslate" translate="no" data-testid={testId} style={{ minHeight: height }}>
        {value ? <MarkdownViewer content={value} /> : resolvedPlaceholder}
      </div>
    )
  }

  return (
    <div ref={containerRef} className="markdown-editor notranslate" translate="no" data-testid={testId}>
      <EditorErrorBoundary fallback={crashFallback} shouldAutoRecover={shouldAutoRecover} onAutoRecover={remount}>
        <MDXEditor
          key={epoch}
          ref={editorRef}
          markdown={epoch === 0 ? initialMarkdown : lastValue.current}
          onChange={handleChange}
          onError={(error) => console.error('Markdown editor error', error)}
          translation={translate}
          plugins={plugins}
          placeholder={resolvedPlaceholder}
          contentEditableClassName="markdown-editor-content notranslate"
          suppressHtmlProcessing
        />
        <style>{`[data-testid="${testId ?? ''}"] .markdown-editor-content { min-height: ${height}px; }`}</style>
      </EditorErrorBoundary>
    </div>
  )
}

export default memo(MarkdownEditorImpl)
