
import React, { useState, useRef, useEffect } from 'react';
import { Send, Plus, MessageSquare, Trash2, Bot, User, Sparkles, Search, MoreHorizontal, Edit2, Copy, Database, Layers, Check, X, ChevronRight, ChevronDown, Table as TableIcon } from 'lucide-react';
import { ChatMessage, DatabaseModule } from '../types';
import { generateAIResponseStream } from '../services/aiService';
import { MOCK_TABLES, MOCK_MODULES, MOCK_DATA_SOURCES } from '../data/mockData';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { SmartChartWidget } from '../components/chart/SmartChartWidget';

interface Session {
  id: string;
  title: string;
  date: Date;
  messages: ChatMessage[];
}

const MOCK_SESSIONS: Session[] = [
    {
        id: '1',
        title: '服务器资源分析',
        date: new Date(),
        messages: [
            { id: '1', role: 'user', content: '分析一下过去 24 小时的服务器 CPU 负载趋势', timestamp: new Date() },
            { id: '2', role: 'model', content: '好的，根据监控数据，web-prod 服务器组在下午 14:00-16:00 出现负载高峰。\n\n```json:chart\n{\n  "type": "line",\n  "title": "CPU 负载趋势 (Web Cluster)",\n  "xAxisKey": "time",\n  "data": [\n    { "time": "08:00", "web01": 25, "web02": 22 },\n    { "time": "10:00", "web01": 45, "web02": 40 },\n    { "time": "12:00", "web01": 55, "web02": 52 },\n    { "time": "14:00", "web01": 85, "web02": 80 },\n    { "time": "16:00", "web01": 70, "web02": 68 },\n    { "time": "18:00", "web01": 40, "web02": 38 }\n  ],\n  "sql": "SELECT time_bucket(\'2 hours\', time) as time, avg(cpu) FROM metrics WHERE host LIKE \'web%\' GROUP BY 1",\n  "series": [\n    { "dataKey": "web01", "name": "web-01 CPU%", "color": "#6366f1" },\n    { "dataKey": "web02", "name": "web-02 CPU%", "color": "#10b981" }\n  ]\n}\n```', timestamp: new Date() }
        ]
    }
];

// --- Context Modal Component ---
interface ContextModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedModules: Set<string>;
    onConfirm: (ids: Set<string>) => void;
}

