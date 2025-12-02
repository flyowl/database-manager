
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  DatabaseTable, 
  Folder, 
  TabOption, 
  ChatMessage, 
  QueryResult,
  SavedQuery,
  DatabaseModule
} from '../types';
import Sidebar from './components/Sidebar';
import SQLEditor, { SQLEditorHandle } from './components/SQLEditor';
import DataGrid from './components/DataGrid';
import ERDiagram from './components/ERDiagram';
import AIChat from './components/AIChat';
import FieldManager from './components/FieldManager';
import ModuleModal from './components/ModuleModal';
import { Code, FileText, Network, PanelRightClose, PanelRightOpen, Table, Layers } from 'lucide-react';
import { Node, Edge, useNodesState, useEdgesState, addEdge, Connection } from 'reactflow';
import { MOCK_TABLES, MOCK_DB_FOLDERS, MOCK_MODULES } from '../data/mockData';

const MOCK_SAVED_QUERIES: SavedQuery[] = [
    { id: '1', name: '查询高负载服务器', sql: "SELECT * FROM servers WHERE status = 'running';", createdAt: new Date() },
    { id: '2', name: '统计本月失败部署', sql: "SELECT app_id, count(*) FROM deployments WHERE status = 'failed' GROUP BY 1;", createdAt: new Date() }
];

