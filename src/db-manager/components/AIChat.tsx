
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, DatabaseTable } from '../../types';
import { Send, Bot, User, Sparkles, ArrowLeftToLine, Database, Wand2, Network, ChevronDown, AlignLeft, Layers, PenTool, MessageSquarePlus, FileQuestion, PanelRightClose } from 'lucide-react';
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
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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
      
      // Parse for special JSON blocks after stream completes
      // 1. Metadata enrichment
      const metadataMatch = fullText.match(/```json:metadata\s*([\s\S]*?)\s*```/);
      if (metadataMatch) {
          try {
              const metadata = JSON.parse(metadataMatch[1]);
              onUpdateSchemaMetadata(metadata);
          } catch (e) {
              console.error("Failed to parse metadata JSON", e);
          }
      }

      // 2. ERD Generation
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

  // Feature Actions
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

  // Helper to extract code blocks
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
      <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between flex-shrink-0">
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

      {/* Messages */}
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

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-3 pt-2 flex-shrink-0">
        {/* Features Dropdown Toolbar */}
        <div className="flex items-center gap-2 mb-2 relative">
            <button 
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-md transition-colors"
            >
                <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
                <span>AI 功能助手</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>
            
            {/* Dropdown Menu */}
            {showMenu && (
                <div 
                    ref={menuRef}
                    className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                    <div className="px-3 py-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        智能操作
                    </div>
                    <button onClick={() => handleFeatureSelect('create_module')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                        <Layers className="w-3.5 h-3.5" /> 自动创建模块 (含多表)
                    </button>
                    <button onClick={() => handleFeatureSelect('add_cn_meta')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                        <PenTool className="w-3.5 h-3.5" /> 完善当前表中文备注
                    </button>
                    <button onClick={() => handleFeatureSelect('erd_gen')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                        <Network className="w-3.5 h-3.5" /> ER 图生成和修改
                    </button>
                    <button onClick={() => handleFeatureSelect('ask_sql')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                        <FileQuestion className="w-3.5 h-3.5" /> 选中 SQL 进行提问
                    </button>
                    <button onClick={() => handleFeatureSelect('text_to_sql')} className="w-full text-left px-3 py-2 text-xs text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 flex items-center gap-2">
                        <MessageSquarePlus className="w-3.5 h-3.5" /> 自动整成 SQL 语句
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
    </div>
  );
};

export default AIChat;
