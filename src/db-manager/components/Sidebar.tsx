
import React, { useState, useEffect, useRef } from 'react';
import { DatabaseTable, Folder, DatabaseModule } from '../../types';
import { 
  ChevronRight, 
  ChevronDown, 
  Database, 
  Folder as FolderIcon, 
  FolderOpen, 
  Table, 
  Plus,
  MoreVertical,
  GripVertical,
  Move,
  FolderPlus,
  Trash2,
  X,
  Layers,
  Settings,
  Check
} from 'lucide-react';

interface SidebarProps {
  tables: DatabaseTable[];
  folders: Folder[];
  modules: DatabaseModule[];
  activeModuleId: string | null;
  onSelectModule: (id: string | null) => void;
  onCreateModule: () => void;
  onEditModule: (module: DatabaseModule) => void;
  onDeleteModule: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onSelectTable: (table: DatabaseTable) => void;
  selectedTableId?: string;
  onCreateTable: (name: string, cnName: string, parentId?: string) => void;
  onCreateFolder: (name: string, parentId?: string) => void;
  onMoveTable: (tableId: string, folderId?: string) => void;
  onMoveFolder: (folderId: string, targetFolderId?: string) => void;
  width: number;
}

interface ContextMenuState {
  x: number;
  y: number;
  type: 'table' | 'folder' | 'root';
  id?: string;
}

interface ModalState {
  type: 'createTable' | 'createFolder' | 'move' | null;
  targetId?: string; // The ID of the item being moved OR the parent ID for creation
  itemType?: 'table' | 'folder'; // Type of item being moved
}

