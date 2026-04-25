'use client'

import { useEffect, type ReactNode } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Heading3,
  Quote,
  Minus,
  RemoveFormatting,
  Sparkles,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  onGenerateAI?: () => void
  isGenerating?: boolean
  aiGenerated?: boolean
  confidenceBadge?: 'high' | 'medium' | 'low' | null
  label?: string
  required?: boolean
}

function ToolbarButton({
  onClick,
  active = false,
  title,
  children,
}: {
  onClick: () => void
  active?: boolean
  title: string
  children: ReactNode
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      title={title}
      className={[
        'flex h-8 w-8 items-center justify-center rounded-lg transition-colors',
        active
          ? 'bg-brand text-white'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start typing...',
  onGenerateAI,
  isGenerating = false,
  aiGenerated = false,
  confidenceBadge = null,
  label,
  required = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      CharacterCount,
    ],
    content: value,
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm max-w-none min-h-[160px] px-4 py-3 text-gray-700 focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) return null

  return (
    <div className='w-full'>
      {label ? (
        <div className='mb-1.5 flex items-center justify-between'>
          <label className='text-xs font-semibold uppercase tracking-wide text-gray-500'>
            {label}
            {required ? <span className='ml-0.5 text-red-500'>*</span> : null}
          </label>
          <div className='flex items-center gap-2'>
            {confidenceBadge === 'high' ? (
              <span className='rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700'>
                AI filled
              </span>
            ) : null}
            {confidenceBadge === 'medium' ? (
              <span className='rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700'>
                Please verify
              </span>
            ) : null}
            {confidenceBadge === 'low' ? (
              <span className='rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600'>
                Check this
              </span>
            ) : null}
            {onGenerateAI ? (
              <button
                type='button'
                onClick={onGenerateAI}
                disabled={isGenerating}
                className='flex items-center gap-1.5 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[10px] font-bold text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50'
              >
                <Sparkles className='h-3 w-3' />
                {isGenerating ? 'Generating...' : 'Generate with AI'}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}

      {aiGenerated ? (
        <div className='mb-2 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5'>
          <Sparkles className='mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600' />
          <p className='text-[11px] leading-relaxed text-amber-700'>
            AI generated content. Please review and edit before posting. This
            notice is only visible to you.
          </p>
        </div>
      ) : null}

      <div className='overflow-hidden rounded-2xl border border-gray-200 transition-all focus-within:border-brand focus-within:ring-1 focus-within:ring-brand/20'>
        <div className='flex flex-wrap items-center gap-1 border-b border-gray-100 bg-gray-50 px-3 py-2'>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
            title='Bold'
          >
            <Bold className='h-3.5 w-3.5' />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
            title='Italic'
          >
            <Italic className='h-3.5 w-3.5' />
          </ToolbarButton>
          <div className='mx-1 h-5 w-px bg-gray-200' />
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive('heading', { level: 2 })}
            title='Heading 2'
          >
            <Heading2 className='h-3.5 w-3.5' />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive('heading', { level: 3 })}
            title='Heading 3'
          >
            <Heading3 className='h-3.5 w-3.5' />
          </ToolbarButton>
          <div className='mx-1 h-5 w-px bg-gray-200' />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
            title='Bullet List'
          >
            <List className='h-3.5 w-3.5' />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
            title='Numbered List'
          >
            <ListOrdered className='h-3.5 w-3.5' />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
            title='Quote'
          >
            <Quote className='h-3.5 w-3.5' />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title='Divider'
          >
            <Minus className='h-3.5 w-3.5' />
          </ToolbarButton>
          <div className='mx-1 h-5 w-px bg-gray-200' />
          <ToolbarButton
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
            title='Clear formatting'
          >
            <RemoveFormatting className='h-3.5 w-3.5' />
          </ToolbarButton>
          <div className='ml-auto text-[10px] text-gray-400'>
            {editor.storage.characterCount.characters()} chars
          </div>
        </div>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
