import React from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import History from '@tiptap/extension-history';
import Underline from '@tiptap/extension-underline';
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaUnderline,
  FaParagraph,
  FaUndo,
  FaRedo,
} from 'react-icons/fa';
import { LuHeading1, LuHeading2, LuHeading3 } from 'react-icons/lu';
import { PiListBulletsBold, PiListNumbersBold } from 'react-icons/pi';

import './TextEditor.css';

//Toolbar Component
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="toolbar">
      {/* Undo/Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="toolbar-button"
        title="Undo"
      >
        <FaUndo />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="toolbar-button"
        title="Redo"
      >
        <FaRedo />
      </button>

      <div className="divider" />

      {/* Text Styles */}
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`toolbar-button ${editor.isActive('bold') ? 'is-active' : ''}`}
        title="Bold"
      >
        <FaBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`toolbar-button ${editor.isActive('italic') ? 'is-active' : ''}`}
        title="Italic"
      >
        <FaItalic />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={`toolbar-button ${editor.isActive('underline') ? 'is-active' : ''}`}
        title="Underline"
      >
        <FaUnderline />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={`toolbar-button ${editor.isActive('strike') ? 'is-active' : ''}`}
        title="Strikethrough"
      >
        <FaStrikethrough />
      </button>

      <div className="divider" />

      {/* Headings */}
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`toolbar-button ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
        title="Heading 1"
      >
        <LuHeading1 />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`toolbar-button ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
        title="Heading 2"
      >
        <LuHeading2 />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`toolbar-button ${editor.isActive('heading', { level: 3 }) ? 'is-active' : ''}`}
        title="Heading 3"
      >
        <LuHeading3 />
      </button>
      {/* <button
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`toolbar-button ${editor.isActive('paragraph') ? 'is-active' : ''}`}
        title="Paragraph"
      >
        <FaParagraph />
      </button> */}

      <div className="divider" />

      {/* Lists */}
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`toolbar-button ${editor.isActive('bulletList') ? 'is-active' : ''}`}
        title="Bullet List"
      >
        <PiListBulletsBold />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`toolbar-button ${editor.isActive('orderedList') ? 'is-active' : ''}`}
        title="Ordered List"
      >
        <PiListNumbersBold />
      </button>
    </div>
  );
};

//Main Editor Component
export const TextEditor: React.FC = () => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],  
        },
        undoRedo: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
      History.configure({
        depth: 100, //Number of undo steps in history
      }),
      Underline,
    ],
    //Default content
    content: `
      <h1>My Document Title</h1>
      <p>This is the first paragraph. Start typing here!</p>
    `,
  });

  return (
    <div className="editor-container">
      <Toolbar editor={editor} />
      <div className="editor-content-wrapper">
        <EditorContent editor={editor} className="editor-page" />
      </div>
    </div>
  );
};

export default TextEditor;