const Sidebar: React.FC<SidebarProps> = ({ 
  tables, 
  folders, 
  modules,
  activeModuleId,
  onSelectModule,
  onCreateModule,
  onEditModule,
  onDeleteModule,
  onToggleFolder, 
  onSelectTable,
  selectedTableId,
  onCreateTable,
  onCreateFolder,
  onMoveTable,
  onMoveFolder,
  width
}) => {
  
  // State
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [inputValue, setInputValue] = useState('');
  const [cnInputValue, setCnInputValue] = useState('');
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  
  // Refs for click outside
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const moduleDropdownRef = useRef<HTMLDivElement>(null);

  // Close context menu on global click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(e.target as Node)) {
        setIsModuleDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleDragStart = (e: React.DragEvent, table: DatabaseTable) => {
    e.dataTransfer.setData('application/reactflow/type', 'table');
    e.dataTransfer.setData('application/reactflow/id', table.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleContextMenu = (e: React.MouseEvent, type: 'table' | 'folder' | 'root', id?: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, type, id });
  };

  const openModal = (type: Exclude<ModalState['type'], null>, targetId?: string, itemType?: 'table' | 'folder') => {
    setModal({ type, targetId, itemType });
    setInputValue('');
    setCnInputValue('');
    setContextMenu(null);
  };

  const handleSubmitModal = () => {
    if (!inputValue.trim()) return;
    
    if (modal.type === 'createTable') {
      onCreateTable(inputValue, cnInputValue, modal.targetId); // targetId is parentId here
    } else if (modal.type === 'createFolder') {
      onCreateFolder(inputValue, modal.targetId); // targetId is parentId here
    }
    
    setModal({ type: null });
  };

  const handleMoveConfirm = (targetFolderId?: string) => {
      if (modal.type === 'move' && modal.targetId) {
          if (modal.itemType === 'table') {
              onMoveTable(modal.targetId, targetFolderId);
          } else if (modal.itemType === 'folder') {
              onMoveFolder(modal.targetId, targetFolderId);
          }
          setModal({ type: null });
      }
  };

  const activeModule = modules.find(m => m.id === activeModuleId);

  // --- Recursive Render Helpers for Main Sidebar ---

  const renderTree = (parentId?: string, depth = 0) => {
    const currentFolders = folders.filter(f => f.parentId === parentId);
    const currentTables = tables.filter(t => t.parentId === parentId);

    // Filter empty folders in Module View to avoid clutter
    const visibleFolders = activeModuleId 
        ? currentFolders.filter(f => {
            // Check if folder has any tables or sub-folders with tables (simplified check)
            // A robust check would require full tree traversal, for now we just show if direct children exist
            const hasTables = tables.some(t => t.parentId === f.id);
            const hasSubFolders = folders.some(sub => sub.parentId === f.id); 
            // This is a shallow check, activeModuleId filtering happens in parent index.tsx, 
            // so `tables` prop here only contains filtered tables.
            return hasTables || hasSubFolders; 
        })
        : currentFolders;

    if (visibleFolders.length === 0 && currentTables.length === 0 && depth > 0) {
        return <div className="pl-6 py-1 text-xs text-slate-400 italic">空</div>;
    }

    return (
      <div className={`${depth > 0 ? 'ml-4 border-l border-slate-200 pl-2' : ''}`}>
        {visibleFolders.map(folder => (
          <div key={folder.id}>
            <div 
              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-200 cursor-pointer text-slate-700 group relative"
              onClick={() => onToggleFolder(folder.id)}
              onContextMenu={(e) => handleContextMenu(e, 'folder', folder.id)}
            >
              <span className="text-slate-400">
                {folder.isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
              <span className="text-amber-500">
                {folder.isOpen ? <FolderOpen className="w-4 h-4" /> : <FolderIcon className="w-4 h-4" />}
              </span>
              <span className="text-sm font-medium flex-1 truncate">{folder.name}</span>
            </div>

            {folder.isOpen && renderTree(folder.id, depth + 1)}
          </div>
        ))}

        {currentTables.map(table => (
          <div 
            key={table.id}
            draggable
            onDragStart={(e) => handleDragStart(e, table)}
            onClick={() => onSelectTable(table)}
            onContextMenu={(e) => handleContextMenu(e, 'table', table.id)}
            className={`
              flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer text-sm group
              ${selectedTableId === table.id 
                ? 'bg-blue-100 text-blue-700 font-medium' 
                : 'text-slate-600 hover:bg-slate-100'}
            `}
            title={`${table.name} ${table.cnName ? `(${table.cnName})` : ''}`}
          >
            <GripVertical className="w-3 h-3 opacity-0 group-hover:opacity-30 cursor-grab" />
            <Table className="w-3.5 h-3.5 opacity-70 flex-shrink-0" />
            <span className="truncate flex-1">
              {table.name}
              {table.cnName && <span className="ml-1 text-xs text-slate-400 font-normal">{table.cnName}</span>}
            </span>
            <MoreVertical className="w-3 h-3 opacity-0 group-hover:opacity-50" />
          </div>
        ))}
      </div>
    );
  };

  // --- Recursive Render Helper for Move Modal ---
  const renderMoveDestinations = (parentId?: string, depth = 0) => {
    const currentFolders = folders.filter(f => f.parentId === parentId);
    
    return (
        <>
            {currentFolders.map(folder => {
                if (modal.type === 'move' && modal.itemType === 'folder' && modal.targetId === folder.id) {
                    return null;
                }
                
                return (
                    <div key={folder.id}>
                        <button
                            onClick={() => handleMoveConfirm(folder.id)}
                            className={`w-full flex items-center gap-2 py-2 pr-2 hover:bg-blue-50 text-left text-sm text-slate-600 rounded transition-colors group`}
                            style={{ paddingLeft: `${depth * 16 + 12}px` }}
                        >
                             <span className="text-amber-500 opacity-80 group-hover:opacity-100">
                                 {folder.isOpen ? <FolderOpen className="w-4 h-4" /> : <FolderIcon className="w-4 h-4" />}
                             </span>
                             <span className="truncate">{folder.name}</span>
                        </button>
                        {renderMoveDestinations(folder.id, depth + 1)}
                    </div>
                );
            })}
        </>
    );
  };

  return (
    <div 
        className="bg-slate-50 border-r border-slate-200 flex flex-col h-full select-none relative flex-shrink-0"
        style={{ width }}
        onContextMenu={(e) => handleContextMenu(e, 'root')}
    >
      {/* Module Switcher Header */}
      <div className="p-3 border-b border-slate-200 bg-white relative z-20">
        <div 
            ref={moduleDropdownRef}
            className="relative"
        >
            <button 
                onClick={() => setIsModuleDropdownOpen(!isModuleDropdownOpen)}
                className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left"
            >
                <div className="flex items-center gap-2 overflow-hidden">
                    {activeModule ? (
                        <Layers className="w-4 h-4 text-indigo-600" />
                    ) : (
                        <Database className="w-4 h-4 text-blue-600" />
                    )}
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-slate-700 truncate">
                            {activeModule ? activeModule.name : '生产数据库 (全部)'}
                        </span>
                        {activeModule && (
                             <span className="text-[10px] text-slate-400 truncate">模块模式</span>
                        )}
                    </div>
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {isModuleDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                    <div className="p-2 border-b border-slate-100 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        切换视图
                    </div>
                    
                    <button 
                        onClick={() => { onSelectModule(null); setIsModuleDropdownOpen(false); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 text-left ${activeModuleId === null ? 'bg-blue-50 text-blue-700 font-medium' : 'text-slate-600'}`}
                    >
                        <Database className="w-4 h-4" />
                        <span>所有数据表</span>
                        {activeModuleId === null && <Check className="w-3.5 h-3.5 ml-auto" />}
                    </button>
                    
                    <div className="h-px bg-slate-100 my-1"></div>
                    
                    {modules.map(mod => (
                        <div key={mod.id} className="group relative flex items-center">
                            <button 
                                onClick={() => { onSelectModule(mod.id); setIsModuleDropdownOpen(false); }}
                                className={`flex-1 flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-100 text-left ${activeModuleId === mod.id ? 'bg-indigo-50 text-indigo-700 font-medium' : 'text-slate-600'}`}
                            >
                                <Layers className="w-4 h-4" />
                                <span className="truncate">{mod.name}</span>
                                {activeModuleId === mod.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEditModule(mod); setIsModuleDropdownOpen(false); }}
                                className="absolute right-8 p-1 text-slate-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="编辑模块"
                            >
                                <Settings className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteModule(mod.id); }}
                                className="absolute right-1 p-1 text-slate-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="删除模块"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ))}
                    
                    <div className="p-2 border-t border-slate-100 bg-slate-50">
                        <button 
                            onClick={() => { onCreateModule(); setIsModuleDropdownOpen(false); }}
                            className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 rounded text-xs font-medium transition-colors"
                        >
                            <Plus className="w-3.5 h-3.5" /> 新建业务模块
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Actions (Only show in All Tables mode or specific context) */}
      <div className="p-2 grid grid-cols-2 gap-2 border-b border-slate-200 bg-slate-50">
        <button 
            onClick={() => openModal('createTable')}
            className="flex items-center justify-center gap-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-colors"
        >
          <Plus className="w-3 h-3" /> 新建表
        </button>
        <button 
            onClick={() => openModal('createFolder')}
            className="flex items-center justify-center gap-1 bg-white border border-slate-200 rounded px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-colors"
        >
          <FolderPlus className="w-3 h-3" /> 目录
        </button>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-y-auto p-2 pb-10">
        {renderTree(undefined)}
      </div>
      
      {/* Footer / Drag Hint */}
      <div className="p-3 bg-slate-50 border-t border-slate-200 text-[10px] text-slate-400 text-center">
        {activeModuleId ? '当前为模块视图，仅显示相关表' : '将表拖到 ER 图中或右键管理'}
      </div>

      {/* --- Context Menu --- */}
      {contextMenu && (
        <div 
          ref={contextMenuRef}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className="fixed z-50 bg-white border border-slate-200 rounded-lg shadow-xl w-40 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100"
        >
          {contextMenu.type === 'table' && (
            <>
               <button 
                 onClick={() => openModal('move', contextMenu.id, 'table')}
                 className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
               >
                 <Move className="w-3.5 h-3.5" /> 移动到目录...
               </button>
               <div className="h-px bg-slate-100 my-1"></div>
               <button className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left">
                 <Trash2 className="w-3.5 h-3.5" /> 删除表
               </button>
            </>
          )}
          {/* ... existing context menus for folder and root ... */}
          {contextMenu.type === 'folder' && (
             <>
               <button 
                 onClick={() => openModal('createFolder', contextMenu.id)}
                 className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
               >
                 <FolderPlus className="w-3.5 h-3.5" /> 新建子目录
               </button>
               <button 
                 onClick={() => openModal('createTable', contextMenu.id)}
                 className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
               >
                 <Plus className="w-3.5 h-3.5" /> 在此新建表
               </button>
               <div className="h-px bg-slate-100 my-1"></div>
               <button 
                 onClick={() => openModal('move', contextMenu.id, 'folder')}
                 className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
               >
                 <Move className="w-3.5 h-3.5" /> 移动目录...
               </button>
               <button className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 w-full text-left">
                 <Trash2 className="w-3.5 h-3.5" /> 删除目录
               </button>
             </>
          )}

          {contextMenu.type === 'root' && (
             <>
                <button 
                    onClick={() => openModal('createTable')}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
                >
                    <Plus className="w-3.5 h-3.5" /> 新建表
                </button>
                <button 
                    onClick={() => openModal('createFolder')}
                    className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 w-full text-left"
                >
                    <FolderPlus className="w-3.5 h-3.5" /> 新建目录
                </button>
             </>
          )}
        </div>
      )}

      {/* --- Modals (Existing) --- */}
      {modal.type && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[1px] z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-80 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* ... existing modal content ... */}
                <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 text-sm">
                        {modal.type === 'createTable' && '新建数据表'}
                        {modal.type === 'createFolder' && '新建目录'}
                        {modal.type === 'move' && (modal.itemType === 'table' ? '移动表' : '移动目录')}
                    </h3>
                    <button onClick={() => setModal({ type: null })} className="text-slate-400 hover:text-slate-600">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {(modal.type === 'createTable' || modal.type === 'createFolder') && (
                    <div className="p-4 space-y-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1.5">
                              {modal.type === 'createTable' ? '表名称 (英文)' : '目录名称'}
                            </label>
                            <input 
                                type="text" 
                                autoFocus
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSubmitModal()}
                                placeholder={modal.type === 'createTable' ? "例如: users" : "例如: New Folder"}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                            />
                        </div>
                        
                        {modal.type === 'createTable' && (
                          <div>
                              <label className="block text-xs font-medium text-slate-500 mb-1.5">中文名称 (选填)</label>
                              <input 
                                  type="text" 
                                  value={cnInputValue}
                                  onChange={(e) => setCnInputValue(e.target.value)}
                                  onKeyDown={(e) => e.key === 'Enter' && handleSubmitModal()}
                                  placeholder="例如: 用户表"
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                              />
                          </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button 
                                onClick={() => setModal({ type: null })}
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleSubmitModal}
                                disabled={!inputValue.trim()}
                                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                创建
                            </button>
                        </div>
                    </div>
                )}

                {modal.type === 'move' && (
                    <div className="flex flex-col max-h-96">
                        <div className="overflow-y-auto p-2 space-y-1">
                            <button 
                                onClick={() => handleMoveConfirm(undefined)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded hover:bg-slate-100 text-left text-sm text-slate-600 mb-1 border border-transparent hover:border-slate-200"
                            >
                                <Database className="w-4 h-4 text-slate-400" />
                                <span className="italic text-slate-500">根目录</span>
                            </button>
                            {renderMoveDestinations(undefined, 0)}
                        </div>
                        <div className="p-2 border-t border-slate-100 bg-slate-50 text-[10px] text-slate-400 text-center">
                            选择目标目录
                        </div>
                    </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
};

export default Sidebar;
