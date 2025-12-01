
import React, { useState } from 'react';
import { GlobalFunction } from '../types';
import { MOCK_FUNCTIONS } from '../data/mockData';
import { Search, Plus, Save, Trash2, Code2, Variable, Tag, Clock, X, Rocket, History, RotateCcw } from 'lucide-react';
import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import AIChatFloating from '../modules/api-builder/components/AIChatFloating';

const INITIAL_MOCK_VERSIONS = [
    { version: 'v1.0.1', desc: '修复了日期格式化的问题', time: '2023-11-20 10:00', operator: 'Admin' },
    { version: 'v1.0.0', desc: '初始版本提交', time: '2023-11-10 14:00', operator: 'Admin' },
];

const FunctionManager: React.FC = () => {
  const [functions, setFunctions] = useState<GlobalFunction[]>(MOCK_FUNCTIONS);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(MOCK_FUNCTIONS[0]?.id || null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // View State
  const [activeTab, setActiveTab] = useState<'editor' | 'versions'>('editor');
  const [versions, setVersions] = useState(INITIAL_MOCK_VERSIONS);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishDesc, setPublishDesc] = useState('');

  // Tag Input State
  const [tagInput, setTagInput] = useState('');

  // Form State
  const [formData, setFormData] = useState<GlobalFunction | null>(null);
  
  // Editor Selection for AI
  const [editorSelection, setEditorSelection] = useState<string>('');

  const handleSelectFunction = (func: GlobalFunction) => {
    setSelectedFunctionId(func.id);
    setFormData({ ...func });
    setIsEditing(false);
    setTagInput(''); // Reset tag input
    setEditorSelection('');
    setActiveTab('editor');
    // In a real app, you would fetch versions for this specific function here
    setVersions(INITIAL_MOCK_VERSIONS);
  };

  const handleCreate = () => {
    const newFunc: GlobalFunction = {
      id: `fn-${Date.now()}`,
      name: 'New Function',
      description: '',
      code: '// Write your function logic here\nfunction run(context) {\n  \n}',
      tags: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setFunctions([newFunc, ...functions]);
    setSelectedFunctionId(newFunc.id);
    setFormData(newFunc);
    setIsEditing(true);
    setTagInput(''); // Reset tag input
    setEditorSelection('');
    setActiveTab('editor');
    setVersions([]);
  };

  const handleSave = () => {
    if (formData) {
      setFunctions(prev => prev.map(f => f.id === formData.id ? { ...formData, updatedAt: new Date() } : f));
      setIsEditing(false);
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除此函数吗？')) {
      const newFuncs = functions.filter(f => f.id !== id);
      setFunctions(newFuncs);
      if (selectedFunctionId === id) {
        setSelectedFunctionId(newFuncs[0]?.id || null);
        setFormData(newFuncs[0] || null);
      }
    }
  };

  const handlePublishClick = () => {
      setPublishDesc('');
      setIsPublishModalOpen(true);
  };

  const confirmPublish = () => {
      if (!formData) return;

      const newVersion = {
          version: `v1.0.${versions.length + 2}`,
          desc: publishDesc || '日常更新发布',
          time: new Date().toLocaleString(),
          operator: 'Admin'
      };

      setVersions([newVersion, ...versions]);
      
      // Update function timestamp
      const updatedFunc = { ...formData, updatedAt: new Date() };
      setFormData(updatedFunc);
      setFunctions(prev => prev.map(f => f.id === updatedFunc.id ? updatedFunc : f));

      setIsPublishModalOpen(false);
      setActiveTab('versions');
  };

  const handleApplyAiCode = (code: string) => {
      if (formData) {
          setFormData({ ...formData, code: code });
      }
  };
  
  const handleEditorUpdate = (viewUpdate: any) => {
      if (viewUpdate.selectionSet) {
          const ranges = viewUpdate.state.selection.ranges;
          if (ranges.length > 0) {
            const range = ranges[0];
            const text = viewUpdate.state.sliceDoc(range.from, range.to);
            setEditorSelection(text);
          }
      }
  };

  const filteredFunctions = functions.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex w-full h-full bg-slate-100 overflow-hidden relative">
      {/* Sidebar List */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                <Variable className="w-5 h-5 text-indigo-600" /> 函数管理
            </h2>
            <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="搜索函数或标签..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:bg-white transition-all" 
                />
            </div>
            <button 
                onClick={handleCreate}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg text-xs font-medium transition-colors shadow-sm"
            >
                <Plus className="w-3.5 h-3.5" /> 新建函数
            </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredFunctions.map(func => (
                <div 
                    key={func.id}
                    onClick={() => handleSelectFunction(func)}
                    className={`group p-3 rounded-lg cursor-pointer border transition-all ${
                        selectedFunctionId === func.id 
                        ? 'bg-indigo-50 border-indigo-200 shadow-sm' 
                        : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                    }`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <div className={`font-medium text-sm truncate ${selectedFunctionId === func.id ? 'text-indigo-700' : 'text-slate-700'}`}>
                            {func.name}
                        </div>
                        {selectedFunctionId === func.id && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDelete(func.id); }}
                                className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate mb-2">{func.description || '暂无描述'}</div>
                    <div className="flex gap-1 flex-wrap">
                        {func.tags?.map(tag => (
                            <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] flex items-center gap-0.5">
                                <Tag className="w-2.5 h-2.5" /> {tag}
                            </span>
                        ))}
                    </div>
                </div>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
          {formData ? (
              <>
                  {/* Header */}
                  <div className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between flex-shrink-0">
                      <div>
                          <div className="flex items-center gap-2">
                              <input 
                                  type="text" 
                                  value={formData.name}
                                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                                  className="text-lg font-bold text-slate-800 bg-transparent focus:bg-slate-50 rounded px-1 outline-none border border-transparent focus:border-slate-200 transition-all"
                              />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                              <span className="flex items-center gap-1"><Clock className="w-3 h-3"/> Updated: {formData.updatedAt.toLocaleString()}</span>
                              <span>ID: {formData.id}</span>
                          </div>
                      </div>
                      <div className="flex items-center gap-2">
                          <button 
                            onClick={handleSave}
                            className="flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-50 shadow-sm transition-colors text-xs font-medium"
                          >
                              <Save className="w-3.5 h-3.5" /> 保存
                          </button>
                          <button 
                            onClick={handlePublishClick}
                            className="flex items-center gap-1.5 bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 shadow-sm transition-colors text-xs font-medium"
                          >
                              <Rocket className="w-3.5 h-3.5" /> 发布
                          </button>
                      </div>
                  </div>

                  {/* Tabs */}
                  <div className="flex border-b border-slate-200 bg-slate-50 px-4 flex-shrink-0">
                      {[
                          { id: 'editor', label: '代码与配置', icon: Code2 },
                          { id: 'versions', label: '版本管理', icon: History },
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`
                                flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors
                                ${activeTab === tab.id 
                                    ? 'border-indigo-600 text-indigo-600 bg-white' 
                                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                            `}
                          >
                              <tab.icon className="w-3.5 h-3.5" />
                              {tab.label}
                          </button>
                      ))}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 overflow-hidden flex flex-col relative">
                      {activeTab === 'editor' ? (
                          <div className="flex-1 overflow-y-auto p-6 space-y-4">
                              {/* Meta Info */}
                              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">描述</label>
                                          <input 
                                              type="text" 
                                              value={formData.description || ''}
                                              onChange={(e) => setFormData({...formData, description: e.target.value})}
                                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
                                              placeholder="简要描述函数功能..."
                                          />
                                      </div>
                                      <div>
                                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">标签 (Tags)</label>
                                          <div className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus-within:border-indigo-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-indigo-200 transition-all flex flex-wrap gap-2 items-center min-h-[42px]">
                                              {formData.tags?.map((tag, index) => (
                                                  <span key={index} className="px-2 py-1 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-xs flex items-center gap-1 shadow-sm font-medium">
                                                      <Tag className="w-3 h-3 opacity-50" />
                                                      {tag}
                                                      <button 
                                                          onClick={() => {
                                                              const newTags = formData.tags?.filter((_, i) => i !== index) || [];
                                                              setFormData({ ...formData, tags: newTags });
                                                          }}
                                                          className="hover:text-red-500 ml-1 text-indigo-400"
                                                      >
                                                          <X className="w-3 h-3" />
                                                      </button>
                                                  </span>
                                              ))}
                                              <input 
                                                  type="text" 
                                                  value={tagInput}
                                                  onChange={(e) => setTagInput(e.target.value)}
                                                  onKeyDown={(e) => {
                                                      if (e.key === 'Enter') {
                                                          e.preventDefault();
                                                          const trimmed = tagInput.trim();
                                                          if (trimmed && !formData.tags?.includes(trimmed)) {
                                                              setFormData({ ...formData, tags: [...(formData.tags || []), trimmed] });
                                                              setTagInput('');
                                                          }
                                                      } else if (e.key === 'Backspace' && !tagInput && formData.tags?.length) {
                                                           const newTags = [...(formData.tags || [])];
                                                           newTags.pop();
                                                           setFormData({ ...formData, tags: newTags });
                                                      }
                                                  }}
                                                  className="flex-1 bg-transparent border-none outline-none min-w-[100px] text-slate-700 placeholder:text-slate-400"
                                                  placeholder={formData.tags?.length ? "" : "输入标签并回车..."}
                                              />
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              {/* Code Editor */}
                              <div className="flex-1 min-h-[400px] bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                                  <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                                      <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                                          <Code2 className="w-4 h-4" />
                                          <span>Function Logic (JavaScript)</span>
                                      </div>
                                      <span className="text-[10px] text-slate-400">Supported: ES6+</span>
                                  </div>
                                  <div className="flex-1 overflow-hidden">
                                      <CodeMirror
                                          value={formData.code}
                                          height="100%"
                                          extensions={[javascript()]}
                                          onChange={(value) => setFormData({...formData, code: value})}
                                          onUpdate={handleEditorUpdate}
                                          theme="light"
                                          basicSetup={{
                                              lineNumbers: true,
                                              highlightActiveLineGutter: true,
                                              foldGutter: true,
                                          }}
                                          className="h-full text-sm"
                                      />
                                  </div>
                              </div>
                          </div>
                      ) : (
                          // Versions Tab Content
                          <div className="flex-1 overflow-y-auto p-6">
                              <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                                  <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                                      <h3 className="font-bold text-xs text-slate-700 uppercase">
                                          发布历史记录
                                      </h3>
                                  </div>
                                  <div className="divide-y divide-slate-100">
                                      {versions.length === 0 ? (
                                          <div className="p-8 text-center text-slate-400 text-xs">暂无发布记录</div>
                                      ) : (
                                          versions.map((v, i) => (
                                              <div key={i} className="p-4 hover:bg-slate-50 transition-colors group">
                                                  <div className="flex justify-between items-start mb-2">
                                                      <div className="flex items-center gap-3">
                                                           <span className={`px-2 py-0.5 rounded text-xs font-bold ${i === 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                                               {v.version}
                                                           </span>
                                                           {i === 0 && <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 rounded-full">Current</span>}
                                                           <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                                                               <Clock className="w-3 h-3" /> {v.time}
                                                           </span>
                                                      </div>
                                                      <button className="text-xs text-indigo-600 hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                          <RotateCcw className="w-3 h-3" /> 还原此版本
                                                      </button>
                                                  </div>
                                                  <p className="text-sm text-slate-700 mb-2 pl-1">{v.desc}</p>
                                                  <div className="text-xs text-slate-400 pl-1">
                                                      操作人: {v.operator}
                                                  </div>
                                              </div>
                                          ))
                                      )}
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>
              </>
          ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <Variable className="w-16 h-16 opacity-20 mb-4" />
                  <p>请选择左侧函数或新建函数</p>
              </div>
          )}
      </div>

      {/* Publish Modal */}
      {isPublishModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <Rocket className="w-5 h-5 text-indigo-600" />
                          发布函数
                      </h3>
                      <button onClick={() => setIsPublishModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <div className="p-6">
                      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mb-4 text-xs text-indigo-700">
                          <span className="font-bold">注意：</span> 发布后，该函数的新逻辑将立即在所有引用它的 API 中生效。
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">更新说明 / 变更日志</label>
                          <textarea
                              value={publishDesc}
                              onChange={(e) => setPublishDesc(e.target.value)}
                              placeholder="例如: 优化了正则匹配效率，修复了空值异常..."
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 min-h-[120px] resize-none"
                              autoFocus
                          />
                      </div>
                  </div>
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button 
                          onClick={() => setIsPublishModalOpen(false)}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                      >
                          取消
                      </button>
                      <button 
                          onClick={confirmPublish}
                          className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700 shadow-sm transition-colors flex items-center gap-2"
                      >
                          <Rocket className="w-4 h-4" />
                          确认发布
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Floating AI Chat for Function Mode */}
      <AIChatFloating 
          onApplyCode={handleApplyAiCode}
          mode="FUNCTION"
          selectedContext={editorSelection}
      />
    </div>
  );
};

export default FunctionManager;
