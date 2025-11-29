
import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect } from 'react';
import { Play, Eraser, Save, History, ChevronDown, Trash2, X, FileCode, Search } from 'lucide-react';
import CodeMirror, { ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { sql } from '@codemirror/lang-sql';
import { SavedQuery } from '../../types';

interface SQLEditorProps {
  code: string;
  onChange: (code: string) => void;
  onRun: () => void;
  savedQueries: SavedQuery[];
  onSaveQuery: (name: string, sql: string) => void;
  onDeleteQuery: (id: string) => void;
}

export interface SQLEditorHandle {
  insertText: (text: string) => void;
  getSelection: () => string;
}

const SQLEditor = forwardRef<SQLEditorHandle, SQLEditorProps>(({ 
  code, 
  onChange, 
  onRun,
  savedQueries,
  onSaveQuery,
  onDeleteQuery
}, ref) => {
  const editorRef = useRef<ReactCodeMirrorRef>(null);
  const [isHistoryOpen, setHistoryOpen] = useState(false);
  const [isSaveModalOpen, setSaveModalOpen] = useState(false);
  const [newQueryName, setNewQueryName] = useState('');
  const [searchHistoryTerm, setSearchHistoryTerm] = useState('');
  const historyRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    insertText: (text: string) => {
      const view = editorRef.current?.view;
      if (view) {
        const transaction = view.state.update({
          changes: { from: view.state.selection.main.head, insert: text },
          selection: { anchor: view.state.selection.main.head + text.length }
        });
        view.dispatch(transaction);
      } else {
        onChange(code + text);
      }
    },
    getSelection: () => {
      const view = editorRef.current?.view;
      if (view) {
        const selection = view.state.selection.main;
        if (!selection.empty) {
          return view.state.sliceDoc(selection.from, selection.to);
        }
      }
      return '';
    }
  }));

  // Close history dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Reset search when opening
  useEffect(() => {
    if (isHistoryOpen) {
      setSearchHistoryTerm('');
    }
  }, [isHistoryOpen]);

  const handleSaveClick = () => {
      setNewQueryName('');
      setSaveModalOpen(true);
  };

  const confirmSave = () => {
      if (newQueryName.trim()) {
          onSaveQuery(newQueryName, code);
          setSaveModalOpen(false);
      }
  };

  const handleLoadQuery = (sql: string) => {
      onChange(sql);
      setHistoryOpen(false);
  };

  const filteredSavedQueries = savedQueries.filter(q => 
    q.name.toLowerCase().includes(searchHistoryTerm.toLowerCase()) || 
    q.sql.toLowerCase().includes(searchHistoryTerm.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 relative z-20">
        <div className="flex items-center gap-2">
          <button 
            onClick={onRun}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors shadow-sm text-sm font-medium"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> 运行
          </button>
          <button 
            onClick={handleSaveClick}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-50 transition-colors text-sm"
          >
            <Save className="w-3.5 h-3.5" /> 保存
          </button>
          <button 
             onClick={() => onChange('')}
             className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-700 rounded hover:bg-slate-50 transition-colors text-sm"
          >
            <Eraser className="w-3.5 h-3.5" /> 清空
          </button>
        </div>

        {/* Right Side: Saved History */}
        <div className="relative" ref={historyRef}>
            <button 
                onClick={() => setHistoryOpen(!isHistoryOpen)}
                className={`flex items-center gap-2 text-slate-600 hover:text-blue-600 hover:bg-white px-2 py-1 rounded transition-colors text-xs font-medium border ${isHistoryOpen ? 'border-slate-200 bg-white' : 'border-transparent'}`}
            >
                <div className="bg-slate-200 p-1 rounded">
                   <History className="w-3.5 h-3.5" />
                </div>
                <span>已存 SQL</span>
                <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${isHistoryOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* History Dropdown */}
            {isHistoryOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden z-50 flex flex-col">
                    <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500 uppercase">历史记录 ({savedQueries.length})</span>
                    </div>
                    
                    {/* Search Input */}
                    <div className="p-2 border-b border-slate-100 bg-white">
                        <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                placeholder="搜索名称或 SQL..." 
                                value={searchHistoryTerm}
                                onChange={(e) => setSearchHistoryTerm(e.target.value)}
                                className="w-full pl-8 pr-2 py-1.5 text-xs border border-slate-200 rounded bg-slate-50 focus:outline-none focus:border-blue-400 focus:bg-white transition-colors"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto">
                        {savedQueries.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                                <History className="w-6 h-6 opacity-20" />
                                暂无保存的 SQL 记录
                            </div>
                        ) : filteredSavedQueries.length === 0 ? (
                             <div className="p-8 text-center text-xs text-slate-400">
                                未找到匹配 "{searchHistoryTerm}" 的记录
                            </div>
                        ) : (
                            filteredSavedQueries.map(query => (
                                <div key={query.id} className="flex items-center justify-between p-2 hover:bg-blue-50 group border-b border-slate-50 last:border-0 transition-colors cursor-pointer">
                                    <div 
                                        className="flex-1 min-w-0 pr-2"
                                        onClick={() => handleLoadQuery(query.sql)}
                                    >
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <FileCode className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                            <div className="text-sm font-medium text-slate-700 truncate">{query.name}</div>
                                        </div>
                                        <div className="text-[10px] text-slate-400 font-mono truncate pl-5.5">
                                            {query.sql.substring(0, 30).replace(/\n/g, ' ')}...
                                        </div>
                                    </div>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); onDeleteQuery(query.id); }}
                                        className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                                        title="删除"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>

      {/* Save Modal Dialog */}
      {isSaveModalOpen && (
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] z-50 flex items-start justify-center pt-20">
              <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-80 p-4 transform transition-all scale-100 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-slate-700 text-sm">保存当前 SQL</h3>
                      <button onClick={() => setSaveModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-4 h-4" />
                      </button>
                  </div>
                  <div className="space-y-3">
                      <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">名称</label>
                          <input 
                              type="text" 
                              autoFocus
                              value={newQueryName}
                              onChange={(e) => setNewQueryName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && confirmSave()}
                              placeholder="例如: 查询月度报表..." 
                              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                          <button 
                              onClick={() => setSaveModalOpen(false)}
                              className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded"
                          >
                              取消
                          </button>
                          <button 
                              onClick={confirmSave}
                              disabled={!newQueryName.trim()}
                              className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                              确认保存
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 overflow-hidden relative text-sm z-0">
        <CodeMirror
          ref={editorRef}
          value={code}
          height="100%"
          extensions={[sql()]}
          onChange={(value) => onChange(value)}
          theme="light"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            foldGutter: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
          className="h-full"
        />
      </div>
    </div>
  );
});

SQLEditor.displayName = 'SQLEditor';

export default SQLEditor;
