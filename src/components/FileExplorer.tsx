import { useState } from 'react';
import { FileCode, FolderOpen, Plus, Trash2, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  content?: string;
  children?: FileNode[];
  language?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (name: string, type: 'file' | 'folder') => void;
  onFileDelete: (id: string) => void;
  onFileRename: (id: string, newName: string) => void;
  selectedFileId?: string;
}

export const FileExplorer = ({
  files,
  onFileSelect,
  onFileCreate,
  onFileDelete,
  onFileRename,
  selectedFileId,
}: FileExplorerProps) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (newFileName.trim()) {
      onFileCreate(newFileName, 'file');
      setNewFileName('');
      setIsCreating(false);
      toast.success('File created');
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      onFileRename(id, editName);
      setEditingId(null);
      setEditName('');
      toast.success('File renamed');
    }
  };

  const handleDelete = (id: string, name: string) => {
    onFileDelete(id);
    toast.success(`Deleted ${name}`);
  };

  const renderFile = (file: FileNode) => {
    const isSelected = file.id === selectedFileId;
    const isEditing = editingId === file.id;

    return (
      <motion.div
        key={file.id}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="group"
      >
        <div
          className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:bg-muted/50 ${
            isSelected ? 'bg-primary/20 text-primary' : ''
          }`}
        >
          {isEditing ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={() => handleRename(file.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename(file.id);
                if (e.key === 'Escape') setEditingId(null);
              }}
              className="h-6 px-1 text-sm"
              autoFocus
            />
          ) : (
            <>
              <FileCode className="w-4 h-4 flex-shrink-0" />
              <span
                className="flex-1 text-sm truncate"
                onClick={() => onFileSelect(file)}
              >
                {file.name}
              </span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(file.id);
                    setEditName(file.name);
                  }}
                >
                  <Edit2 className="w-3 h-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(file.id, file.name);
                  }}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-border">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          <span className="text-sm font-semibold">Explorer</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setIsCreating(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isCreating && (
            <Input
              placeholder="filename.js"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={handleCreate}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFileName('');
                }
              }}
              className="h-7 text-sm mb-2"
              autoFocus
            />
          )}
          {files.map(renderFile)}
        </div>
      </ScrollArea>
    </div>
  );
};
