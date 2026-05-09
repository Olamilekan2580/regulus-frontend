import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, List, Heading1, Heading2, Save } from 'lucide-react';

const MenuBar = ({ editor }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-2 p-2 border-b border-gray-100 bg-gray-50/50">
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-navy text-white' : 'text-gray-600'}`}
      >
        <Heading1 size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-navy text-white' : 'text-gray-600'}`}
      >
        <Bold size={18} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-navy text-white' : 'text-gray-600'}`}
      >
        <List size={18} />
      </button>
    </div>
  );
};

export default function ProposalEditor({ content, onChange, onSave }) {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content || '<h2>Project Scope</h2><p>Describe your deliverables here...</p>',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm focus-within:ring-2 focus-within:ring-navy/10 transition-all">
      <MenuBar editor={editor} />
      <div className="p-6 min-h-[400px] prose prose-slate max-w-none focus:outline-none">
        <EditorContent editor={editor} />
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
        <button 
          onClick={onSave}
          className="flex items-center gap-2 bg-navy text-white px-6 py-2 rounded-lg font-bold hover:bg-navy/90 active:scale-95 transition-all shadow-sm"
        >
          <Save size={18} /> Save Proposal
        </button>
      </div>
    </div>
  );
}