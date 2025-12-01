
import React, { useState, useEffect } from 'react';
import { X, Save, Variable } from 'lucide-react';
import { ApiFolder } from '../types';
import { GlobalFunction } from '../../../types';

interface FolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: ApiFolder | null;
  onSave: (updatedFolder: ApiFolder) => void;
  functions: GlobalFunction[];
}

const FolderModal: React.FC<FolderModalProps> = ({ isOpen, onClose, folder, onSave, functions }) => {
  const [formData, setFormData] = useState<ApiFolder | null>(null);

  useEffect(() => {
    if (folder) {
      setFormData({ ...folder });
    }
  }, [folder, isOpen]);

  if (!isOpen || !formData) return null;

  const toggleHook = (type: 'preHooks' | 'postHooks', funcId: string) => {
      const currentHooks = formData[type] || [];
      const newHooks = currentHooks.includes(funcId) 
          ? currentHooks.filter(id => id !== funcId)
          : [...currentHooks, funcId];
      
      setFormData({ ...formData, [type]: newHooks });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[600px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
             目录配置 - <span className="text-blue-600">{folder?.name}</span>
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
          {/* Basic Info */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">目录名称</label>
            <input 
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-6">
              {/* Pre Hooks */}
              <div>
                  <div className="flex items-center gap-2 mb-2">
                       <Variable className="w-4 h-4 text-orange-500" />
                       <label className="block text-xs font-bold text-slate-500 uppercase">前置函数 (Pre-Request)</label>
                  </div>
                  <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 h-48 overflow-y-auto space-y-1">
                      {functions.map(fn => (
                          <div 
                             key={fn.id} 
                             onClick={() => toggleHook('preHooks', fn.id)}
                             className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-all ${
                                 formData.preHooks?.includes(fn.id) 
                                 ? 'bg-white border-blue-400 shadow-sm' 
                                 : 'border-transparent hover:bg-white hover:border-slate-200'
                             }`}
                          >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.preHooks?.includes(fn.id) ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
                                  {formData.preHooks?.includes(fn.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <div className="text-xs text-slate-700 truncate">{fn.name}</div>
                          </div>
                      ))}
                      {functions.length === 0 && <div className="text-xs text-slate-400 text-center py-4">无可用函数</div>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">在目录下所有接口执行前运行。</p>
              </div>

              {/* Post Hooks */}
              <div>
                  <div className="flex items-center gap-2 mb-2">
                       <Variable className="w-4 h-4 text-green-500" />
                       <label className="block text-xs font-bold text-slate-500 uppercase">后置函数 (Post-Request)</label>
                  </div>
                  <div className="border border-slate-200 rounded-lg bg-slate-50 p-2 h-48 overflow-y-auto space-y-1">
                      {functions.map(fn => (
                          <div 
                             key={fn.id} 
                             onClick={() => toggleHook('postHooks', fn.id)}
                             className={`flex items-center gap-2 p-2 rounded cursor-pointer border transition-all ${
                                 formData.postHooks?.includes(fn.id) 
                                 ? 'bg-white border-blue-400 shadow-sm' 
                                 : 'border-transparent hover:bg-white hover:border-slate-200'
                             }`}
                          >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center ${formData.postHooks?.includes(fn.id) ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-300'}`}>
                                  {formData.postHooks?.includes(fn.id) && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                              </div>
                              <div className="text-xs text-slate-700 truncate">{fn.name}</div>
                          </div>
                      ))}
                      {functions.length === 0 && <div className="text-xs text-slate-400 text-center py-4">无可用函数</div>}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">在目录下所有接口执行后运行。</p>
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
                onClick={() => onSave(formData)}
                disabled={!formData.name}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                保存配置
            </button>
        </div>
      </div>
    </div>
  );
};

export default FolderModal;