const ContextModal: React.FC<ContextModalProps> = ({ isOpen, onClose, selectedModules, onConfirm }) => {
    const [tempSelected, setTempSelected] = useState<Set<string>>(new Set(selectedModules));
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

    useEffect(() => {
        if(isOpen) setTempSelected(new Set(selectedModules));
    }, [isOpen, selectedModules]);

    if (!isOpen) return null;

    const toggleModule = (id: string) => {
        const newSet = new Set(tempSelected);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setTempSelected(newSet);
    };

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedModules);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedModules(newSet);
    };

    const handleConfirm = () => {
        onConfirm(tempSelected);
        onClose();
    };

    // Group tables by module for display
    const getModuleTables = (module: DatabaseModule) => {
        return MOCK_TABLES.filter(t => module.tableIds.includes(t.id));
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[600px] h-[500px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Database className="w-5 h-5 text-indigo-600" />
                        选择对话上下文 (Context)
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700 mb-2">
                        💡 选择相关的业务模块，AI 将仅基于选中的表结构回答问题，以提高准确率。
                    </div>

                    {/* Mock Tree Structure: Data Source -> Modules -> Tables */}
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                        {MOCK_DATA_SOURCES.filter(ds => ds.isDefault).map(ds => (
                            <div key={ds.id} className="bg-slate-50/50">
                                <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 font-bold text-slate-700 text-xs flex items-center gap-2">
                                    <Database className="w-3.5 h-3.5 text-blue-500" />
                                    {ds.name} (Primary)
                                </div>
                                
                                <div className="divide-y divide-slate-100 bg-white">
                                    {MOCK_MODULES.map(mod => {
                                        const isSelected = tempSelected.has(mod.id);
                                        const isExpanded = expandedModules.has(mod.id);
                                        const tables = getModuleTables(mod);

                                        return (
                                            <div key={mod.id} className="flex flex-col">
                                                <div 
                                                    className={`flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/30' : ''}`}
                                                    onClick={() => toggleExpand(mod.id)}
                                                >
                                                    <div 
                                                        className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors ${isSelected ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}
                                                        onClick={(e) => { e.stopPropagation(); toggleModule(mod.id); }}
                                                    >
                                                        {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
                                                    </div>
                                                    
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <Layers className="w-4 h-4 text-slate-500" />
                                                            <span className="font-medium text-sm text-slate-700">{mod.name}</span>
                                                        </div>
                                                        <div className="text-xs text-slate-400 mt-0.5 ml-6">{mod.description}</div>
                                                    </div>

                                                    <button className="text-slate-400">
                                                        {isExpanded ? <ChevronDown className="w-4 h-4"/> : <ChevronRight className="w-4 h-4"/>}
                                                    </button>
                                                </div>

                                                {/* Tables List */}
                                                {isExpanded && (
                                                    <div className="px-4 pb-3 pt-1 pl-12 bg-slate-50/50 space-y-1 border-t border-slate-50 border-b">
                                                        {tables.map(table => (
                                                            <div key={table.id} className="flex items-center gap-2 text-xs text-slate-600 py-1">
                                                                <TableIcon className="w-3 h-3 text-slate-400" />
                                                                <span className="font-mono">{table.name}</span>
                                                                {table.cnName && <span className="text-slate-400">({table.cnName})</span>}
                                                            </div>
                                                        ))}
                                                        {tables.length === 0 && <span className="text-xs text-slate-400 italic">空模块</span>}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                    <span className="text-xs text-slate-500">已选 {tempSelected.size} 个模块</span>
                    <div className="flex gap-2">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleConfirm}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            确认应用
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SmartQuery: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>(MOCK_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>(MOCK_SESSIONS[0].id);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Context State
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [selectedModuleIds, setSelectedModuleIds] = useState<Set<string>>(new Set());

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [activeSession?.messages, activeSessionId]);

  const handleNewChat = () => {
      const newSession: Session = {
          id: Date.now().toString(),
          title: '新对话',
          date: new Date(),
          messages: []
      };
      setSessions([newSession, ...sessions]);
      setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      const newSessions = sessions.filter(s => s.id !== id);
      setSessions(newSessions);
      if (activeSessionId === id && newSessions.length > 0) {
          setActiveSessionId(newSessions[0].id);
      } else if (newSessions.length === 0) {
          handleNewChat();
      }
  };

  const getActiveSchema = () => {
      // If no modules selected, return ALL tables (Default behavior)
      if (selectedModuleIds.size === 0) return MOCK_TABLES;

      // Collect all table IDs from selected modules
      const activeTableIds = new Set<string>();
      MOCK_MODULES.forEach(mod => {
          if (selectedModuleIds.has(mod.id)) {
              mod.tableIds.forEach(id => activeTableIds.add(id));
          }
      });

      // Filter global tables based on active IDs
      return MOCK_TABLES.filter(t => activeTableIds.has(t.id));
  };

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    const updatedMessages = [...activeSession.messages, userMsg];
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: updatedMessages } : s));
    setInput('');
    setIsProcessing(true);

    const aiMsgId = (Date.now() + 1).toString();
    const aiMsg: ChatMessage = {
      id: aiMsgId,
      role: 'model',
      content: '',
      timestamp: new Date()
    };
    
    let currentMessages = [...updatedMessages, aiMsg];
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: currentMessages } : s));

    try {
        // Use filtered schema based on context
        const contextSchema = getActiveSchema();
        const stream = generateAIResponseStream(updatedMessages, userMsg.content, contextSchema);
        let fullText = '';
        
        for await (const chunk of stream) {
            fullText += chunk;
            currentMessages = currentMessages.map(msg => 
                msg.id === aiMsgId ? { ...msg, content: fullText } : msg
            );
            
            setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
                ...s, 
                messages: currentMessages,
                title: (s.messages.length === 0 || s.title === '新对话') ? userMsg.content.slice(0, 15) + (userMsg.content.length > 15 ? '...' : '') : s.title
            } : s));
        }

    } catch (err) {
        console.error("AI Error", err);
        setSessions(prev => prev.map(s => s.id === activeSessionId ? { 
            ...s, 
            messages: currentMessages.map(m => m.id === aiMsgId ? { ...m, content: "抱歉，发生了错误。" } : m) 
        } : s));
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

  // --- Copy Function ---
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // --- Markdown Components Config ---
  const MarkdownComponents = {
      // IMPORTANT: Override 'pre' to remove the outer <pre> wrapper that react-markdown adds.
      // This ensures SmartChartWidget and our custom code block (which has its own pre) render correctly in the flow.
      pre: ({ children }: any) => <>{children}</>,
      
      code({ node, inline, className, children, ...props }: any) {
          const match = /language-(\w+)(:(\w+))?/.exec(className || '');
          const lang = match ? match[1] : '';
          const isJson = lang === 'json' || className?.includes('json');
          
          // Pre-processing to remove JS style comments // which might come from copy-paste or lax AI
          const rawContent = String(children).replace(/\n$/, '');
          const cleanContent = rawContent.replace(/\s*\/\/.*$/gm, '');

          const isChartData = !inline && isJson && 
              cleanContent.includes('"type":') && 
              (cleanContent.includes('"xAxisKey"') || cleanContent.includes('"data":'));

          if (isChartData) {
              try {
                   const chartConfig = JSON.parse(cleanContent);
                   // Verify key properties to ensure it's a chart config and not just any JSON
                   if (chartConfig.type && chartConfig.data && Array.isArray(chartConfig.data)) {
                       return <SmartChartWidget config={chartConfig} />;
                   }
              } catch (e) {
                  // If parse fails (e.g. valid JSON syntax error), fall back to standard code block
                  // console.warn("Failed to parse potential chart JSON:", e);
              }
          }

          if (!inline && match) {
              return (
                  <div className="relative my-3 rounded-lg overflow-hidden border border-slate-200 group/code">
                      <div className="bg-slate-50 px-3 py-1.5 text-xs text-slate-500 border-b border-slate-200 flex justify-between items-center select-none">
                          <span className="font-mono font-bold uppercase">{lang}</span>
                          <button 
                             onClick={() => copyToClipboard(String(children))}
                             className="text-slate-400 hover:text-blue-600 transition-colors flex items-center gap-1"
                          >
                              <Copy className="w-3 h-3" /> <span className="text-[10px]">复制</span>
                          </button>
                      </div>
                      <pre className="bg-[#1e1e1e] text-[#d4d4d4] p-3 text-xs overflow-x-auto font-mono leading-relaxed" {...props}>
                          {rawContent}
                      </pre>
                  </div>
              );
          }

          return <code className="bg-slate-100 px-1.5 py-0.5 rounded text-indigo-600 font-mono text-[0.9em]" {...props}>{children}</code>;
      },
      table({ children }: any) {
          return <div className="overflow-x-auto my-3 border border-slate-200 rounded-lg"><table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table></div>;
      },
      thead({ children }: any) {
          return <thead className="bg-slate-50">{children}</thead>;
      },
      th({ children }: any) {
          return <th className="px-4 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{children}</th>;
      },
      td({ children }: any) {
          return <td className="px-4 py-2 whitespace-nowrap text-slate-700 border-t border-slate-100">{children}</td>;
      },
      p({ children }: any) {
          return <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>;
      },
      ul({ children }: any) {
          return <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>;
      },
      ol({ children }: any) {
          return <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>;
      },
      blockquote({ children }: any) {
          return <blockquote className="border-l-4 border-indigo-200 pl-4 py-1 my-2 text-slate-500 italic bg-indigo-50/30 rounded-r">{children}</blockquote>;
      }
  };

  return (
    <div className="flex w-full h-full bg-slate-50 overflow-hidden">
      {/* Sidebar: History */}
      <div className="w-72 bg-slate-50 border-r border-slate-200 flex flex-col flex-shrink-0">
          <div className="p-4">
              <button 
                onClick={handleNewChat}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg shadow-sm shadow-indigo-200 transition-all font-medium text-sm"
              >
                  <Plus className="w-4 h-4" /> 新建对话
              </button>
          </div>

          <div className="px-4 pb-2">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="搜索历史记录..." 
                    className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all" 
                  />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 mb-2 mt-2">最近对话</h4>
              {sessions.map(session => (
                  <div 
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border border-transparent ${
                        activeSessionId === session.id 
                        ? 'bg-white border-slate-200 shadow-sm' 
                        : 'hover:bg-slate-200/50'
                    }`}
                  >
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${activeSessionId === session.id ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-500'}`}>
                          <MessageSquare className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                          <div className={`text-sm truncate ${activeSessionId === session.id ? 'font-bold text-slate-800' : 'font-medium text-slate-600'}`}>
                              {session.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">
                              {session.messages.length > 0 ? session.messages[session.messages.length - 1].content.slice(0, 30) : '暂无消息'}
                          </div>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteSession(e, session.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all"
                      >
                          <Trash2 className="w-3.5 h-3.5" />
                      </button>
                  </div>
              ))}
          </div>
          
          <div className="p-4 border-t border-slate-200 bg-slate-100/50">
              <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors group">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                      A
                  </div>
                  <div className="flex-1">
                      <div className="text-xs font-bold text-slate-700">Admin User</div>
                      <div className="text-[10px] text-slate-500">Pro Plan</div>
                  </div>
                  <MoreHorizontal className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </div>
          </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative">
          
          {/* Header */}
          <div className="h-16 border-b border-slate-100 flex items-center justify-between px-6 bg-white z-10 flex-shrink-0">
              <div>
                  <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                      {activeSession.title}
                      <button className="text-slate-400 hover:text-indigo-600 transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                      </button>
                  </h2>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>Gemini 2.5 Flash</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                      <span>{activeSession.messages.length} 条消息</span>
                  </div>
              </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-0 scroll-smooth" ref={scrollRef}>
              <div className="max-w-4xl mx-auto p-6 space-y-6">
                {activeSession.messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center opacity-50 pb-20 pt-20">
                        <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6">
                            <Sparkles className="w-10 h-10 text-indigo-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-2">我是您的智能运维助手</h3>
                        <p className="text-slate-500 max-w-md text-center">
                            您可以询问关于服务器资产、监控告警、部署记录的问题。
                        </p>
                        <div className="grid grid-cols-2 gap-3 mt-8 max-w-2xl w-full">
                            {['查询 CPU 负载高的服务器', '统计本周的部署失败次数', '生成清理日志的脚本', '解释 K8s Pod 异常原因'].map((hint, i) => (
                                <button 
                                  key={i}
                                  onClick={() => setInput(hint)}
                                  className="p-3 bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 rounded-xl text-sm text-slate-600 transition-all text-left"
                                >
                                    {hint}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    activeSession.messages.map((msg) => (
                        <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''} group`}>
                            <div className={`
                              w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm
                              ${msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-gradient-to-br from-indigo-500 to-blue-600 text-white'}
                            `}>
                                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                            </div>
                            
                            <div className={`max-w-[85%] space-y-1`}>
                                <div className={`flex items-center gap-2 text-xs text-slate-400 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    <span className="font-bold">{msg.role === 'user' ? 'You' : 'Ops Genie'}</span>
                                    <span>{msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                </div>
                                <div className={`
                                  p-4 rounded-2xl shadow-sm text-sm
                                  ${msg.role === 'user' 
                                      ? 'bg-slate-100 text-slate-800 rounded-tr-sm' 
                                      : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}
                                `}>
                                    {msg.role === 'user' ? (
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    ) : (
                                        <ReactMarkdown 
                                            remarkPlugins={[remarkGfm]}
                                            components={MarkdownComponents}
                                        >
                                            {msg.content}
                                        </ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {isProcessing && (
                    <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-4 flex items-center gap-1.5 shadow-sm h-12">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                        </div>
                    </div>
                )}
              </div>
          </div>

          {/* Input Area */}
          <div className="p-6 bg-white pt-2 border-t border-slate-50 flex-shrink-0">
              <div className="max-w-4xl mx-auto">
                  <div className="relative shadow-lg rounded-2xl bg-white border border-slate-200 focus-within:ring-2 focus-within:ring-indigo-100 focus-within:border-indigo-400 transition-all">
                      
                      {/* Context Selection - Top Left */}
                      <div className="absolute top-2 left-2 z-10">
                          <button
                              onClick={() => setIsContextModalOpen(true)}
                              className={`
                                  flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                                  ${selectedModuleIds.size > 0 
                                      ? 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100' 
                                      : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100 hover:text-slate-700'}
                              `}
                          >
                              <Database className="w-3.5 h-3.5" />
                              <span>
                                  {selectedModuleIds.size > 0 
                                      ? `已关联 ${selectedModuleIds.size} 个业务模块` 
                                      : '配置数据上下文'}
                              </span>
                              {selectedModuleIds.size > 0 ? (
                                   <ChevronDown className="w-3 h-3 opacity-50" />
                              ) : (
                                   <Plus className="w-3 h-3 opacity-50" />
                              )}
                          </button>
                      </div>

                      <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={selectedModuleIds.size > 0 ? "基于选定的业务模块提问..." : "输入您的问题 (例如: 统计本月告警数量)..."}
                        className="w-full pl-4 pr-14 pb-4 pt-12 bg-transparent border-none focus:ring-0 text-slate-700 resize-none max-h-40 min-h-[100px]"
                        rows={1}
                      />
                      <div className="absolute right-2 bottom-2">
                          <button 
                            onClick={handleSend}
                            disabled={!input.trim() || isProcessing}
                            className={`p-2.5 rounded-xl transition-all ${
                                input.trim() && !isProcessing
                                ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:scale-105'
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                              <Send className="w-5 h-5" />
                          </button>
                      </div>
                  </div>
                  <p className="text-center text-[10px] text-slate-400 mt-2">
                      AI 生成的内容可能不准确，请在执行重要操作前核实。
                  </p>
              </div>
          </div>
      </div>

      <ContextModal 
          isOpen={isContextModalOpen}
          onClose={() => setIsContextModalOpen(false)}
          selectedModules={selectedModuleIds}
          onConfirm={setSelectedModuleIds}
      />
    </div>
  );
};

export default SmartQuery;
