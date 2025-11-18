import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FolderOpen, Plus, Trash2, FileCode, X } from 'lucide-react';
import { dbManager, Project } from '@/lib/indexedDB';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectLoad: (projectId: string) => void;
  currentProjectId: string;
}

export const ProjectManager = ({ isOpen, onClose, onProjectLoad, currentProjectId }: ProjectManagerProps) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProject, setShowNewProject] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadProjects();
    }
  }, [isOpen]);

  const loadProjects = async () => {
    try {
      const allProjects = await dbManager.getProjects();
      setProjects(allProjects);
    } catch (error) {
      console.error('Failed to load projects:', error);
      toast.error('Failed to load projects');
    }
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) {
      toast.error('Project name is required');
      return;
    }

    try {
      const project: Project = {
        id: `project-${Date.now()}`,
        name: newProjectName,
        description: 'New AIndroCode Project',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        language: 'javascript',
      };

      await dbManager.saveProject(project);
      
      // Create default file
      await dbManager.saveFile({
        id: `file-${Date.now()}`,
        projectId: project.id,
        path: 'index.js',
        name: 'index.js',
        content: '// Welcome to your new project!\nconsole.log("Hello, World!");',
        language: 'javascript',
        updatedAt: Date.now(),
      });

      toast.success('Project created successfully!');
      setNewProjectName('');
      setShowNewProject(false);
      loadProjects();
      onProjectLoad(project.id);
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project');
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await dbManager.deleteProject(projectToDelete);
      toast.success('Project deleted');
      setProjectToDelete(null);
      loadProjects();
      
      if (projectToDelete === currentProjectId) {
        // Load another project or create a new one
        const remainingProjects = projects.filter(p => p.id !== projectToDelete);
        if (remainingProjects.length > 0) {
          onProjectLoad(remainingProjects[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project');
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Project Manager
                </h2>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <ScrollArea className="max-h-[60vh] p-4">
                <div className="space-y-4">
                  {/* New Project Section */}
                  {showNewProject ? (
                    <Card className="border-primary">
                      <CardHeader>
                        <CardTitle className="text-base">Create New Project</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <Label>Project Name</Label>
                          <Input
                            value={newProjectName}
                            onChange={(e) => setNewProjectName(e.target.value)}
                            placeholder="My Awesome Project"
                            onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={handleCreateProject} size="sm">
                            Create
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowNewProject(false);
                              setNewProjectName('');
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setShowNewProject(true)}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      New Project
                    </Button>
                  )}

                  {/* Project List */}
                  {projects.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileCode className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No projects yet. Create your first project!</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {projects.map((project) => (
                        <Card
                          key={project.id}
                          className={`cursor-pointer transition-all hover:border-primary ${
                            project.id === currentProjectId ? 'border-primary bg-primary/5' : ''
                          }`}
                        >
                          <CardContent className="p-4 flex items-center justify-between">
                            <div
                              className="flex-1"
                              onClick={() => {
                                onProjectLoad(project.id);
                                onClose();
                              }}
                            >
                              <h3 className="font-semibold">{project.name}</h3>
                              <p className="text-xs text-muted-foreground">
                                {project.description || 'No description'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                setProjectToDelete(project.id);
                              }}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!projectToDelete} onOpenChange={() => setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this project and all its files. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
