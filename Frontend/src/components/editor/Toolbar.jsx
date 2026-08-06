import React, { useState } from 'react';
import { Bold, Italic, Underline, Undo, Redo, Heading1, Heading2, List, ListOrdered, Link, Image as ImageIcon, Table as TableIcon, Code, TerminalSquare, FileText, ChevronDown, Plus, Trash2, Rows, Columns, FoldHorizontal, SplitSquareHorizontal, Loader2 } from 'lucide-react';
import { ImageService } from '../../services/ImageService';
import { toast } from 'react-toastify';

const Toolbar = ({ editor, onInsertTemplate }) => {
    const [showTemplates, setShowTemplates] = useState(false);

    if (!editor) return null;

    const fileInputRef = React.useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleImageClick = () => {
        fileInputRef.current?.click();
    };

    const handleImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await ImageService.uploadImage(file);
            editor.chain().focus().setImage({ src: url }).run();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setIsUploading(false);
            // Reset input
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const addLink = () => {
        const previousUrl = editor.getAttributes('link').href;
        const url = window.prompt('URL', previousUrl);
        if (url === null) return;
        if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
        }
        editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
    };

    const addFormula = () => {
        const formula = window.prompt('Enter KaTeX formula:', 'E = mc^2');
        if (formula) {
            editor.chain().focus().insertContent({
                type: 'math',
                attrs: { formula, displayMode: false }
            }).run();
        }
    };

    const insertTable = () => {
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    };

    const ToolbarButton = ({ onClick, disabled, isActive, icon: Icon, title }) => (
        <button
            onClick={(e) => { e.preventDefault(); onClick(); }}
            disabled={disabled}
            title={title}
            className={`p-1.5 rounded transition-colors ${
                isActive 
                ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
            <Icon className="w-4 h-4" />
        </button>
    );

    const Divider = () => <div className="w-px h-5 bg-gray-300 dark:bg-gray-600 mx-1"></div>;

    return (
        <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 rounded-t-xl">
            <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} title="Undo" />
            <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} title="Redo" />
            
            <Divider />
            
            <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} title="Bold" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} title="Italic" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={Underline} title="Underline" />
            
            <Divider />
            
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} title="Heading 1" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} title="Heading 2" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} title="Bullet List" />
            <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} title="Ordered List" />
            
            <Divider />
            
            <ToolbarButton onClick={addLink} isActive={editor.isActive('link')} icon={Link} title="Link" />
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImageUpload} 
                accept="image/*" 
                className="hidden" 
            />
            {isUploading ? (
                <div className="p-1.5 rounded text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                </div>
            ) : (
                <ToolbarButton onClick={handleImageClick} icon={ImageIcon} title="Upload Image" />
            )}
            <ToolbarButton onClick={insertTable} icon={TableIcon} title="Insert Table" />
            
            {editor.isActive('table') && (
                <>
                    <Divider />
                    <ToolbarButton onClick={() => editor.chain().focus().addRowAfter().run()} icon={Rows} title="Add Row" />
                    <ToolbarButton onClick={() => editor.chain().focus().deleteRow().run()} icon={Trash2} title="Delete Row" />
                    <ToolbarButton onClick={() => editor.chain().focus().addColumnAfter().run()} icon={Columns} title="Add Column" />
                    <ToolbarButton onClick={() => editor.chain().focus().deleteColumn().run()} icon={Trash2} title="Delete Column" />
                    <ToolbarButton onClick={() => editor.chain().focus().mergeCells().run()} icon={FoldHorizontal} title="Merge Cells" />
                    <ToolbarButton onClick={() => editor.chain().focus().splitCell().run()} icon={SplitSquareHorizontal} title="Split Cell" />
                    <ToolbarButton onClick={() => editor.chain().focus().deleteTable().run()} icon={Trash2} title="Delete Table" />
                </>
            )}
            
            <Divider />
            
            <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={TerminalSquare} title="Code Block" />
            <ToolbarButton onClick={addFormula} icon={Code} title="KaTeX Formula" />
            
            <Divider />
            
            {/* Templates Dropdown */}
            {onInsertTemplate && (
                <div className="relative">
                    <button 
                        onClick={(e) => { e.preventDefault(); setShowTemplates(!showTemplates); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                    >
                        <FileText className="w-4 h-4" /> Templates <ChevronDown className="w-3 h-3" />
                    </button>
                    {showTemplates && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl py-1 z-50">
                            {[
                                { label: 'MCQ', id: 'mcq' },
                                { label: 'True/False', id: 'tf' },
                                { label: 'Coding Question', id: 'coding' },
                                { label: 'Case Study', id: 'casestudy' }
                            ].map(tpl => (
                                <button
                                    key={tpl.id}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onInsertTemplate(tpl.id);
                                        setShowTemplates(false);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium transition-colors"
                                >
                                    {tpl.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Toolbar;
