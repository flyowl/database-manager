
import React, { useState } from 'react';
import { ApiFolder, ApiItem } from '../types';
import { 
  Search, 
  Folder, 
  Settings,
  Box,
  FolderPlus,
  ChevronDown,
  ChevronRight,
  FileCode,
  Plus,
  Settings2
} from 'lucide-react';

interface SidebarProps {
  folders: ApiFolder[];
  apis: ApiItem[];
  selectedApiId: string | null;
  onSelectApi: (id: string) => void;
  onToggleFolder: (id: string) => void;
  onOpenCreateModal: () => void;
  onEditFolder: (folder: ApiFolder) => void;
  width: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  folders, 
  apis, 
  selectedApiId, 
  onSelectApi, 
  onToggleFolder,
  onOpenCreateModal,
  onEditFolder,
  width
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getFolderIcon = (type: string) => {
    switch(type) {
      case 'system': return <Settings className="w-3.5 h-3.5 text-amber-500" />;
      case 'business': return <Box className="w-3.5 h-3.5 text-blue-500" />;
      default: return <Folder className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredApis = apis.filter(api => 
    api.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    api.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div 
        className="h-full bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0 relative group"
        style={{ width }}
    >
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
         <div className="relative">
             <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
             <input 
                type="text" 
                placeholder="搜索接口..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
             />
             <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                 <button className="p-1 hover:bg-slate-200 rounded" title="新建文件夹">
                    <FolderPlus className="w-3.5 h-3.5 text-slate-400" />
                 </button>
             </div>
         </div>
      </div>

      {/* Tree Content */}
      <div className="flex-1 overflow-y-auto py-2">
        {folders.map(folder => {
            const folderApis = filteredApis.filter(api => api.folderId === folder.id);
            if (searchTerm && folderApis.length === 0) return null;

            return (
                <div key={folder.id} className="mb-1">
                    <div 
                        className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-slate-100 text-slate-700 select-none group/item relative"
                        onClick={() => onToggleFolder(folder.id)}
                    >
                        <span className="text-slate-400 transition-transform duration-200">
                             {folder.isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                        </span>
                        {getFolderIcon(folder.type)}
                        <span className="text-xs font-bold flex-1 truncate">{folder.name}</span>
                        {folderApis.length > 0 && (
                            <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 rounded-full group-hover/item:bg-white mr-6">{folderApis.length}</span>
                        )}
                        
                        {/* Folder Edit Button */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); onEditFolder(folder); }}
                            className="absolute right-2 p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-200 opacity-0 group-hover/item:opacity-100 transition-opacity"
                            title="编辑目录配置"
                        >
                            <Settings2 className="w-3 h-3" />
                        </button>
                    </div>

                    {folder.isOpen && (
                        <div className="mt-0.5 space-y-0.5">
                            {folderApis.map(api => (
                                <div 
                                    key={api.id}
                                    onClick={() => onSelectApi(api.id)}
                                    className={`
                                        pl-9 pr-3 py-2 cursor-pointer flex items-center gap-2 relative border-l-2 group/api
                                        ${selectedApiId === api.id 
                                            ? 'bg-blue-50 border-blue-600' 
                                            : 'border-transparent hover:bg-slate-100 hover:border-slate-200'}
                                    `}
                                >
                                    {/* Method Badge (Tiny) */}
                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${api.status === 'published' ? 'bg-green-500' : 'bg-amber-500'}`} title={api.status === 'published' ? '已发布' : '草稿'}></div>
                                    <FileCode className={`w-3.5 h-3.5 flex-shrink-0 ${selectedApiId === api.id ? 'text-blue-600' : 'text-slate-400'}`} />
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className={`text-xs truncate ${selectedApiId === api.id ? 'text-blue-700 font-medium' : 'text-slate-600'}`}>
                                            {api.name}
                                        </div>
                                    </div>

                                    {/* API Edit Button (Optional, for future) */}
                                    {/* <button className="absolute right-2 p-1 text-slate-400 hover:text-blue-600 opacity-0 group-hover/api:opacity-100 transition-opacity">
                                        <Settings2 className="w-3 h-3" />
                                    </button> */}
                                </div>
                            ))}
                            {folderApis.length === 0 && !searchTerm && (
                                <div className="pl-9 py-2 text-[10px] text-slate-400 italic">暂无接口</div>
                            )}
                        </div>
                    )}
                </div>
            );
        })}
      </div>

      {/* Footer Add Button */}
      <div className="p-3 border-t border-slate-200 bg-white">
          <button 
            onClick={onOpenCreateModal}
            className="w-full flex items-center justify-center gap-2 py-2 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-600 rounded-lg text-xs font-medium transition-all shadow-sm"
          >
              <Plus className="w-3.5 h-3.5" />
              新增接口
          </button>
      </div>
    </div>
  );
};

export default Sidebar;