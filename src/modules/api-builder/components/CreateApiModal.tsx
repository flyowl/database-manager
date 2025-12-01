
import React, { useState } from 'react';
import { X, Save, ChevronDown } from 'lucide-react';
import { DataSource } from '../../../types';
import { ApiFolder, ApiMethod } from '../types';

interface CreateApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; path: string; method: ApiMethod; folderId: string; dataSourceId: string }) => void;
  folders: ApiFolder[];
  dataSources: DataSource[];
}

const CreateApiModal: React.FC<CreateApiModalProps> = ({ isOpen, onClose, onSubmit, folders, dataSources }) => {
  const [formData, setFormData] = useState({
    name: '',
    path: '/api/v1/',
    method: 'GET' as ApiMethod,
    folderId: folders[0]?.id || '',
    dataSourceId: dataSources[0]?.id || ''
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700">新建 API 接口</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">接口名称</label>
            <input 
              type="text" 
              autoFocus
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="例如: 查询用户列表"
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">数据源</label>
             <div className="relative">
                 <select
                    value={formData.dataSourceId}
                    onChange={(e) => setFormData({...formData, dataSourceId: e.target.value})}
                    className="w-full appearance-none px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                 >
                    {dataSources.map(ds => (
                        <option key={ds.id} value={ds.id}>{ds.name} ({ds.type})</option>
                    ))}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
             </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
             <div className="col-span-1">
                 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">请求方式</label>
                 <div className="relative">
                     <select
                        value={formData.method}
                        onChange={(e) => setFormData({...formData, method: e.target.value as ApiMethod})}
                        className="w-full appearance-none px-3 py-2.5 pr-6 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium cursor-pointer"
                     >
                        <option value="GET">GET</option>
                        <option value="POST">POST</option>
                        <option value="PUT">PUT</option>
                        <option value="DELETE">DELETE</option>
                     </select>
                     <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                 </div>
             </div>
             <div className="col-span-3">
                 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">API 路径</label>
                 <input 
                    type="text" 
                    value={formData.path}
                    onChange={(e) => setFormData({...formData, path: e.target.value})}
                    placeholder="/api/v1/..."
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-mono text-slate-600"
                 />
             </div>
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">归属目录</label>
             <div className="relative">
                 <select
                    value={formData.folderId}
                    onChange={(e) => setFormData({...formData, folderId: e.target.value})}
                    className="w-full appearance-none px-3 py-2.5 pr-8 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer"
                 >
                    {folders.map(f => (
                        <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                 </select>
                 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
             </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
                取消
            </button>
            <button 
                onClick={() => onSubmit(formData)}
                disabled={!formData.name}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                确认创建
            </button>
        </div>
      </div>
    </div>
  );
};

export default CreateApiModal;
