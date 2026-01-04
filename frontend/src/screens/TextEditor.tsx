import React, { useMemo, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCaret from '@tiptap/extension-collaboration-caret';
import { HocuspocusProvider } from '@hocuspocus/provider';
import * as Y from 'yjs';
import {
  FaBold,
  FaItalic,
  FaStrikethrough,
  FaUnderline,
  // FaParagraph,
  FaUndo,
  FaRedo,
} from 'react-icons/fa';
import { LuHeading1, LuHeading2, LuHeading3 } from 'react-icons/lu';
import { PiListBulletsBold, PiListNumbersBold } from 'react-icons/pi';

import './TextEditor.css';

//Hocuspocus Websocket Port
const COLLAB_URL = process.env.REACT_APP_COLLAB_SOCKET || "ws://localhost:6001";

//User Details
type User = {
  name?: string;
  email?: string;
};

const userColors = ['#EE7962FF', '#F29F05', '#F2CB05', '#8C41F0', '#04BF8A', '#05A6F2', '#F24172'];
// const userNames = ['Albedo', 'Venti', 'Alice', 'Durin', 'Mona'];

//Custom Extension for Tab Input
export const TabInsert = Extension.create({
  name: 'tabInsert',

  addKeyboardShortcuts() {
    return {

      Tab: () => {
        return this.editor.commands.insertContent('\t');
      },
    };
  },
});

interface ToolbarProps {
  editor: Editor | null;
}

//Toolbar Component
const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="toolbar">
      {/* Undo/Redo */}
      <button
        onClick={() => editor.chain().focus().undo().run()}
        // disabled={!editor.can().undo()}
        className="toolbar-button"
        title="Undo"
      >
        <FaUndo />
      </button>
      <button
        onClick={() => editor.chain().focus().redo().run()}
        // disabled={!editor.can().redo()}
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

  //Grab document ID from url
  const { documentId } = useParams<{ documentId: string }>();

  const [editorData, setEditorData] = useState<{
    ydoc: Y.Doc;
    provider: HocuspocusProvider;
  } | null>(null);

  const [connectionStatus, setConnectionStatus] = useState<string>('connecting');
  const [userName, setUserName] = useState<string>("");

  //Grab username
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsed: User = JSON.parse(stored);
        setUserName(parsed.name || parsed.email || "");
      }
    } catch (err) {
      console.error("Failed to parse user from localStorage:", err);
    }
  }, []);

  const userColor = useMemo(() => {
    return userColors[Math.floor(Math.random() * userColors.length)];
  }, []);

  //Set username caret
  const userCaret = useMemo(() => {
    return {
      name: userName,
      color: userColor,
    };
  }, [userName, userColor]);

  //useEffect runs once on mount to create provider
  useEffect(() => {
    //Will not init if doc id missing
    if (!documentId) {
      setConnectionStatus("error");
      return;
    }

    const doc = new Y.Doc();

    //Initialize HocuspocusProvider
    const provider = new HocuspocusProvider({
      url: COLLAB_URL,      //server url
      name: documentId,     //room name and name of doc
      document: doc,
      token: localStorage.getItem("token") || "", //passed for ws auth
    });

    provider.on('stateless', ({ payload }: { payload: string }) => {
  // If the server throws an error in onAuthenticate or fetch,
  // the provider usually closes the connection.
  if (payload === 'Unauthorized') {
    setConnectionStatus('unauthorized');
  }
});

// Also use the status event for a cleaner UI
provider.on('status', ({ status }: { status: string }) => {
  if (status === 'connected') setConnectionStatus('connected');
});

    //WebSocket logging  
    console.log("Hocuspocus Provider Initialized");
    provider.on('status', (event: { status: string }) => { 
      console.log('Provider Status:', event.status);
    });
    provider.on('synced', () => {
      console.log('Provider Synced!');
    });
    provider.on('disconnect', (event: { code: number, reason: string }) => {
      console.error('Provider Disconnected:', event.code, event.reason);
    });

    setEditorData({
      ydoc: doc,
      provider: provider,
    });

    //Cleanup function for this useEffect
    return () => {
      provider.destroy();
      doc.destroy();
    };
  }, []);


  //useEditor hook with tiptap config
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
        // history: false,
        undoRedo: false,
      }),
      Placeholder.configure({
        placeholder: 'Start writing your document...',
      }),
      TabInsert,
      //Configure Collaboration when editorData ready
      ...(editorData ? [
          Collaboration.configure({
            document: editorData.ydoc,
            field: 'default',
          }),
          CollaborationCaret.configure({
            provider: editorData.provider,
            user: userCaret,
          }),
        ] : []),
    ],
  }, [editorData, userCaret]);

  if (connectionStatus === 'connecting') {
    return <div>Connecting to document...</div>;
  }

  if (connectionStatus === 'unauthorized') {
    return <div>Access Denied: You are not a member of this group.</div>;
  }
  
  if (connectionStatus === 'error') {
    return <div>Error: Could not load document.</div>;
  }

  //loading state when editor or editorData not ready
  if (!editor || !editorData) {
    return <div>Loading editor...</div>;
  }

  return (
    <div className="editor-container">
      <Toolbar
        editor={editor}
      />
      <div className="editor-content-wrapper">
        <EditorContent editor={editor} className="editor-page" />
      </div>
    </div>
  );
};

export default TextEditor;