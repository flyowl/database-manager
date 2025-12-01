
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, DatabaseTable } from '../../types';
import { 
    Send, Bot, User, Sparkles, ArrowLeftToLine, Network, ChevronDown, 
    Layers, PenTool, MessageSquarePlus, FileQuestion, PanelRightClose,
    Settings, MessageSquare, RefreshCw, ArrowLeftRight, Cloud, CheckCircle, AlertTriangle, ShieldAlert,
    Wand2
} from 'lucide-react';
import { generateAIResponseStream } from '../../services/aiService';

interface AIChatProps {
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  schema: DatabaseTable[];
  onApplyCode: (code: string) => void;
  onUpdateSchemaMetadata: (metadata: any) => void;
  onGenerateERD: (tableIds: string[]) => void;
  selectedTableId?: string;
  onGetSqlSelection?: () => string;
  currentSql?: string;
  onClose?: () => void;
}

const AIChat: React.FC<AIChatProps> = ({ 
  messages, 
  setMessages, 
  schema, 
  onApplyCode,
  onUpdateSchemaMetadata,
  onGenerateERD,
  selectedTableId,
  onGetSqlSelection,
  currentSql,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'settings'>('chat');
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  
  // Settings & Sync State
  const [syncStatus, setSyncStatus] = useState<'idle' | 'checking' | 'conflict' | 'synced'>('idle');
  const [syncDirection, setSyncDirection] = useState<'cloud_to_local' | 'local_to_cloud'>('local_to_cloud');
  const [conflicts, setConflicts] = useState<any[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeTab === 'chat' && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsProcessing(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'model',
      content: '',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, aiMsg]);

    let fullText = '';

    try {
      const stream = generateAIResponseStream(messages, textToSend, schema);
      
      for await (const chunk of stream) {
        fullText += chunk;
        setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: fullText } : msg
        ));
      }
      
      // Parse for special JSON blocks
      const metadataMatch = fullText.match(/```json:metadata\s*([\s\S]*?)\s*```/);
      if (metadataMatch) {
          try {
              const metadata = JSON.parse(metadataMatch[1]);
              onUpdateSchemaMetadata(metadata);
          } catch (e) {
              console.error("Failed to parse metadata JSON", e);
          }
      }

      const erdMatch = fullText.match(/```json:erd\s*([\s\S]*?)\s*```/);
      if (erdMatch) {
          try {
              const erdData = JSON.parse(erdMatch[1]);
              if (erdData.nodes && Array.isArray(erdData.nodes)) {
                  onGenerateERD(erdData.nodes);
              }
          } catch (e) {
              console.error("Failed to parse ERD JSON", e);
          }
      }

    } catch (err) {
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, content: msg.content + "\n[系统错误：请求失败]" } : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFeatureSelect = (action: string) => {
      setShowMenu(false);
      switch (action) {
          case 'create_module':
              setInput("帮我设计一个[模块名称]模块，包含必要的表结构...");
              inputRef.current?.focus();
              break;
          case 'add_cn_meta':
              if (selectedTableId) {
                  const table = schema.find(t => t.id === selectedTableId);
                  if (table) {
                      handleSend(`请为表 "${table.name}" 及其字段自动添加中文名称和详细备注说明。`);
                  }
              } else {
                  setInput("请为当前所有表添加中文名称和备注...");
                  inputRef.current?.focus();
              }
              break;
          case 'erd_gen':
              handleSend("请基于当前数据库表结构，生成一份完整的 ER 图。");
              break;
          case 'ask_sql':
              const selection = onGetSqlSelection ? onGetSqlSelection() : '';
              if (selection) {
                  handleSend(`请解释以下 SQL 代码的含义，并分析是否存在潜在性能问题：\n\`\`\`sql\n${selection}\n\`\`\``);
              } else if (currentSql && currentSql.trim().length > 0) {
                  handleSend(`请解释当前编辑器中的 SQL 代码含义，并给出优化建议：\n\`\`\`sql\n${currentSql}\n\`\`\``);
              } else {
                  setInput("请解释这段 SQL: \n");
                  inputRef.current?.focus();
              }
              break;
          case 'text_to_sql':
              setInput("请将以下业务需求转换为高效的 SQL 查询语句：\n");
              inputRef.current?.focus();
              break;
      }
  };

  // Sync Features
  const checkSync = () => {
      setSyncStatus('checking');
      setTimeout(() => {
          // Mock conflict
          setConflicts([
              { table: 'users', field: 'phone', local: 'VARCHAR(20)', remote: 'VARCHAR(50)', type: 'Type Mismatch' },
              { table: 'orders', field: 'status', local: 'Missing', remote: 'INT DEFAULT 0', type: 'Field Missing' }
          ]);
          setSyncStatus('conflict');
      }, 1500);
  };

  const executeSync = () => {
      setSyncStatus('checking');
      setTimeout(() => {
          setConflicts([]);
          setSyncStatus('synced');
      }, 1500);
  };

  const renderMessageContent = (content: string) => {
    const parts = content.split(/(```sql\s*[\s\S]*?\s*```)/g);
    return (
      <div className="space-y-2">
        {parts.map((part, index) => {
          const sqlMatch = part.match(/```sql\s*([\s\S]*?)\s*```/);
          if (sqlMatch) {
            const code = sqlMatch[1];
            return (
              <div key={index} className="bg-slate-900 rounded-md overflow-hidden my-2 border border-slate-700 shadow-sm">
                <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800 border-b border-slate-700">
                  <span className="text-[10px] uppercase text-slate-400 font-bold">SQL</span>
                  <button 
                    onClick={() => onApplyCode(code)}
                    className="flex items-center gap-1 text-[10px] text-blue-300 hover:text-white transition-colors"
                  >
                    <ArrowLeftToLine className="w-3 h-3" /> 插入编辑器
                  </button>
                </div>
                <pre className="p-3 text-xs font-mono text-green-300 overflow-x-auto">
                  {code}
                </pre>
              </div>
            );
          } else {
             const cleanPart = part
                .replace(/```json:metadata[\s\S]*?```/g, '✅ 已自动更新表元数据。')
                .replace(/```json:erd[\s\S]*?```/g, '✅ 已生成 ER 图结构。');
             return cleanPart.trim() ? <p key={index} className="whitespace-pre-wrap">{cleanPart}</p> : null;
          }
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 shadow-xl z-20">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col gap-3 flex-shrink-0">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-sm">
                <Sparkles className="w-4 h-4" />
            </div>
            <div>
                <h2 className="font-bold text-slate-800 text-sm">AI 助手</h2>
                <p className="text-[10px] text-slate-500">Gemini 2.5 驱动</p>
            </div>
            </div>
            {onClose && (
                <button 
                    onClick={onClose}
                    className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1 rounded-md transition-colors"
                    title="隐藏助手"
                >
                    <PanelRightClose className="w-4 h-4" />
                </button>
            )}
        </div>
        
        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 rounded-lg">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'chat' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <MessageSquare className="w-3.5 h-3.5" /> 对话
            </button>
            <button 
                onClick={() => setActiveTab('settings')}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-md transition-all ${activeTab === 'settings' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Settings className="w-3.5 h-3.5" /> 设置与同步
            </button>
        </div>
      </div>

      {activeTab === 'chat' ? (
        <>
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50" ref={scrollRef}>
                {messages.length === 0 && (
                <div className="text-center mt-6 p-4">
                    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-slate-100">
                    <Bot className="w-6 h-6 text-indigo-500" />
                    </div>
                    <h3 className="text-sm font-medium text-slate-700">有什么可以帮您？</h3>
                    <div className="mt-4 grid grid-cols-1 gap-2">
                        <button onClick={() => handleFeatureSelect('add_cn_meta')} className="text-xs p-2 bg-white border border-slate-200 rounded hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all text-left flex items-center gap-2">
                            <Wand2 className="w-3.5 h-3.5 text-purple-500" /> 完善中文备注
                        </button>
                        <button onClick={() => handleFeatureSelect('erd_gen')} className="text-xs p-2 bg-white border border-slate-200 rounded hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-600 transition-all text-left flex items-center gap-2">
                            <Network className="w-3.5 h-3.5 text-blue-500" /> 智能生成 ER 图
                        </button>
                    </div>
                </div>
                )}
                
                {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm
                    ${msg.role === 'user' ? 'bg-white border border-slate-200' : 'bg-indigo-600 text-white'}
                    `}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600" /> : <Bot className="w-4 h-4" />}
                    </div>
                    <div className={`
                    max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm
                    ${msg.role === 'user' 
                        ? 'bg-white border border-slate-200 text-slate-700 rounded-tr-none' 
                        : 'bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-tl-none'}
                    `}>
                    {renderMessageContent(msg.content)}
                    </div>
                </div>
                ))}
                {isProcessing && messages[messages.length - 1].role === 'user' && (
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                    </div>
                    </div>
                </div>
                )}
            </div>

            {/* Chat Input */}
            <div className="bg-white border-t border-slate-200 p-3 pt-2 flex-shrink-0">
                <div className="flex items-center gap-2 mb-2 relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)}
                        className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition-colors"
                    >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                        <span>AI 功能助手</span>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>
                    
                    {showMenu && (
                        <div 
                            ref={menuRef}
                            className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                        >
                            <div className="px-3 py-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                智能操作
                            </div>
                            <button onClick={() => handleFeatureSelect('create_module')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                                <Layers className="w-3.5 h-3.5" /> 自动创建模块
                            </button>
                            <button onClick={() => handleFeatureSelect('add_cn_meta')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                                <PenTool className="w-3.5 h-3.5" /> 完善中文备注
                            </button>
                            <button onClick={() => handleFeatureSelect('erd_gen')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                                <Network className="w-3.5 h-3.5" /> ER 图生成
                            </button>
                            <button onClick={() => handleFeatureSelect('ask_sql')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                                <FileQuestion className="w-3.5 h-3.5" /> SQL 解释与优化
                            </button>
                            <button onClick={() => handleFeatureSelect('text_to_sql')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                                <MessageSquarePlus className="w-3.5 h-3.5" /> 需求转 SQL
                            </button>
                        </div>
                    )}
                    
                    {selectedTableId && (
                        <span className="text-[10px] text-slate-400 border border-slate-100 rounded px-1.5 py-0.5 bg-slate-50 truncate max-w-[120px]">
                            {schema.find(t => t.id === selectedTableId)?.name}
                        </span>
                    )}
                </div>

                <div className="relative">
                <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="输入需求，AI 将自动生成代码..."
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm resize-none h-[42px] max-h-32 leading-tight"
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isProcessing}
                    className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                    <Send className="w-3.5 h-3.5" />
                </button>
                </div>
            </div>
        </>
      ) : (
        /* Settings Tab */
        <div className="flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-6">
            
            {/* Sync Card */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                        <RefreshCw className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">结构同步中心</h3>
                </div>

                <div className="flex items-center justify-between gap-4 mb-6 px-2">
                    <div className="flex flex-col items-center gap-2">
                         <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                             <Settings className="w-5 h-5 text-slate-500" />
                         </div>
                         <span className="text-xs font-medium text-slate-600">本地环境</span>
                    </div>
                    
                    <div className="flex-1 flex flex-col items-center">
                        <div className="relative w-full h-[2px] bg-slate-200 my-2">
                             <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-slate-400`}>
                                 <ArrowLeftRight className="w-4 h-4" />
                             </div>
                        </div>
                        <div className="relative mt-2">
                             <select 
                                value={syncDirection}
                                onChange={(e) => setSyncDirection(e.target.value as any)}
                                className="appearance-none bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium py-1 pl-2 pr-6 rounded cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-100"
                             >
                                 <option value="local_to_cloud">本地 ➔ 线上</option>
                                 <option value="cloud_to_local">线上 ➔ 本地</option>
                             </select>
                             <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-blue-500 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                         <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                             <Cloud className="w-5 h-5 text-indigo-500" />
                         </div>
                         <span className="text-xs font-medium text-slate-600">线上生产</span>
                    </div>
                </div>

                {syncStatus === 'conflict' && (
                    <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-amber-800 text-xs font-bold mb-2">
                            <AlertTriangle className="w-4 h-4" />
                            检测到结构冲突 ({conflicts.length})
                        </div>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                            {conflicts.map((c, i) => (
                                <div key={i} className="text-[10px] bg-white border border-amber-100 p-2 rounded text-slate-600 flex justify-between items-center">
                                    <div>
                                        <span className="font-bold">{c.table}.{c.field}</span>
                                        <div className="text-amber-600 mt-0.5">{c.type}: {c.local} vs {c.remote}</div>
                                    </div>
                                    <button className="text-blue-600 hover:underline">处理</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {syncStatus === 'synced' && (
                    <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2 text-green-700 text-xs font-bold">
                        <CheckCircle className="w-4 h-4" />
                        同步完成，所有结构一致。
                    </div>
                )}

                <button 
                    onClick={syncStatus === 'conflict' ? executeSync : checkSync}
                    disabled={syncStatus === 'checking'}
                    className={`w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all ${
                        syncStatus === 'conflict' 
                        ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                >
                    {syncStatus === 'checking' ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        syncStatus === 'conflict' ? '解决冲突并强制同步' : '检查并开始同步'
                    )}
                </button>
            </div>

            {/* AI Preferences */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                     <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg">
                        <Sparkles className="w-4 h-4" />
                    </div>
                    <h3 className="font-bold text-slate-800 text-sm">AI 偏好设置</h3>
                </div>

                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-xs font-medium text-slate-700">自动生成注释</div>
                            <div className="text-[10px] text-slate-400">新建字段时自动填充中文名</div>
                        </div>
                        <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" name="toggle" id="toggle1" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer border-blue-600 right-0"/>
                            <label htmlFor="toggle1" className="toggle-label block overflow-hidden h-4 rounded-full bg-blue-600 cursor-pointer"></label>
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                         <div>
                            <div className="text-xs font-medium text-slate-700">SQL 方言</div>
                            <div className="text-[10px] text-slate-400">默认生成的 SQL 语法</div>
                        </div>
                        <div className="relative">
                            <select className="appearance-none bg-slate-50 border border-slate-200 text-slate-600 text-xs py-1 pl-2 pr-6 rounded cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-200">
                                <option>PostgreSQL</option>
                                <option>MySQL</option>
                                <option>SQL Server</option>
                            </select>
                            <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400 pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-xs font-medium text-slate-700">安全模式</div>
                            <div className="text-[10px] text-slate-400">禁止生成 DROP/TRUNCATE 语句</div>
                        </div>
                        <div className="text-green-600 text-xs flex items-center gap-1 font-bold">
                            <ShieldAlert className="w-3 h-3" /> 已开启
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
