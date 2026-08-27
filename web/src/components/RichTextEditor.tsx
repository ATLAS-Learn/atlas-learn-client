import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Mathematics from '@tiptap/extension-mathematics';
import 'katex/dist/katex.min.css';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  ImagePlus,
  Highlighter,
  Undo,
  Redo,
  RemoveFormatting,
  Minus,
  Sigma,
} from 'lucide-react';
import { useState, useCallback, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function ToolbarButton({
  onClick,
  active = false,
  disabled = false,
  title,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-1.5 rounded-md transition-colors ${
        active
          ? 'bg-[#084A59] text-white'
          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <div className='w-px h-6 bg-gray-200 mx-0.5' />;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Start writing...',
  minHeight = '200px',
}: RichTextEditorProps) {
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [showFormulaInput, setShowFormulaInput] = useState(false);
  const [formulaInput, setFormulaInput] = useState('');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({ placeholder }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[#084A59] underline cursor-pointer' },
      }),
      Image.configure({
        HTMLAttributes: { class: 'max-w-full rounded-lg my-3' },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Highlight.configure({ multicolor: false }),
      Mathematics,
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[180px] px-4 py-3',
        style: `min-height: ${minHeight}`,
      },
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value || '');
    }
  }, [value]);

  const setLink = useCallback(() => {
    if (!editor) return;
    if (!linkUrl) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
    } else {
      const url = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`;
      editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    }
    setLinkUrl('');
    setShowLinkInput(false);
  }, [editor, linkUrl]);

  const addImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageUrl('');
    setShowImageInput(false);
  }, [editor, imageUrl]);

  const insertFormula = useCallback(() => {
    if (!editor || !formulaInput.trim()) return;
    editor.chain().focus().insertContent(`$${formulaInput}$`).run();
    setFormulaInput('');
    setShowFormulaInput(false);
  }, [editor, formulaInput]);

  if (!editor) return null;

  const iconSize = 16;

  return (
    <div className='border border-gray-200 rounded-xl overflow-hidden bg-white focus-within:ring-2 focus-within:ring-[#084A59]/20 focus-within:border-[#084A59] transition-all'>
      {/* Toolbar */}
      <div className='flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-gray-100 bg-gray-50/50'>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title='Bold'
        >
          <Bold size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title='Italic'
        >
          <Italic size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title='Underline'
        >
          <UnderlineIcon size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive('strike')}
          title='Strikethrough'
        >
          <Strikethrough size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          active={editor.isActive('highlight')}
          title='Highlight'
        >
          <Highlighter size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          active={editor.isActive('code')}
          title='Inline Code'
        >
          <Code size={iconSize} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor.isActive('heading', { level: 1 })}
          title='Heading 1'
        >
          <Heading1 size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title='Heading 2'
        >
          <Heading2 size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive('heading', { level: 3 })}
          title='Heading 3'
        >
          <Heading3 size={iconSize} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title='Bullet List'
        >
          <List size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title='Numbered List'
        >
          <ListOrdered size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          title='Horizontal Rule'
        >
          <Minus size={iconSize} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          active={editor.isActive({ textAlign: 'left' })}
          title='Align Left'
        >
          <AlignLeft size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          active={editor.isActive({ textAlign: 'center' })}
          title='Align Center'
        >
          <AlignCenter size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          active={editor.isActive({ textAlign: 'right' })}
          title='Align Right'
        >
          <AlignRight size={iconSize} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => setShowLinkInput(!showLinkInput)}
          active={editor.isActive('link')}
          title='Insert Link'
        >
          <LinkIcon size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowImageInput(!showImageInput)}
          title='Insert Image'
        >
          <ImagePlus size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => setShowFormulaInput(!showFormulaInput)}
          active={showFormulaInput}
          title='Insert Formula (LaTeX)'
        >
          <Sigma size={iconSize} />
        </ToolbarButton>

        <Divider />

        <ToolbarButton
          onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          title='Clear Formatting'
        >
          <RemoveFormatting size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title='Undo'
        >
          <Undo size={iconSize} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title='Redo'
        >
          <Redo size={iconSize} />
        </ToolbarButton>
      </div>

      {/* Link URL Input */}
      {showLinkInput && (
        <div className='flex items-center gap-2 px-3 py-2 bg-blue-50 border-b border-blue-100'>
          <LinkIcon size={14} className='text-blue-500 shrink-0' />
          <input
            type='url'
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && setLink()}
            placeholder='Paste or type URL...'
            className='flex-1 text-sm px-3 py-1.5 border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-400 bg-white'
            autoFocus
          />
          <button
            type='button'
            onClick={setLink}
            className='px-3 py-1.5 bg-[#084A59] text-white text-sm rounded-lg hover:bg-[#011C26] transition-colors'
          >
            Apply
          </button>
          <button
            type='button'
            onClick={() => {
              setShowLinkInput(false);
              setLinkUrl('');
            }}
            className='px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            Cancel
          </button>
        </div>
      )}

      {/* Image URL Input */}
      {showImageInput && (
        <div className='flex items-center gap-2 px-3 py-2 bg-green-50 border-b border-green-100'>
          <ImagePlus size={14} className='text-green-500 shrink-0' />
          <input
            type='url'
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addImage()}
            placeholder='Paste image URL...'
            className='flex-1 text-sm px-3 py-1.5 border border-green-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-400 bg-white'
            autoFocus
          />
          <button
            type='button'
            onClick={addImage}
            className='px-3 py-1.5 bg-[#084A59] text-white text-sm rounded-lg hover:bg-[#011C26] transition-colors'
          >
            Insert
          </button>
          <button
            type='button'
            onClick={() => {
              setShowImageInput(false);
              setImageUrl('');
            }}
            className='px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            Cancel
          </button>
        </div>
      )}

      {/* Formula Input */}
      {showFormulaInput && (
        <div className='flex items-center gap-2 px-3 py-2 bg-purple-50 border-b border-purple-100'>
          <Sigma size={14} className='text-purple-500 shrink-0' />
          <input
            type='text'
            value={formulaInput}
            onChange={(e) => setFormulaInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && insertFormula()}
            placeholder='LaTeX formula, e.g. E = mc^2 or \frac{1}{2}mv^2'
            className='flex-1 text-sm px-3 py-1.5 border border-purple-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 bg-white font-mono'
            autoFocus
          />
          <button
            type='button'
            onClick={insertFormula}
            className='px-3 py-1.5 bg-[#084A59] text-white text-sm rounded-lg hover:bg-[#011C26] transition-colors'
          >
            Insert
          </button>
          <button
            type='button'
            onClick={() => {
              setShowFormulaInput(false);
              setFormulaInput('');
            }}
            className='px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors'
          >
            Cancel
          </button>
        </div>
      )}

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}

/**
 * Renders rich text HTML content for display (student side, preview, etc.)
 */
export function RichTextContent({ html }: { html: string }) {
  if (!html) return null;
  return (
    <div
      className='prose prose-sm max-w-none
        prose-headings:text-gray-900 prose-headings:font-bold
        prose-p:text-gray-700 prose-p:leading-relaxed
        prose-a:text-[#084A59] prose-a:underline
        prose-strong:text-gray-900
        prose-code:bg-gray-100 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:font-mono
        prose-pre:bg-gray-900 prose-pre:text-gray-100
        prose-blockquote:border-l-[#084A59] prose-blockquote:bg-gray-50 prose-blockquote:py-1 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
        prose-img:rounded-lg prose-img:shadow-sm
        prose-li:text-gray-700
        prose-hr:border-gray-200'
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
