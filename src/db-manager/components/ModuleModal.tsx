
import React, { useState, useEffect } from 'react';
import { DatabaseTable, DatabaseModule } from '../../types';
import { X, Save, Layers, CheckSquare, Square } from 'lucide-react';

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<DatabaseModule, 'id'>) => void;
  initialData?: DatabaseModule;
  allTables: DatabaseTable[];
}

const ModuleModal: React.FC<ModuleModalProps> = ({ isOpen, onClose, onSubmit, initialData, allTables }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setName(initialData.name);
        setDescription(initialData.description || '');
        setSelectedTables(new Set(initialData.tableIds));
      } else {
        setName('');
        setDescription('');
        setSelectedTables(new Set());
      }
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!name.trim()) return;
    onSubmit({
      name,
      description,
      tableIds: Array.from(selectedTables)
    });
    onClose();
  };

  const toggleTable = (tableId: string) => {
    const newSet = new Set(selectedTables);
    if (newSet.has(tableId)) {
      newSet.delete(tableId);
    } else {
      newSet.add(tableId);
    }
    setSelectedTables(newSet);
  };

  const toggleAll = () => {
      if (selectedTables.size === allTables.length) {
          setSelectedTables(new Set());
      } else {
          setSelectedTables(new Set(allTables.map(t => t.id)));
      }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[600px] flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-600" />
            {initialData ? '编辑业务模块' : '新建业务模块'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">模块名称 <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如: 订单管理模块"
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">模块描述</label>
             <textarea 
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="描述该模块包含的业务范围..."
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
             />
          </div>

          <div>
             <div className="flex justify-between items-center mb-2">
                 <label className="block text-xs font-bold text-slate-500 uppercase">选择包含的数据表 ({selectedTables.size})</label>
                 <button 
                    onClick={toggleAll}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                 >
                     {selectedTables.size === allTables.length ? '取消全选' : '全选'}
                 </button>
             </div>
             <div className="border border-slate-200 rounded-lg max-h-60 overflow-y-auto bg-slate-50 p-2 grid grid-cols-2 gap-2">
                 {allTables.map(table => (
                     <div 
                        key={table.id}
                        onClick={() => toggleTable(table.id)}
                        className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-all ${
                            selectedTables.has(table.id) 
                            ? 'bg-white border-blue-400 shadow-sm' 
                            : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                        }`}
                     >
                         <div className={`flex-shrink-0 text-blue-600`}>
                             {selectedTables.has(table.id) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-300" />}
                         </div>
                         <div className="flex-1 min-w-0">
                             <div className="text-sm font-medium text-slate-700 truncate">{table.name}</div>
                             {table.cnName && <div className="text-xs text-slate-400 truncate">{table.cnName}</div>}
                         </div>
                     </div>
                 ))}
             </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-xl">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
                取消
            </button>
            <button 
                onClick={handleSubmit}
                disabled={!name.trim()}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                保存模块
            </button>
        </div>
      </div>
    </div>
  );
};

export default ModuleModal;