const DatabaseManager: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.SQL);
  const [tables, setTables] = useState<DatabaseTable[]>(MOCK_TABLES);
  const [folders, setFolders] = useState<Folder[]>(MOCK_DB_FOLDERS);
  const [modules, setModules] = useState<DatabaseModule[]>(MOCK_MODULES);
  
  // Module State
  const [activeModuleId, setActiveModuleId] = useState<string | null>(null);
  const [isModuleModalOpen, setIsModuleModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState<DatabaseModule | undefined>(undefined);

  const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
  const [sqlCode, setSqlCode] = useState<string>('SELECT * FROM servers LIMIT 20;');
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>(MOCK_SAVED_QUERIES);

  // Resize States
  const [leftSidebarWidth, setLeftSidebarWidth] = useState(256);
  const [aiSidebarWidth, setAiSidebarWidth] = useState(320);
  const [sqlEditorHeight, setSqlEditorHeight] = useState(400); // Initial height for SQL Editor
  
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(true);
  
  // Resize Refs
  const resizingRef = useRef<{
      active: 'left' | 'ai' | 'sql' | null;
      startPos: number;
      startSize: number;
  }>({ active: null, startPos: 0, startSize: 0 });

  // Refs
  const sqlEditorRef = useRef<SQLEditorHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ERD State
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Resize Handlers
  const startResizing = (type: 'left' | 'ai' | 'sql', e: React.MouseEvent) => {
    e.preventDefault();
    const startPos = type === 'sql' ? e.clientY : e.clientX;
    const startSize = type === 'left' ? leftSidebarWidth : (type === 'ai' ? aiSidebarWidth : sqlEditorHeight);
    
    resizingRef.current = {
        active: type,
        startPos,
        startSize
    };
    document.body.style.cursor = type === 'sql' ? 'row-resize' : 'col-resize';
  };

  const stopResizing = useCallback(() => {
    resizingRef.current.active = null;
    document.body.style.cursor = '';
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!resizingRef.current.active) return;
    
    const { active, startPos, startSize } = resizingRef.current;
    
    if (active === 'left') {
        const diff = e.clientX - startPos;
        const newWidth = Math.max(160, Math.min(500, startSize + diff));
        setLeftSidebarWidth(newWidth);
    } else if (active === 'ai') {
        // AI sidebar is on right, dragging left increases width
        const diff = startPos - e.clientX; 
        const newWidth = Math.max(240, Math.min(600, startSize + diff));
        setAiSidebarWidth(newWidth);
    } else if (active === 'sql') {
        const diff = e.clientY - startPos;
        // Check container bounds roughly or just set reasonable limits
        const newHeight = Math.max(100, Math.min(window.innerHeight - 200, startSize + diff));
        setSqlEditorHeight(newHeight);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  // Derived State: Filtered tables based on active module
  const filteredTables = activeModuleId 
    ? tables.filter(t => modules.find(m => m.id === activeModuleId)?.tableIds.includes(t.id))
    : tables;

  // Effect: When active module changes, update ER Diagram
  useEffect(() => {
      if (activeModuleId) {
          const module = modules.find(m => m.id === activeModuleId);
          if (module) {
              handleGenerateERD(module.tableIds);
              setActiveTab(TabOption.ER_DIAGRAM);
          }
      }
  }, [activeModuleId]);

  // Handlers
  const handleToggleFolder = (id: string) => {
    setFolders(prev => prev.map(f => f.id === id ? { ...f, isOpen: !f.isOpen } : f));
  };

  const handleSelectTable = (table: DatabaseTable) => {
    setSelectedTableId(table.id);
    if (activeTab === TabOption.DATA) {
        handleFetchData(table.name);
    }
  };

  const handleFetchData = (tableName: string) => {
    setIsQueryLoading(true);
    // Simulate API call based on table name
    setTimeout(() => {
      // Mock different data based on table name for realism
      let mockData: any[] = [];
      let columns: string[] = [];

      if (tableName === 'servers') {
          columns = ['id', 'hostname', 'ip_address', 'os_version', 'status', 'region'];
          mockData = Array.from({length: 20}).map((_, i) => ({
             id: i + 1, 
             hostname: `web-prod-${String(i+1).padStart(2, '0')}`, 
             ip_address: `10.0.1.${10+i}`, 
             os_version: 'Ubuntu 22.04',
             status: i % 10 === 0 ? 'maintenance' : 'running',
             region: 'cn-hangzhou'
          }));
      } else if (tableName === 'deployments') {
          columns = ['id', 'app_id', 'version', 'status', 'created_at'];
          mockData = Array.from({length: 20}).map((_, i) => ({
             id: 1000 + i, 
             app_id: (i % 5) + 1, 
             version: `v1.2.${i}`, 
             status: i % 7 === 0 ? 'failed' : 'success',
             created_at: new Date(Date.now() - i * 3600000).toLocaleString()
          }));
      } else if (tableName === 'alert_logs') {
          columns = ['id', 'server_id', 'level', 'message', 'created_at'];
          mockData = Array.from({length: 20}).map((_, i) => ({
             id: 5000 + i, 
             server_id: (i % 10) + 1, 
             level: i % 5 === 0 ? 'critical' : 'warning',
             message: i % 5 === 0 ? 'CPU usage > 95%' : 'Disk usage > 80%',
             created_at: new Date(Date.now() - i * 60000).toLocaleString()
          }));
      } else {
          columns = ['id', 'name', 'value', 'description'];
          mockData = Array.from({length: 20}).map((_, i) => ({ id: i, name: `Item ${i}`, value: i * 10, description: `Desc for item ${i}` }));
      }

      setQueryResult({
        columns,
        data: mockData,
        executionTime: Math.floor(Math.random() * 50) + 10
      });
      setIsQueryLoading(false);
    }, 400);
  };

  const handleRunQuery = () => {
    setIsQueryLoading(true);
    // Simulate API call for custom SQL
    setTimeout(() => {
      setQueryResult({
        columns: ['id', 'hostname', 'cpu_usage', 'memory_usage'],
        data: [
          { id: 1, hostname: 'web-01', cpu_usage: '45%', memory_usage: '60%' },
          { id: 2, hostname: 'db-01', cpu_usage: '80%', memory_usage: '85%' },
          { id: 3, hostname: 'cache-01', cpu_usage: '15%', memory_usage: '40%' },
        ],
        executionTime: 45
      });
      setIsQueryLoading(false);
    }, 600);
  };

  const handleApplyAiCode = (code: string) => {
    // If we are not on SQL tab, switch to it
    if (activeTab !== TabOption.SQL) {
        setActiveTab(TabOption.SQL);
        // Wait for render cycle to ensure editor is mounted
        setTimeout(() => {
             setSqlCode(prev => prev + "\n" + code);
        }, 100);
    } else {
        // We are on SQL tab, insert at cursor
        if (sqlEditorRef.current) {
            sqlEditorRef.current.insertText(code);
        } else {
             // Fallback
             setSqlCode(prev => prev + "\n" + code);
        }
    }
  };
  
  const handleGetSqlSelection = () => {
      if (sqlEditorRef.current) {
          return sqlEditorRef.current.getSelection();
      }
      return '';
  };

  // Saved Query Handlers
  const handleSaveQuery = (name: string, sql: string) => {
      const newQuery: SavedQuery = {
          id: Date.now().toString(),
          name,
          sql,
          createdAt: new Date()
      };
      setSavedQueries(prev => [newQuery, ...prev]);
  };

  const handleDeleteQuery = (id: string) => {
      setSavedQueries(prev => prev.filter(q => q.id !== id));
  };

  // Sidebar Actions Handlers
  const handleCreateTable = (name: string, cnName: string, parentId?: string) => {
    const newTable: DatabaseTable = {
        id: `table-${Date.now()}`,
        name,
        cnName,
        columns: [
            { name: 'id', type: 'INT', isPrimaryKey: true, cnName: 'ID', description: 'Primary Key' }
        ],
        parentId,
        description: 'New Table'
    };
    setTables(prev => [...prev, newTable]);
    setSelectedTableId(newTable.id);
  };

  const handleCreateFolder = (name: string, parentId?: string) => {
      const newFolder: Folder = {
          id: `folder-${Date.now()}`,
          name,
          isOpen: true,
          parentId
      };
      setFolders(prev => [...prev, newFolder]);
  };

  const handleMoveTable = (tableId: string, folderId?: string) => {
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, parentId: folderId } : t));
  };

  const handleMoveFolder = (folderId: string, targetFolderId?: string) => {
      // Prevent moving folder into itself handled in UI, but safe check:
      if (folderId === targetFolderId) return;
      setFolders(prev => prev.map(f => f.id === folderId ? { ...f, parentId: targetFolderId } : f));
  };

  const handleUpdateTable = (tableId: string, updatedTable: DatabaseTable) => {
      setTables(prev => prev.map(t => t.id === tableId ? updatedTable : t));
  };

  // Module Handlers
  const handleSaveModule = (data: Omit<DatabaseModule, 'id'>) => {
      if (editingModule) {
          setModules(prev => prev.map(m => m.id === editingModule.id ? { ...m, ...data } : m));
          setEditingModule(undefined);
      } else {
          const newModule: DatabaseModule = {
              id: `mod-${Date.now()}`,
              ...data
          };
          setModules(prev => [...prev, newModule]);
          setActiveModuleId(newModule.id);
      }
  };

  const handleDeleteModule = (id: string) => {
      if (confirm('确定要删除这个模块吗？')) {
          setModules(prev => prev.filter(m => m.id !== id));
          if (activeModuleId === id) setActiveModuleId(null);
      }
  };

  // AI Feature Handlers
  const handleUpdateSchemaMetadata = (metadata: any) => {
     if (metadata && metadata.tables) {
         setTables(prevTables => prevTables.map(t => {
             const updateData = metadata.tables.find((mt: any) => mt.id === t.id || mt.name === t.name);
             if (updateData) {
                 const newColumns = t.columns.map(c => {
                     if (updateData.columns && updateData.columns[c.name]) {
                         return { 
                             ...c, 
                             cnName: updateData.columns[c.name].cnName || c.cnName,
                             description: updateData.columns[c.name].description || c.description
                         };
                     }
                     return c;
                 });
                 return {
                     ...t,
                     cnName: updateData.cnName || t.cnName,
                     description: updateData.description || t.description,
                     columns: newColumns
                 };
             }
             return t;
         }));
     }
  };

  const handleGenerateERD = (tableIds: string[]) => {
      setActiveTab(TabOption.ER_DIAGRAM);
      const newNodes: Node[] = [];
      const newEdges: Edge[] = [];
      
      const tablesToRender = tables.filter(t => tableIds.includes(t.id) || tableIds.includes(t.name));

      // Simple auto layout calculation
      const SPACING_X = 350;
      const SPACING_Y = 200;
      const COLS = 3;

      tablesToRender.forEach((table, index) => {
          newNodes.push({
              id: table.id,
              type: 'table',
              position: { 
                  x: (index % COLS) * SPACING_X + 50, 
                  y: Math.floor(index / COLS) * SPACING_Y + 50 
              },
              data: { label: table.name, cnName: table.cnName, columns: table.columns }
          });
      });

      // Simple auto edge detection
      tablesToRender.forEach(source => {
          source.columns.forEach(col => {
              if (col.isForeignKey) {
                  const potentialTargets = tablesToRender.filter(t => col.name.startsWith(t.name.substring(0, t.name.length - 1)) || col.name.startsWith(t.name));
                  potentialTargets.forEach(target => {
                      if (target.id !== source.id) {
                          newEdges.push({
                              id: `e-${source.id}-${col.name}-${target.id}`,
                              source: source.id,
                              sourceHandle: `s-${col.name}`,
                              target: target.id,
                              targetHandle: `t-id`,
                              animated: true,
                              style: { stroke: '#94a3b8' }
                          });
                      }
                  });
              }
          });
      });

      setNodes(newNodes);
      setEdges(newEdges);
  };

  const handleTabChange = (tab: TabOption) => {
      setActiveTab(tab);
      if (tab === TabOption.DATA && selectedTableId) {
          const table = tables.find(t => t.id === selectedTableId);
          if (table) handleFetchData(table.name);
      }
  };

  // ERD Handlers
  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#94a3b8' } }, eds)), [setEdges]);

  const onDropTableToERD = useCallback((event: any) => {
      const tableId = event.dataTransfer.getData('application/reactflow/id');
      const table = tables.find(t => t.id === tableId);
      
      if (table) {
          setNodes((nds) => {
              if (nds.find(n => n.id === tableId)) return nds;
              
              const newNode: Node = {
                  id: tableId,
                  type: 'table',
                  position: { x: event.clientX || 100, y: event.clientY || 100 },
                  data: { label: table.name, cnName: table.cnName, columns: table.columns }
              };
              return [...nds, newNode];
          });
      }
  }, [tables, setNodes]);

  const onDeleteNode = useCallback((nodeId: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== nodeId));
      setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
  }, [setNodes, setEdges]);

  return (
    <div className="flex h-full w-full bg-slate-100 overflow-hidden font-sans text-slate-800 border-t border-slate-200" ref={containerRef}>
      
      {/* Left Sidebar (Resizable) */}
      <Sidebar 
        tables={filteredTables}
        folders={folders}
        modules={modules}
        activeModuleId={activeModuleId}
        onSelectModule={setActiveModuleId}
        onCreateModule={() => { setEditingModule(undefined); setIsModuleModalOpen(true); }}
        onEditModule={(mod) => { setEditingModule(mod); setIsModuleModalOpen(true); }}
        onDeleteModule={handleDeleteModule}
        onToggleFolder={handleToggleFolder}
        onSelectTable={handleSelectTable}
        selectedTableId={selectedTableId}
        onCreateTable={handleCreateTable}
        onCreateFolder={handleCreateFolder}
        onMoveTable={handleMoveTable}
        onMoveFolder={handleMoveFolder}
        width={leftSidebarWidth}
      />
      
      {/* Left Sidebar Resize Handle */}
      <div 
        className="w-1 bg-slate-200 hover:bg-blue-400 transition-colors cursor-col-resize flex-shrink-0 z-30 flex items-center justify-center group"
        onMouseDown={(e) => startResizing('left', e)}
      >
          <div className="h-8 w-0.5 bg-slate-300 group-hover:bg-white rounded-full"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0">
        
        {/* Top Navigation Bar */}
        <div className="h-12 bg-white border-b border-slate-200 flex items-center px-4 justify-between flex-shrink-0">
            <div className="flex space-x-1 h-full pt-2">
                {[
                    { id: TabOption.SQL, label: '在线 SQL', icon: Code },
                    { id: TabOption.FIELDS, label: '字段管理', icon: Table },
                    { id: TabOption.ER_DIAGRAM, label: 'ER 图管理', icon: Network },
                    { id: TabOption.DATA, label: '数据管理', icon: FileText },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => handleTabChange(tab.id)}
                        className={`
                            flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg border-t border-l border-r transition-all
                            ${activeTab === tab.id 
                                ? 'bg-white border-slate-200 text-blue-600 -mb-[1px] relative z-10' 
                                : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'}
                        `}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-3">
                 <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    已连接
                 </div>
                 
                 {/* Toggle AI Panel Button */}
                 {!isAiSidebarOpen && (
                    <button 
                        onClick={() => setIsAiSidebarOpen(true)}
                        className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-md transition-colors border border-transparent hover:border-slate-200"
                        title="显示 AI 助手"
                    >
                        <PanelRightOpen className="w-4 h-4" />
                    </button>
                 )}
            </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative bg-slate-50 flex flex-col">
            {activeTab === TabOption.SQL && (
                <div className="flex flex-col h-full">
                    {/* Top: Editor (Resizable) */}
                    <div style={{ height: sqlEditorHeight, minHeight: 100 }} className="flex-shrink-0">
                        <SQLEditor 
                            ref={sqlEditorRef}
                            code={sqlCode} 
                            onChange={setSqlCode} 
                            onRun={handleRunQuery}
                            savedQueries={savedQueries}
                            onSaveQuery={handleSaveQuery}
                            onDeleteQuery={handleDeleteQuery}
                        />
                    </div>
                    
                    {/* Split Handle */}
                    <div 
                        className="h-1 bg-slate-200 hover:bg-blue-400 transition-colors cursor-row-resize flex-shrink-0 z-30 flex items-center justify-center group w-full"
                        onMouseDown={(e) => startResizing('sql', e)}
                    >
                        <div className="w-8 h-0.5 bg-slate-300 group-hover:bg-white rounded-full"></div>
                    </div>

                    {/* Bottom: Results */}
                    <div className="flex-1 overflow-hidden min-h-[100px]">
                        <DataGrid result={queryResult} isLoading={isQueryLoading} />
                    </div>
                </div>
            )}

            {activeTab === TabOption.ER_DIAGRAM && (
                <div className="h-full relative">
                    {activeModuleId && (
                         <div className="absolute top-4 left-4 z-10 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-md shadow-sm flex items-center gap-2 text-xs font-medium text-indigo-700">
                             <Layers className="w-3.5 h-3.5" />
                             当前模块: {modules.find(m => m.id === activeModuleId)?.name}
                         </div>
                    )}
                    <ERDiagram 
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onDrop={onDropTableToERD}
                        onDeleteNode={onDeleteNode}
                    />
                </div>
            )}

            {activeTab === TabOption.FIELDS && (
                selectedTableId ? (
                    <FieldManager 
                        table={tables.find(t => t.id === selectedTableId)!} 
                        onUpdateTable={(updated) => handleUpdateTable(updated.id, updated)}
                    />
                ) : (
                    <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
                        <Table className="w-16 h-16 opacity-20" />
                        <p>请从左侧选择一个表以管理字段</p>
                    </div>
                )
            )}

            {activeTab === TabOption.DATA && (
                <div className="h-full flex flex-col">
                     {selectedTableId ? (
                         <>
                            <div className="px-4 py-2 bg-white border-b border-slate-200 font-bold text-sm flex justify-between items-center flex-shrink-0">
                                <span>数据预览: {tables.find(t => t.id === selectedTableId)?.name}</span>
                                <button onClick={() => selectedTableId && handleFetchData(tables.find(t => t.id === selectedTableId)!.name)} className="text-blue-600 text-xs hover:underline">刷新</button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <DataGrid result={queryResult} isLoading={isQueryLoading} />
                            </div>
                         </>
                     ) : (
                        <div className="flex items-center justify-center h-full text-slate-400 flex-col gap-4">
                             <FileText className="w-16 h-16 opacity-20" />
                             <p>请从左侧选择一个表以查看数据</p>
                         </div>
                     )}
                </div>
            )}
        </div>
      </div>

      {/* AI Sidebar Resize Handle */}
      {isAiSidebarOpen && (
          <div 
            className="w-1 bg-slate-200 hover:bg-blue-400 transition-colors cursor-col-resize flex-shrink-0 z-30 flex items-center justify-center group"
            onMouseDown={(e) => startResizing('ai', e)}
          >
              <div className="h-8 w-0.5 bg-slate-300 group-hover:bg-white rounded-full"></div>
          </div>
      )}

      {/* Right Sidebar: AI Chat (Resizable) */}
      {isAiSidebarOpen && (
          <div style={{ width: aiSidebarWidth }} className="flex-shrink-0 h-full relative">
              <AIChat 
                messages={aiMessages}
                setMessages={setAiMessages}
                schema={filteredTables}
                onApplyCode={handleApplyAiCode}
                onUpdateSchemaMetadata={handleUpdateSchemaMetadata}
                onGenerateERD={handleGenerateERD}
                selectedTableId={selectedTableId}
                onGetSqlSelection={handleGetSqlSelection}
                currentSql={sqlCode}
                onClose={() => setIsAiSidebarOpen(false)}
              />
          </div>
      )}

      {/* Module Modal */}
      <ModuleModal 
          isOpen={isModuleModalOpen}
          onClose={() => setIsModuleModalOpen(false)}
          onSubmit={handleSaveModule}
          initialData={editingModule}
          allTables={tables}
      />

    </div>
  );
};

export default DatabaseManager;
