import { useState } from 'react';
import { FileCode, FolderOpen, Folder, Plus, Trash2, Edit2, ChevronRight, ChevronDown } from 'lucide-react';
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
  path?: string;
}

interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileCreate: (name: string, type: 'file' | 'folder', parentPath?: string) => void;
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
  const [isCreating, setIsCreating] = useState<string | null>(null);
  const [newFileName, setNewFileName] = useState('');
  const [newFileType, setNewFileType] = useState<'file' | 'folder'>('file');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleCreate = (parentPath?: string) => {
    if (newFileName.trim()) {
      onFileCreate(newFileName, newFileType, parentPath);
      setNewFileName('');
      setIsCreating(null);
      toast.success(`${newFileType === 'file' ? 'File' : 'Folder'} created`);
    }
  };

  const handleRename = (id: string) => {
    if (editName.trim()) {
      onFileRename(id, editName);
      setEditingId(null);
      setEditName('');
      toast.success('Renamed successfully');
    }
  };

  const handleDelete = (id: string, name: string) => {
    onFileDelete(id);
    toast.success(`Deleted ${name}`);
  };

  const renderFileTree = (nodes: FileNode[], level = 0, parentPath = '') => {
    return nodes.map((node) => {
      const isSelected = node.id === selectedFileId;
      const isEditing = editingId === node.id;
      const isExpanded = expandedFolders.has(node.id);
      const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;

      return (
        <div key={node.id}>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="group"
          >
            <div
              className={`flex items-center gap-1 px-2 py-1.5 rounded cursor-pointer hover:bg-muted/50 ${
                isSelected ? 'bg-primary/20 text-primary' : ''
              }`}
              style={{ paddingLeft: `${level * 12 + 8}px` }}
            >
              {node.type === 'folder' && (
                <button
                  onClick={() => toggleFolder(node.id)}
                  className="p-0.5 hover:bg-muted/50 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>
              )}

              {isEditing ? (
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRename(node.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(node.id);
                    if (e.key === 'Escape') setEditingId(null);
                  }}
                  className="h-6 px-1 text-sm flex-1"
                  autoFocus
                />
              ) : (
                <>
                  {node.type === 'folder' ? (
                    <Folder className="w-4 h-4 flex-shrink-0 text-accent" />
                  ) : (
                    <FileCode className="w-4 h-4 flex-shrink-0 text-primary" />
                  )}
                  <span
                    className="flex-1 text-sm truncate"
                    onClick={() => {
                      if (node.type === 'folder') {
                        toggleFolder(node.id);
                      } else {
                        onFileSelect(node);
                      }
                    }}
                  >
                    {node.name}
                  </span>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    {node.type === 'folder' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsCreating(node.id);
                          setNewFileType('file');
                        }}
                        title="Add file"
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(node.id);
                        setEditName(node.name);
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
                        handleDelete(node.id, node.name);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          {/* Create new file/folder inside this folder */}
          {isCreating === node.id && node.type === 'folder' && (
            <div style={{ paddingLeft: `${(level + 1) * 12 + 8}px` }} className="px-2">
              <div className="flex gap-1 items-center mb-1">
                <Button
                  variant={newFileType === 'file' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setNewFileType('file')}
                >
                  File
                </Button>
                <Button
                  variant={newFileType === 'folder' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setNewFileType('folder')}
                >
                  Folder
                </Button>
              </div>
              <Input
                placeholder={newFileType === 'file' ? 'filename.js' : 'folder-name'}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => handleCreate(currentPath)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate(currentPath);
                  if (e.key === 'Escape') {
                    setIsCreating(null);
                    setNewFileName('');
                  }
                }}
                className="h-7 text-sm mb-2"
                autoFocus
              />
            </div>
          )}

          {/* Render children if folder is expanded */}
          {node.type === 'folder' && isExpanded && node.children && (
            <div>{renderFileTree(node.children, level + 1, currentPath)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-border">
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4" />
          <span className="text-sm font-semibold">Explorer</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setIsCreating('root');
              setNewFileType('file');
            }}
            title="New File"
          >
            <FileCode className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setIsCreating('root');
              setNewFileType('folder');
            }}
            title="New Folder"
          >
            <Folder className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isCreating === 'root' && (
            <div className="mb-2">
              <div className="flex gap-1 items-center mb-1">
                <Button
                  variant={newFileType === 'file' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setNewFileType('file')}
                >
                  File
                </Button>
                <Button
                  variant={newFileType === 'folder' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-6 text-xs"
                  onClick={() => setNewFileType('folder')}
                >
                  Folder
                </Button>
              </div>
              <Input
                placeholder={newFileType === 'file' ? 'filename.js' : 'folder-name'}
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onBlur={() => handleCreate()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') {
                    setIsCreating(null);
                    setNewFileName('');
                  }
                }}
                className="h-7 text-sm"
                autoFocus
              />
            </div>
          )}
          {renderFileTree(files)}
        </div>
      </ScrollArea>
    </div>
  );
};
