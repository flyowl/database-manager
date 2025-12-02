
import React, { useState, useRef, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import WorkBench from './components/WorkBench';
import CreateApiModal from './components/CreateApiModal';
import FolderModal from './components/FolderModal';
import AIChatFloating from './components/AIChatFloating';
import { MOCK_FOLDERS, MOCK_APIS } from './data';
import { ApiItem, ApiFolder } from './types';
import { MOCK_TABLES, MOCK_DATA_SOURCES, MOCK_FUNCTIONS } from '../../data/mockData';

const ApiBuilder: React.FC = () => {
  const [folders, setFolders] = useState<ApiFolder[]>(MOCK_FOLDERS);
  const [apis, setApis] = useState(MOCK_APIS);
  const [selectedApiId, setSelectedApiId] = useState<string | null>(null);
  
  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const resizingRef = useRef<{
    active: boolean;
    startX: number;
    startWidth: number;
  }>({ active: false, startX: 0, startWidth: 0 });

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [editingFolder, setEditingFolder] = useState<ApiFolder | null>(null);
  
  // Context Selection for AI
  const [editorSelection, setEditorSelection] = useState<string>('');

  // Resize Logic
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    resizingRef.current = {
      active: true,
      startX: e.clientX,
      startWidth: sidebarWidth
    };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const stopResizing = useCallback(() => {
    resizingRef.current.active = false;
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!resizingRef.current.active) return;
    const diff = e.clientX - resizingRef.current.startX;
    const newWidth = Math.max(200, Math.min(600, resizingRef.current.startWidth + diff));
    setSidebarWidth(newWidth);
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);


  const handleToggleFolder = (id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  const handleEditFolder = (folder: ApiFolder) => {
    setEditingFolder(folder);
    setIsFolderModalOpen(true);
  };

  const handleSaveFolder = (updatedFolder: ApiFolder) => {
      setFolders(prev => prev.map(f => f.id === updatedFolder.id ? updatedFolder : f));
      setIsFolderModalOpen(false);
  };

  const handleCreateApi = (data: { name: string; path: string; method: any; folderId: string; dataSourceId: string }) => {
      const newApi: ApiItem = {
          id: `new-${Date.now()}`,
          name: data.name,
          path: data.path,
          method: data.method,
          folderId: data.folderId,
          dataSourceId: data.dataSourceId,
          status: 'draft',
          sql: 'SELECT * FROM table_name LIMIT 10', // Default Template
          params: [],
          config: {
              enablePagination: false,
              pageSize: 20,
              enableSorting: false
          }
      };
      setApis([...apis, newApi]);
      setSelectedApiId(newApi.id);
      
      // Ensure folder is open
      setFolders(prev => prev.map(f => f.id === data.folderId ? { ...f, isOpen: true } : f));
      setIsCreateModalOpen(false);
  };

  const handleUpdateApi = (updated: ApiItem) => {
      setApis(prev => prev.map(api => api.id === updated.id ? updated : api));
  };

  const handleDeleteApi = (id: string) => {
      setApis(prev => prev.filter(api => api.id !== id));
      if (selectedApiId === id) setSelectedApiId(null);
  };

  const handleAiApplyCode = (code: string) => {
      if (selectedApiId) {
          const currentApi = apis.find(a => a.id === selectedApiId);
          if (currentApi) {
              // This basic logic replaces entire SQL. A more advanced version might handle partial insertion.
              handleUpdateApi({ ...currentApi, sql: code });
          }
      }
  };

  const handleAiBatchCreate = (data: { folders: any[], apis: any[] }) => {
      const newFolders = [...folders];
      const newApis = [...apis];
      const folderMap = new Map<string, string>(); // Name -> ID mapping

      // 1. Process Folders
      data.folders?.forEach(f => {
          // Check if folder exists by name
          const existing = newFolders.find(ef => ef.name === f.name);
          if (existing) {
              folderMap.set(f.name, existing.id);
          } else {
              const newId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              newFolders.push({
                  id: newId,
                  name: f.name,
                  isOpen: true,
                  type: f.type || 'business'
              });
              folderMap.set(f.name, newId);
          }
      });

      // 2. Process APIs
      data.apis?.forEach(a => {
          const folderId = folderMap.get(a.folderName) || newFolders[0].id;
          newApis.push({
              id: `api-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              name: a.name,
              path: a.path,
              method: a.method,
              folderId: folderId,
              dataSourceId: MOCK_DATA_SOURCES[0].id, // Default to first DS
              status: 'draft',
              sql: a.sql || '',
              params: a.params || [],
              config: { enablePagination: false, pageSize: 20, enableSorting: false },
              preHooks: [],
              postHooks: []
          });
      });

      setFolders(newFolders);
      setApis(newApis);
  };

  const selectedApi = selectedApiId ? apis.find(a => a.id === selectedApiId) || null : null;

  return (
    <div className="flex w-full h-full bg-slate-100 overflow-hidden relative">
      <Sidebar 
        folders={folders} 
        apis={apis} 
        selectedApiId={selectedApiId}
        onSelectApi={setSelectedApiId}
        onToggleFolder={handleToggleFolder}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onEditFolder={handleEditFolder}
        width={sidebarWidth}
      />
      
      {/* Sidebar Resizer */}
      <div 
        className="w-1 bg-slate-200 hover:bg-blue-400 cursor-col-resize z-20 flex items-center justify-center group flex-shrink-0 transition-colors"
        onMouseDown={startResizing}
      >
          <div className="h-8 w-0.5 bg-slate-300 group-hover:bg-white rounded-full"></div>
      </div>

      <WorkBench 
        api={selectedApi}
        onUpdateApi={handleUpdateApi}
        onDeleteApi={handleDeleteApi}
        dataSources={MOCK_DATA_SOURCES}
        functions={MOCK_FUNCTIONS}
        onSelectionChange={setEditorSelection}
      />

      {/* Feature: Create Modal */}
      <CreateApiModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateApi}
        folders={folders}
        dataSources={MOCK_DATA_SOURCES}
      />

      {/* Feature: Folder Modal */}
      <FolderModal 
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        folder={editingFolder}
        onSave={handleSaveFolder}
        functions={MOCK_FUNCTIONS}
      />

      {/* Feature: Floating AI Chat */}
      <AIChatFloating 
        schema={MOCK_TABLES}
        onApplyCode={handleAiApplyCode}
        onBatchCreate={handleAiBatchCreate}
        mode="SQL"
        selectedContext={editorSelection}
      />
    </div>
  );
};

export default ApiBuilder;
