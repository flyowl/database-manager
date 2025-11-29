import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  DatabaseTable, 
  Folder, 
  TabOption, 
  ChatMessage, 
  QueryResult,
  SavedQuery
} from '../types';
import Sidebar from './components/Sidebar';
import SQLEditor, { SQLEditorHandle } from './components/SQLEditor';
import DataGrid from './components/DataGrid';
import ERDiagram from './components/ERDiagram';
import AIChat from './components/AIChat';
import FieldManager from './components/FieldManager';
import { Database, Table, Code, FileText, Network, PanelRightClose, PanelRightOpen, GripVertical, GripHorizontal } from 'lucide-react';
import { Node, Edge, useNodesState, useEdgesState, addEdge, Connection } from 'reactflow';

// --- MOCK DATA ---
const MOCK_TABLES: DatabaseTable[] = [
  {
    id: 'users',
    name: 'users',
    cnName: '用户表',
    description: '存储系统所有用户的基本信息',
    parentId: 'folder-1',
    columns: [
      { name: 'id', type: 'INT', isPrimaryKey: true, cnName: '用户ID', description: '主键自增' },
      { name: 'username', type: 'VARCHAR(50)', cnName: '用户名', description: '登录账号' },
      { name: 'email', type: 'VARCHAR(100)', cnName: '邮箱', description: '联系邮箱' },
      { name: 'created_at', type: 'TIMESTAMP', cnName: '创建时间', description: '注册时间' }
    ]
  },
  {
    id: 'orders',
    name: 'orders',
    cnName: '订单表',
    description: '用户的购买记录',
    parentId: 'folder-1',
    columns: [
      { name: 'id', type: 'INT', isPrimaryKey: true, cnName: '订单ID', description: '' },
      { name: 'user_id', type: 'INT', isForeignKey: true, cnName: '用户ID', description: '关联 users 表' },
      { name: 'total_amount', type: 'DECIMAL', cnName: '总金额', description: '' },
      { name: 'status', type: 'VARCHAR(20)', cnName: '状态', description: 'pending, paid, shipped' }
    ]
  },
  {
    id: 'products',
    name: 'products',
    cnName: '商品表',
    description: '库存商品信息',
    parentId: 'folder-2',
    columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, cnName: '商品ID', description: '' },
        { name: 'name', type: 'VARCHAR(100)', cnName: '商品名称', description: '' },
        { name: 'price', type: 'DECIMAL', cnName: '价格', description: '' }
    ]
  },
  {
    id: 'order_items',
    name: 'order_items',
    cnName: '订单明细表',
    description: '',
    parentId: 'folder-1',
    columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, cnName: 'ID', description: '' },
        { name: 'order_id', type: 'INT', isForeignKey: true, cnName: '订单ID', description: '' },
        { name: 'product_id', type: 'INT', isForeignKey: true, cnName: '商品ID', description: '' },
        { name: 'quantity', type: 'INT', cnName: '数量', description: '' }
    ]
  }
];

const MOCK_FOLDERS: Folder[] = [
  { id: 'folder-1', name: 'Sales Data', isOpen: true },
  { id: 'folder-2', name: 'Inventory', isOpen: false }
];

const MOCK_SAVED_QUERIES: SavedQuery[] = [
    { id: '1', name: '查询活跃用户', sql: "SELECT * FROM users WHERE status = 'active';", createdAt: new Date() },
    { id: '2', name: '统计每月销售额', sql: "SELECT date_trunc('month', created_at) as month, SUM(total_amount) FROM orders GROUP BY 1;", createdAt: new Date() }
];

const DatabaseManager: React.FC = () => {
  // State
  const [activeTab, setActiveTab] = useState<TabOption>(TabOption.SQL);
  const [tables, setTables] = useState<DatabaseTable[]>(MOCK_TABLES);
  const [folders, setFolders] = useState<Folder[]>(MOCK_FOLDERS);
  const [selectedTableId, setSelectedTableId] = useState<string | undefined>();
  const [sqlCode, setSqlCode] = useState<string>('SELECT * FROM users LIMIT 10;');
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

      if (tableName === 'users') {
          columns = ['id', 'username', 'email', 'status'];
          mockData = Array.from({length: 20}).map((_, i) => ({
             id: i + 1, username: `user_${i+1}`, email: `user${i+1}@example.com`, status: i % 3 === 0 ? 'inactive' : 'active'
          }));
      } else if (tableName === 'orders') {
          columns = ['id', 'user_id', 'total_amount', 'status'];
          mockData = Array.from({length: 20}).map((_, i) => ({
             id: 1000 + i, user_id: (i % 5) + 1, total_amount: (Math.random() * 100).toFixed(2), status: 'completed'
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
        columns: ['id', 'username', 'email', 'status'],
        data: [
          { id: 1, username: 'john_doe', email: 'john@example.com', status: 'active' },
          { id: 2, username: 'jane_smith', email: 'jane@example.com', status: 'inactive' },
          { id: 3, username: 'bob_wilson', email: 'bob@tech.com', status: 'active' },
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
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden font-sans text-slate-800" ref={containerRef}>
      
      {/* Left Sidebar (Resizable) */}
      <Sidebar 
        tables={tables}
        folders={folders}
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
                <ERDiagram 
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onDrop={onDropTableToERD}
                    onDeleteNode={onDeleteNode}
                />
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
                schema={tables}
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

    </div>
  );
};

export default DatabaseManager;