
import React, { useState, useEffect, useRef } from 'react';
import { ApiItem, ApiParameter, ApiProcessingHook } from '../types';
import { 
  Play, 
  Table as TableIcon, 
  Code2, 
  Database,
  RefreshCw,
  CheckCircle,
  Server,
  Zap,
  Code,
  List,
  Settings2,
  ToggleLeft,
  ToggleRight,
  ScanSearch,
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  Variable,
  Lock,
  Search,
  X,
  Type,
  Hash,
  Calendar,
  FileText,
  Box,
  Braces,
  Rocket,
  History,
  GitBranch,
  RotateCcw,
  MessageSquare
} from 'lucide-react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { javascript } from '@codemirror/lang-javascript';
import { DataSource, GlobalFunction } from '../../../types';

interface WorkBenchProps {
  api: ApiItem | null;
  onUpdateApi: (api: ApiItem) => void;
  onDeleteApi: (id: string) => void;
  dataSources: DataSource[];
  functions: GlobalFunction[];
  onSelectionChange?: (selection: string) => void; // New prop for selection
}

const PARAM_TYPES = [
  { value: 'String', label: 'String (字符串)', icon: Type, color: 'text-blue-600', bg: 'bg-blue-50' },
  { value: 'Integer', label: 'Integer (整数)', icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50' },
  { value: 'Number', label: 'Number (数字)', icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50' },
  { value: 'Boolean', label: 'Boolean (布尔)', icon: ToggleRight, color: 'text-orange-600', bg: 'bg-orange-50' },
  { value: 'Array', label: 'Array (数组)', icon: List, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: 'Object', label: 'Object (对象)', icon: Box, color: 'text-indigo-600', bg: 'bg-indigo-50' },
  { value: 'Date', label: 'Date (日期)', icon: Calendar, color: 'text-pink-600', bg: 'bg-pink-50' },
  { value: 'File', label: 'File (文件)', icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
  { value: 'Any', label: 'Any (任意)', icon: Braces, color: 'text-amber-600', bg: 'bg-amber-50' },
];

const INITIAL_MOCK_VERSIONS = [
    { version: 'v1.0.2', desc: '优化查询性能，增加索引提示', time: '2023-11-15 14:30', operator: 'Admin' },
    { version: 'v1.0.1', desc: '增加 create_time 过滤条件', time: '2023-11-14 09:20', operator: 'John Doe' },
    { version: 'v1.0.0', desc: '初始发布', time: '2023-11-10 16:00', operator: 'Admin' },
];

const WorkBench: React.FC<WorkBenchProps> = ({ api, onUpdateApi, onDeleteApi, dataSources, functions, onSelectionChange }) => {
  const [activeTopTab, setActiveTopTab] = useState<'sql' | 'pre' | 'post' | 'versions'>('sql');
  const [activeRightTab, setActiveRightTab] = useState<'params' | 'config'>('params');
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [localSql, setLocalSql] = useState('');
  
  // Versions State
  const [versions, setVersions] = useState(INITIAL_MOCK_VERSIONS);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [publishDesc, setPublishDesc] = useState('');

  // Hook State
  const [selectedHookId, setSelectedHookId] = useState<string | null>(null);
  const [isAddHookMenuOpen, setIsAddHookMenuOpen] = useState(false);
  const [isFunctionSelectModalOpen, setIsFunctionSelectModalOpen] = useState(false);
  const [functionSearchTerm, setFunctionSearchTerm] = useState('');

  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const addMenuRef = useRef<HTMLDivElement>(null);

  // Layout State (Resizable)
  const [middleHeightPercent, setMiddleHeightPercent] = useState(65); // Percentage of total height (minus header)
  const [editorWidthPercent, setEditorWidthPercent] = useState(60); // Percentage of middle width

  const resizingRef = useRef<{
    active: 'vertical' | 'horizontal' | null;
    startPos: number;
    startSize: number;
  }>({ active: null, startPos: 0, startSize: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const middleContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (api) {
        setLocalSql(api.sql);
        setResult(null);
        setActiveTopTab('sql');
        setSelectedHookId(null);
        setIsAddHookMenuOpen(false);
        setIsFunctionSelectModalOpen(false);
        if (onSelectionChange) onSelectionChange(''); // Reset selection on api switch
    }
  }, [api?.id]);

  useEffect(() => {
    if (api && api.sql !== localSql) {
        setLocalSql(api.sql);
    }
  }, [api?.sql]);

  // Click outside for menu
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
              setIsAddHookMenuOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Resize Handlers
  const startResizing = (type: 'vertical' | 'horizontal', e: React.MouseEvent) => {
      e.preventDefault();
      const startPos = type === 'vertical' ? e.clientX : e.clientY;
      const startSize = type === 'vertical' 
        ? editorWidthPercent 
        : middleHeightPercent;

      resizingRef.current = { active: type, startPos, startSize };
      document.body.style.cursor = type === 'vertical' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
  };

  const handleMouseMove = (e: MouseEvent) => {
      if (!resizingRef.current.active) return;
      const { active, startPos, startSize } = resizingRef.current;

      if (active === 'vertical' && middleContainerRef.current) {
          const containerWidth = middleContainerRef.current.clientWidth;
          const deltaPixels = e.clientX - startPos;
          const deltaPercent = (deltaPixels / containerWidth) * 100;
          setEditorWidthPercent(Math.max(20, Math.min(80, startSize + deltaPercent)));
      } else if (active === 'horizontal' && containerRef.current) {
          const containerHeight = containerRef.current.clientHeight;
          const deltaPixels = e.clientY - startPos;
          const deltaPercent = (deltaPixels / containerHeight) * 100;
          setMiddleHeightPercent(Math.max(20, Math.min(80, startSize + deltaPercent)));
      }
  };

  const handleMouseUp = () => {
      resizingRef.current.active = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
  };

  useEffect(() => {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
          window.removeEventListener('mousemove', handleMouseMove);
          window.removeEventListener('mouseup', handleMouseUp);
      };
  }, []);

  const handleSqlChange = (value: string) => {
    setLocalSql(value);
    onUpdateApi({ ...api!, sql: value });
  };
  
  // Helper to handle editor update for selection
  const handleEditorUpdate = (viewUpdate: any) => {
      if (onSelectionChange && viewUpdate.selectionSet) {
          const ranges = viewUpdate.state.selection.ranges;
          if (ranges.length > 0) {
            const range = ranges[0];
            const text = viewUpdate.state.sliceDoc(range.from, range.to);
            onSelectionChange(text);
          }
      }
  };

  const identifyParams = () => {
      if (!api) return;
      const paramRegex = /#\{([a-zA-Z0-9_]+)\}/g;
      const foundParams = new Set<string>();
      let match;
      while ((match = paramRegex.exec(localSql)) !== null) {
          foundParams.add(match[1]);
      }

      const currentParamsMap = new Map<string, ApiParameter>();
      api.params.forEach(p => currentParamsMap.set(p.name, p));

      const newParams: ApiParameter[] = [];
      // Keep existing params that are still valid or user defined
      api.params.forEach(p => {
          if (foundParams.has(p.name)) {
              newParams.push(p);
              foundParams.delete(p.name);
          }
      });
      // Add new found params
      foundParams.forEach(name => {
          newParams.push({
              name,
              type: 'String',
              required: true,
              defaultValue: '',
              sampleValue: '',
              description: ''
          });
      });

      onUpdateApi({ ...api, params: newParams });
  };

  const insertIfSnippet = () => {
      const snippet = "\n<if test=\"param != null\">\n  AND column = #{param}\n</if>\n";
      const view = editorRef.current?.view;
      if (view) {
          const transaction = view.state.update({
              changes: { from: view.state.selection.main.head, insert: snippet },
              selection: { anchor: view.state.selection.main.head + snippet.length }
          });
          view.dispatch(transaction);
      } else {
          setLocalSql(prev => prev + snippet);
      }
  };

  const handleRun = () => {
    setIsRunning(true);
    setTimeout(() => {
        setResult({
            status: 200,
            message: "Success",
            executionTime: "45ms",
            data: [
                { id: 1, category: "Electronics", sales: 125000 },
                { id: 2, category: "Clothing", sales: 89000 },
                { id: 3, category: "Home & Garden", sales: 54000 },
                { id: 4, category: "Books", sales: 32000 }
            ]
        });
        setIsRunning(false);
    }, 800);
  };

  const handlePublishClick = () => {
      if (!api) return;
      setPublishDesc('');
      setIsPublishModalOpen(true);
  };

  const confirmPublish = () => {
      if (!api) return;
      
      const newVersion = {
          version: `v1.0.${versions.length + 3}`, // Mock logic for version numbering
          desc: publishDesc || '常规更新',
          time: new Date().toLocaleString(),
          operator: 'Admin'
      };

      setVersions([newVersion, ...versions]);
      onUpdateApi({ ...api, status: 'published' });
      setIsPublishModalOpen(false);
      setActiveTopTab('versions'); // Auto switch to versions tab
  };

  const handleParamUpdate = (idx: number, field: keyof ApiParameter, value: any) => {
      if (!api) return;
      const newParams = [...api.params];
      newParams[idx] = { ...newParams[idx], [field]: value };
      onUpdateApi({ ...api, params: newParams });
  };

  const handleConfigUpdate = (field: keyof typeof api.config, value: any) => {
      if (!api) return;
      onUpdateApi({
          ...api,
          config: {
              ...api.config,
              [field]: value
          }
      });
  };

  // --- Hook Management ---

  const getActiveHooks = () => {
      if (!api) return [];
      return activeTopTab === 'pre' ? (api.preHooks || []) : (api.postHooks || []);
  };

  const updateActiveHooks = (newHooks: ApiProcessingHook[]) => {
      if (!api) return;
      if (activeTopTab === 'pre') {
          onUpdateApi({ ...api, preHooks: newHooks });
      } else {
          onUpdateApi({ ...api, postHooks: newHooks });
      }
  };

  const addCustomScriptHook = () => {
      const newHook: ApiProcessingHook = {
          id: `hook-${Date.now()}`,
          name: `New Custom ${activeTopTab === 'pre' ? 'Pre' : 'Post'} Script`,
          type: 'script',
          code: activeTopTab === 'pre' 
            ? `// Handle input parameters\n// params: Map<String, Object>\nfunction run(params) {\n  // your logic here\n  return params;\n}`
            : `// Handle SQL result\n// data: List<Object>\nfunction run(data) {\n  // your logic here\n  return data;\n}`,
          enabled: true
      };
      updateActiveHooks([...getActiveHooks(), newHook]);
      setSelectedHookId(newHook.id);
      setIsAddHookMenuOpen(false);
  };

  const addGlobalFunctionHook = (func: GlobalFunction) => {
      const newHook: ApiProcessingHook = {
          id: `hook-${Date.now()}`,
          name: func.name,
          type: 'global',
          code: func.code, // Copy for display, runtime should use reference
          enabled: true,
          globalFunctionId: func.id
      };
      updateActiveHooks([...getActiveHooks(), newHook]);
      setSelectedHookId(newHook.id);
      setIsFunctionSelectModalOpen(false);
      setIsAddHookMenuOpen(false);
  };

  const deleteHook = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const hooks = getActiveHooks().filter(h => h.id !== id);
      updateActiveHooks(hooks);
      if (selectedHookId === id) setSelectedHookId(null);
  };

  const moveHook = (idx: number, direction: 'up' | 'down', e: React.MouseEvent) => {
      e.stopPropagation();
      const hooks = [...getActiveHooks()];
      if (direction === 'up' && idx > 0) {
          [hooks[idx], hooks[idx - 1]] = [hooks[idx - 1], hooks[idx]];
      } else if (direction === 'down' && idx < hooks.length - 1) {
          [hooks[idx], hooks[idx + 1]] = [hooks[idx + 1], hooks[idx]];
      }
      updateActiveHooks(hooks);
  };

  const updateHookCode = (code: string) => {
      if (!selectedHookId) return;
      // Only allow updating code if it's a script type
      const hook = getActiveHooks().find(h => h.id === selectedHookId);
      if (hook?.type === 'global') return; // Should be handled by readOnly in editor, but extra safety

      const hooks = getActiveHooks().map(h => h.id === selectedHookId ? { ...h, code } : h);
      updateActiveHooks(hooks);
  };

  const updateHookName = (id: string, name: string) => {
      const hooks = getActiveHooks().map(h => h.id === id ? { ...h, name } : h);
      updateActiveHooks(hooks);
  };
  
  const toggleHook = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const hooks = getActiveHooks().map(h => h.id === id ? { ...h, enabled: !h.enabled } : h);
      updateActiveHooks(hooks);
  };

  const selectedHook = getActiveHooks().find(h => h.id === selectedHookId);
  const filteredFunctions = functions.filter(f => f.name.toLowerCase().includes(functionSearchTerm.toLowerCase()));

  // --- Render Helpers ---

  const renderHooksList = () => (
      <div className="flex flex-col h-full bg-slate-50">
          <div className="px-4 py-2 border-b border-slate-200 flex justify-between items-center bg-white">
              <h3 className="font-bold text-xs text-slate-700 uppercase">
                  {activeTopTab === 'pre' ? '前置处理流程' : '后置处理流程'}
              </h3>
              <div className="relative" ref={addMenuRef}>
                  <button 
                    onClick={() => setIsAddHookMenuOpen(!isAddHookMenuOpen)}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                  >
                      <Plus className="w-3.5 h-3.5" /> 添加步骤
                  </button>
                  {isAddHookMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 flex flex-col animate-in fade-in zoom-in-95 duration-100">
                          <button 
                            onClick={() => { setIsFunctionSelectModalOpen(true); setIsAddHookMenuOpen(false); }}
                            className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                          >
                              <Variable className="w-3.5 h-3.5" /> 引用全局函数
                          </button>
                          <button 
                            onClick={addCustomScriptHook}
                            className="text-left px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 hover:text-blue-600 flex items-center gap-2"
                          >
                              <Code2 className="w-3.5 h-3.5" /> 添加自定义脚本
                          </button>
                      </div>
                  )}
              </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {getActiveHooks().length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                      暂无{activeTopTab === 'pre' ? '前置' : '后置'}处理步骤
                  </div>
              ) : (
                  getActiveHooks().map((hook, idx) => (
                      <div 
                        key={hook.id}
                        onClick={() => setSelectedHookId(hook.id)}
                        className={`group border rounded-lg p-2 cursor-pointer transition-all relative overflow-hidden ${
                            selectedHookId === hook.id 
                            ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-100' 
                            : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                      >
                          {hook.type === 'global' && (
                              <div className="absolute top-0 right-0 p-1 bg-slate-100 rounded-bl text-slate-400" title="引用自全局函数 (只读)">
                                  <Lock className="w-3 h-3" />
                              </div>
                          )}
                          <div className="flex items-center gap-2 mb-1">
                              <span className="w-5 h-5 flex items-center justify-center bg-slate-100 text-slate-500 text-[10px] font-bold rounded">
                                  {idx + 1}
                              </span>
                              <input 
                                  type="text" 
                                  value={hook.name}
                                  onChange={(e) => updateHookName(hook.id, e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="flex-1 text-xs font-medium bg-transparent border-none focus:ring-0 focus:underline outline-none text-slate-700 mr-4"
                              />
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2 bg-white/80 backdrop-blur-[1px] rounded">
                                  <button onClick={(e) => toggleHook(hook.id, e)} className={`${hook.enabled ? 'text-green-500' : 'text-slate-300'} hover:scale-110`}>
                                      {hook.enabled ? <ToggleRight className="w-4 h-4"/> : <ToggleLeft className="w-4 h-4"/>}
                                  </button>
                                  <button onClick={(e) => moveHook(idx, 'up', e)} disabled={idx === 0} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30">
                                      <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={(e) => moveHook(idx, 'down', e)} disabled={idx === getActiveHooks().length - 1} className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-30">
                                      <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={(e) => deleteHook(hook.id, e)} className="p-1 text-slate-400 hover:text-red-600">
                                      <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                              </div>
                          </div>
                          <div className="pl-7 text-[10px] text-slate-400 truncate font-mono flex items-center gap-2">
                             {hook.type === 'global' ? <span className="text-purple-500 bg-purple-50 px-1 rounded">Global Fn</span> : <span className="text-orange-500 bg-orange-50 px-1 rounded">Script</span>}
                             {activeTopTab === 'pre' ? 'Input: Params' : 'Input: Result Data'}
                          </div>
                      </div>
                  ))
              )}
          </div>
      </div>
  );

  const renderVersionsList = () => (
    <div className="flex flex-col h-full bg-slate-50">
        <div className="px-4 py-2 border-b border-slate-200 flex justify-between items-center bg-white">
            <h3 className="font-bold text-xs text-slate-700 uppercase">
                版本历史记录
            </h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {versions.map((v, i) => (
                <div key={i} className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                             <span className={`px-2 py-0.5 rounded text-xs font-bold ${i === 0 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                 {v.version}
                             </span>
                             {i === 0 && <span className="text-[10px] text-green-600 font-medium bg-green-50 px-1.5 rounded-full">Current</span>}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{v.time}</span>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{v.desc}</p>
                    <div className="flex justify-between items-center text-xs text-slate-500 border-t border-slate-50 pt-2">
                        <span className="flex items-center gap-1">
                            <Variable className="w-3 h-3" /> {v.operator}
                        </span>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="text-blue-600 hover:underline flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" /> 还原
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderFunctionSelectModal = () => {
      if (!isFunctionSelectModalOpen) return null;
      return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] h-[400px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <Variable className="w-4 h-4 text-blue-600" /> 选择全局函数
                      </h3>
                      <button onClick={() => setIsFunctionSelectModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                      </button>
                  </div>
                  
                  <div className="p-3 border-b border-slate-100">
                      <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="搜索函数..."
                            value={functionSearchTerm}
                            onChange={(e) => setFunctionSearchTerm(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                            autoFocus
                          />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2">
                      {filteredFunctions.length === 0 ? (
                          <div className="text-center py-10 text-slate-400 text-sm">未找到相关函数</div>
                      ) : (
                          <div className="space-y-1">
                              {filteredFunctions.map(fn => (
                                  <button
                                    key={fn.id}
                                    onClick={() => addGlobalFunctionHook(fn)}
                                    className="w-full text-left p-3 rounded-lg border border-transparent hover:bg-slate-50 hover:border-slate-200 group transition-all"
                                  >
                                      <div className="flex justify-between items-center mb-0.5">
                                          <span className="font-medium text-slate-700 text-sm group-hover:text-blue-700">{fn.name}</span>
                                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">v1.0</span>
                                      </div>
                                      <div className="text-xs text-slate-400 truncate">{fn.description || '无描述'}</div>
                                  </button>
                              ))}
                          </div>
                      )}
                  </div>
              </div>
          </div>
      );
  };

  const renderPublishModal = () => {
    if (!isPublishModalOpen) return null;
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-blue-600" />
                        发布接口
                    </h3>
                    <button onClick={() => setIsPublishModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 text-xs text-blue-700">
                        <span className="font-bold">注意：</span> 发布后，接口配置将生效并对外提供服务。
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">版本更新说明 / 变更日志</label>
                        <textarea
                            value={publishDesc}
                            onChange={(e) => setPublishDesc(e.target.value)}
                            placeholder="例如: 优化了查询性能，修复了参数校验问题..."
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 min-h-[120px] resize-none"
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
                        className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
                    >
                        <Rocket className="w-4 h-4" />
                        确认发布
                    </button>
                </div>
            </div>
        </div>
    );
  };

  if (!api) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400">
         <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100">
             <Code2 className="w-8 h-8 opacity-20" />
         </div>
         <p>请从左侧选择一个接口或新建接口</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white min-w-0">
      
      {/* 1. Header Info (Fixed Height) */}
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white flex-shrink-0 z-10">
          <div className="flex items-center gap-4 flex-1">
              <div className={`px-2 py-0.5 rounded text-xs font-bold border ${
                  api.method === 'GET' ? 'bg-blue-50 text-blue-600 border-blue-200' :
                  api.method === 'POST' ? 'bg-green-50 text-green-600 border-green-200' :
                  'bg-orange-50 text-orange-600 border-orange-200'
              }`}>
                  {api.method}
              </div>
              <div className="flex flex-col">
                  <input 
                    type="text" 
                    value={api.name}
                    onChange={(e) => onUpdateApi({...api, name: e.target.value})}
                    className="font-bold text-slate-800 text-sm focus:outline-none focus:bg-slate-50 rounded px-1 -ml-1" 
                  />
                  <div className="text-[10px] text-slate-500 font-mono">
                      {api.path}
                  </div>
              </div>
              
              <div className="ml-4 flex items-center gap-2 bg-slate-50 px-2 py-1 rounded border border-slate-200">
                  <Database className="w-3 h-3 text-slate-400" />
                  <div className="relative">
                      <select 
                        value={api.dataSourceId || ''}
                        onChange={(e) => onUpdateApi({...api, dataSourceId: e.target.value})}
                        className="bg-transparent text-xs text-slate-600 outline-none border-none w-32 truncate appearance-none pr-4 cursor-pointer"
                      >
                          <option value="">选择数据源...</option>
                          {dataSources.map(ds => (
                              <option key={ds.id} value={ds.id}>{ds.name}</option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                  </div>
              </div>
          </div>

          <div className="flex items-center gap-2">
              <button 
                 onClick={handleRun}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 text-xs font-medium rounded hover:bg-slate-50 shadow-sm transition-colors"
              >
                  <Play className="w-3.5 h-3.5" /> 运行测试
              </button>
              <button 
                 onClick={handlePublishClick}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 shadow-sm transition-colors"
                 title="发布接口到生产环境"
              >
                  <Rocket className="w-3.5 h-3.5" /> 发布
              </button>
          </div>
      </div>

      {/* 2. Resizable Content Container */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden" ref={containerRef}>
          
          {/* Middle Section: Editor + Params (Resizable Height) */}
          <div style={{ height: `${middleHeightPercent}%` }} className="flex flex-col min-h-[100px]" ref={middleContainerRef}>
              
              {/* Top Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-2 flex-shrink-0">
                  {[
                      { id: 'sql', label: 'SQL 编辑器', icon: Code2 },
                      { id: 'pre', label: '前置处理', icon: Zap },
                      { id: 'post', label: '后置处理', icon: Server },
                      { id: 'versions', label: '版本管理', icon: History }
                  ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => {
                            setActiveTopTab(tab.id as any);
                            setSelectedHookId(null);
                        }}
                        className={`
                            flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-colors
                            ${activeTopTab === tab.id 
                                ? 'border-blue-600 text-blue-600 bg-white' 
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100'}
                        `}
                      >
                          <tab.icon className="w-3.5 h-3.5" />
                          {tab.label}
                      </button>
                  ))}
              </div>

              {/* Split Content */}
              <div className="flex-1 flex overflow-hidden">
                  
                  {/* Left Pane (Editor or Versions List) */}
                  <div style={{ width: activeTopTab === 'versions' ? '100%' : `${editorWidthPercent}%` }} className="flex flex-col border-r border-slate-200 min-w-[200px] relative transition-all">
                      
                      {/* SQL Toolbar */}
                      {activeTopTab === 'sql' && (
                        <div className="px-2 py-1 bg-white border-b border-slate-100 flex gap-2">
                             <button 
                                onClick={insertIfSnippet}
                                className="flex items-center gap-1 px-2 py-1 text-[10px] bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 rounded transition-colors"
                                title="插入动态 SQL IF 语句"
                             >
                                 <Code className="w-3 h-3" /> if 语句
                             </button>
                        </div>
                      )}

                      {/* Hook Toolbar */}
                      {(activeTopTab === 'pre' || activeTopTab === 'post') && selectedHookId && (
                         <div className="px-2 py-1 bg-white border-b border-slate-100 flex justify-between items-center text-[10px] text-slate-500">
                             <span>Script Editor (Javascript)</span>
                             <div className="flex items-center gap-2">
                                 {selectedHook?.type === 'global' && <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 rounded border border-purple-100"><Lock className="w-2.5 h-2.5"/> 只读 (Global)</span>}
                                 <span className="font-mono text-xs font-bold text-slate-700">{selectedHook?.name}</span>
                             </div>
                         </div>
                      )}
                      
                      <div className="flex-1 relative overflow-hidden bg-white">
                        {activeTopTab === 'versions' ? (
                            renderVersionsList()
                        ) : activeTopTab === 'sql' ? (
                            <CodeMirror
                                ref={editorRef}
                                value={localSql}
                                height="100%"
                                extensions={[sql()]}
                                onChange={handleSqlChange}
                                onUpdate={handleEditorUpdate}
                                theme="light"
                                basicSetup={{
                                    lineNumbers: true,
                                    highlightActiveLineGutter: true,
                                    foldGutter: true,
                                }}
                                className="h-full text-sm"
                            />
                        ) : (
                            selectedHookId ? (
                                <CodeMirror
                                    value={selectedHook?.code || ''}
                                    height="100%"
                                    extensions={[javascript()]}
                                    onChange={updateHookCode}
                                    onUpdate={handleEditorUpdate}
                                    readOnly={selectedHook?.type === 'global'}
                                    theme="light"
                                    basicSetup={{
                                        lineNumbers: true,
                                        highlightActiveLineGutter: true,
                                        foldGutter: true,
                                    }}
                                    className={`h-full text-sm ${selectedHook?.type === 'global' ? 'opacity-80' : ''}`}
                                />
                            ) : (
                                <div className="flex-1 h-full flex items-center justify-center text-slate-400 text-xs bg-slate-50/30 flex-col gap-2">
                                    <List className="w-8 h-8 opacity-20" />
                                    <p>在右侧选择或添加一个步骤以编辑代码</p>
                                </div>
                            )
                        )}
                        
                        {/* Global Function Banner overlay if needed */}
                        {selectedHookId && selectedHook?.type === 'global' && activeTopTab !== 'sql' && activeTopTab !== 'versions' && (
                             <div className="absolute bottom-2 right-4 bg-slate-800 text-white text-[10px] px-2 py-1 rounded shadow opacity-50 hover:opacity-100 pointer-events-none transition-opacity">
                                 Global Function (Read Only)
                             </div>
                        )}
                      </div>
                  </div>

                  {/* Vertical Resizer (Only if not in Versions tab) */}
                  {activeTopTab !== 'versions' && (
                      <div 
                          className="w-1 bg-slate-100 hover:bg-blue-400 cursor-col-resize z-20 flex items-center justify-center group flex-shrink-0 transition-colors"
                          onMouseDown={(e) => startResizing('vertical', e)}
                      >
                          <div className="h-6 w-0.5 bg-slate-300 group-hover:bg-white rounded-full"></div>
                      </div>
                  )}

                  {/* Right Pane (Context / Params / Hooks) - Hidden in Versions tab */}
                  {activeTopTab !== 'versions' && (
                      <div className="flex-1 flex flex-col min-w-[200px] bg-white">
                          
                          {activeTopTab === 'sql' ? (
                              <>
                                {/* Right Tabs for SQL mode */}
                                <div className="flex border-b border-slate-200 bg-slate-50">
                                    <button
                                        onClick={() => setActiveRightTab('params')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium border-b-2 transition-colors ${
                                            activeRightTab === 'params' 
                                            ? 'border-blue-500 text-blue-600 bg-white' 
                                            : 'border-transparent text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        <List className="w-3.5 h-3.5" /> 参数定义
                                    </button>
                                    <button
                                        onClick={() => setActiveRightTab('config')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-medium border-b-2 transition-colors ${
                                            activeRightTab === 'config' 
                                            ? 'border-blue-500 text-blue-600 bg-white' 
                                            : 'border-transparent text-slate-500 hover:bg-slate-100'
                                        }`}
                                    >
                                        <Settings2 className="w-3.5 h-3.5" /> 高级配置
                                    </button>
                                </div>

                                <div className="flex-1 overflow-auto">
                                    {activeRightTab === 'params' ? (
                                        <div className="flex flex-col h-full">
                                             {/* Identify Button */}
                                             <div className="p-2 border-b border-slate-100 bg-slate-50 flex justify-end">
                                                <button 
                                                    onClick={identifyParams}
                                                    className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-300 hover:border-blue-400 hover:text-blue-600 text-slate-600 rounded text-xs transition-colors shadow-sm"
                                                >
                                                    <ScanSearch className="w-3.5 h-3.5" /> 自动识别参数
                                                </button>
                                             </div>
                                             <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-3 py-2 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">参数名</th>
                                                        <th className="px-3 py-2 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase w-32">类型</th>
                                                        <th className="px-3 py-2 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase w-12 text-center">必填</th>
                                                        <th className="px-3 py-2 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">测试值</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {api.params.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="p-8 text-center text-xs text-slate-400">
                                                                无参数 (使用 <code className="bg-slate-100 px-1 rounded">#{'{name}'}</code> 添加，或点击自动识别)
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        api.params.map((param, idx) => {
                                                            const currentType = PARAM_TYPES.find(t => t.value === param.type) || PARAM_TYPES[0];
                                                            return (
                                                            <tr key={idx} className="hover:bg-slate-50 group">
                                                                <td className="px-3 py-2 text-xs font-mono font-medium text-purple-600">
                                                                    {param.name}
                                                                </td>
                                                                <td className="px-3 py-2 relative">
                                                                    <div className={`flex items-center gap-2 px-2 py-1 rounded border border-slate-200 ${currentType.bg} ${currentType.color} cursor-pointer hover:border-blue-300 transition-colors relative`}>
                                                                        <currentType.icon className="w-3 h-3 flex-shrink-0" />
                                                                        <span className="text-xs truncate flex-1">{currentType.label.split(' ')[0]}</span>
                                                                        <ChevronDown className="w-3 h-3 opacity-50" />
                                                                        
                                                                        <select 
                                                                            value={param.type}
                                                                            onChange={(e) => handleParamUpdate(idx, 'type', e.target.value)}
                                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                                        >
                                                                            {PARAM_TYPES.map(type => (
                                                                                <option key={type.value} value={type.value}>
                                                                                    {type.label}
                                                                                </option>
                                                                            ))}
                                                                        </select>
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-2 text-center">
                                                                    <input 
                                                                        type="checkbox"
                                                                        checked={param.required}
                                                                        onChange={(e) => handleParamUpdate(idx, 'required', e.target.checked)}
                                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                                                    />
                                                                </td>
                                                                <td className="px-3 py-2">
                                                                    <input 
                                                                        type="text" 
                                                                        value={param.sampleValue}
                                                                        onChange={(e) => handleParamUpdate(idx, 'sampleValue', e.target.value)}
                                                                        className="w-full text-xs border-transparent bg-transparent hover:border-slate-200 focus:border-blue-500 focus:bg-white rounded px-1 outline-none py-0.5 transition-all"
                                                                        placeholder="值..."
                                                                    />
                                                                </td>
                                                            </tr>
                                                            );
                                                        })
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="p-4 space-y-6">
                                            {/* Pagination Settings */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-bold text-slate-700">自动分页设置</h4>
                                                    <button 
                                                        onClick={() => handleConfigUpdate('enablePagination', !api.config?.enablePagination)}
                                                        className={`text-slate-400 hover:text-blue-600 transition-colors ${api.config?.enablePagination ? 'text-blue-600' : ''}`}
                                                    >
                                                        {api.config?.enablePagination ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mb-3">开启后，系统将自动处理 SQL 分页逻辑，并在响应中包含 total, page, pageSize 等元数据。</p>
                                                
                                                {api.config?.enablePagination && (
                                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div>
                                                            <label className="block text-xs text-slate-500 mb-1">默认每页条数 (PageSize)</label>
                                                            <input 
                                                                type="number" 
                                                                value={api.config.pageSize || 20}
                                                                onChange={(e) => handleConfigUpdate('pageSize', parseInt(e.target.value))}
                                                                className="w-full text-xs px-2 py-1.5 border border-slate-200 rounded focus:outline-none focus:border-blue-500"
                                                            />
                                                        </div>
                                                        <div className="text-[10px] text-slate-500">
                                                            <span className="font-bold">提示:</span> 请求参数将增加 <code className="bg-white px-1 border border-slate-200 rounded">page</code> 和 <code className="bg-white px-1 border border-slate-200 rounded">pageSize</code>。
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <hr className="border-slate-100" />

                                            {/* Sorting Settings */}
                                            <div>
                                                <div className="flex items-center justify-between mb-2">
                                                    <h4 className="text-xs font-bold text-slate-700">动态排序设置</h4>
                                                    <button 
                                                        onClick={() => handleConfigUpdate('enableSorting', !api.config?.enableSorting)}
                                                        className={`text-slate-400 hover:text-blue-600 transition-colors ${api.config?.enableSorting ? 'text-blue-600' : ''}`}
                                                    >
                                                        {api.config?.enableSorting ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                                                    </button>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mb-3">开启后，允许客户端通过参数指定排序字段和方向。</p>
                                                
                                                {api.config?.enableSorting && (
                                                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                                                        <div className="text-[10px] text-slate-500">
                                                            <span className="font-bold">提示:</span> 请求参数将增加 <code className="bg-white px-1 border border-slate-200 rounded">sortField</code> 和 <code className="bg-white px-1 border border-slate-200 rounded">sortOrder</code>。
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                              </>
                          ) : (
                              // Hooks List Panel (for Pre/Post)
                              renderHooksList()
                          )}
                      </div>
                  )}
              </div>
          </div>

          {/* Horizontal Resizer */}
          <div 
              className="h-1 bg-slate-100 hover:bg-blue-400 cursor-row-resize z-20 flex items-center justify-center group flex-shrink-0 transition-colors w-full"
              onMouseDown={(e) => startResizing('horizontal', e)}
          >
              <div className="w-8 h-0.5 bg-slate-300 group-hover:bg-white rounded-full"></div>
          </div>

          {/* Bottom Section: Test Results (Remaining Height) */}
          <div className="flex-1 flex flex-col bg-white min-h-[100px] overflow-hidden">
              <div className="px-4 py-2 border-b border-slate-100 bg-slate-50 flex justify-between items-center flex-shrink-0">
                   <div className="flex items-center gap-2 font-bold text-xs text-slate-700">
                       <TableIcon className="w-3.5 h-3.5" /> 测试返回数据
                   </div>
                   {result && (
                       <div className="flex items-center gap-3">
                           <span className="text-xs text-green-600 flex items-center gap-1">
                               <CheckCircle className="w-3 h-3" /> {result.status}
                           </span>
                           <span className="text-xs text-slate-400">{result.executionTime}</span>
                           <span className="text-xs text-slate-400">{result.data.length} 条记录</span>
                       </div>
                   )}
              </div>
              
              <div className="flex-1 overflow-auto p-0 relative">
                  {isRunning ? (
                       <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                           <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
                       </div>
                  ) : null}

                  {result ? (
                      <div className="p-0">
                           <table className="w-full text-left border-collapse">
                               <thead className="bg-slate-50 text-xs text-slate-500 sticky top-0 shadow-sm">
                                   <tr>
                                       <th className="px-4 py-2 border-b border-r border-slate-100 w-12 text-center">#</th>
                                       {Object.keys(result.data[0] || {}).map(key => (
                                           <th key={key} className="px-4 py-2 border-b border-r border-slate-100 font-medium whitespace-nowrap">{key}</th>
                                       ))}
                                   </tr>
                               </thead>
                               <tbody className="text-xs text-slate-700">
                                   {result.data.map((row: any, i: number) => (
                                       <tr key={i} className="hover:bg-blue-50/50">
                                           <td className="px-4 py-1.5 border-b border-r border-slate-100 text-center text-slate-400">{i + 1}</td>
                                           {Object.values(row).map((val: any, j: number) => (
                                                <td key={j} className="px-4 py-1.5 border-b border-r border-slate-100 whitespace-nowrap">{val}</td>
                                           ))}
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                      </div>
                  ) : (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300">
                          <p className="text-xs">点击顶部 "运行" 按钮查看结果</p>
                      </div>
                  )}
              </div>
          </div>
      </div>
      {renderFunctionSelectModal()}
      {renderPublishModal()}
    </div>
  );
};

export default WorkBench;
