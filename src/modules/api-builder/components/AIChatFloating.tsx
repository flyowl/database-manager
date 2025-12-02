
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles, Copy, Check, Code2, Database, Terminal, ChevronDown, Layers, FileJson, ArrowRight } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DatabaseTable, ChatMessage } from '../../../types';
import ReactMarkdown from 'react-markdown';

export type GenerationMode = 'SQL' | 'FUNCTION' | 'API_BATCH';

interface AIChatFloatingProps {
  schema?: DatabaseTable[];
  onApplyCode?: (code: string) => void; // For SQL/Function mode
  onBatchCreate?: (data: { folders: any[], apis: any[] }) => void; // For Batch mode
  mode: GenerationMode; // Initial mode
  selectedContext?: string;
}

const AIChatFloating: React.FC<AIChatFloatingProps> = ({ schema = [], onApplyCode, onBatchCreate, mode: initialMode, selectedContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMode, setCurrentMode] = useState<GenerationMode>(initialMode);
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);
  
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use env key
  const API_KEY = (typeof process !== 'undefined' && process.env && process.env.API_KEY) ? process.env.API_KEY : '';
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
              setIsModeDropdownOpen(false);
          }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
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

    try {
        let systemInstruction = "";
        let prompt = "";

        if (currentMode === 'SQL') {
            const schemaContext = schema.map(t => 
                `- Table: ${t.name} ${t.cnName ? `(${t.cnName})` : ''}\n  Columns: ${t.columns.map(c => `${c.name} (${c.type})`).join(', ')}`
            ).join('\n');

            systemInstruction = `你是一位精通 SQL 的数据库专家。
目标：根据需求生成可直接执行的 SQL。
规则：
1. 优先生成标准 SQL。
2. 参数使用 #{paramName} 格式。
3. 只输出 SQL 代码块 (markdown)。`;

            prompt = `
[数据库表结构]
${schemaContext}
${selectedContext ? `[选中的代码]\n\`\`\`sql\n${selectedContext}\n\`\`\`\n` : ''}
[需求]
${userMsg.content}`;

        } else if (currentMode === 'FUNCTION') {
            systemInstruction = `你是一位资深的 JavaScript/Node.js 全栈工程师。
目标：编写高效 JavaScript 函数。
规则：
1. 签名为 function run(context) { ... }。
2. 只输出 JS 代码块。`;

            prompt = `
${selectedContext ? `[选中的代码]\n\`\`\`javascript\n${selectedContext}\n\`\`\`\n` : ''}
[需求]
${userMsg.content}`;

        } else if (currentMode === 'API_BATCH') {
             const schemaContext = schema.map(t => 
                `- Table: ${t.name} (${t.description || ''})`
            ).join('\n');

            systemInstruction = `你是一位 API 架构师。
目标：根据用户需求，设计一套完整的 API 接口结构，包含目录和多个接口定义。
规则：
1. **必须**返回一个 JSON 代码块，格式为 \`\`\`json:batch ... \`\`\`。
2. JSON 结构如下：
   {
     "folders": [{ "name": "目录名", "type": "business" }],
     "apis": [
       { 
         "name": "接口名", 
         "path": "/api/v1/...", 
         "method": "GET|POST|PUT|DELETE", 
         "folderName": "所属目录名(必须与folders中一致)",
         "sql": "SELECT ...",
         "params": [{ "name": "id", "type": "Integer", "required": true, "sampleValue": "1" }]
       }
     ]
   }
3. SQL 语句应基于提供的表结构进行合理推断。
4. 除非用户指定，否则默认创建合理的目录分类。`;

            prompt = `
[可用表结构]
${schemaContext}

[需求]
${userMsg.content}
(请生成完整的目录结构和对应的 API 列表)`;
        }

        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { systemInstruction }
        });

        let fullText = '';
        for await (const chunk of response) {
            const text = chunk.text;
            if (text) {
                fullText += text;
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMsgId ? { ...msg, content: fullText } : msg
                ));
            }
        }
    } catch (error) {
        setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: "生成失败，请检查网络或 API Key 设置。" } : msg
        ));
    } finally {
        setIsProcessing(false);
    }
  };

  const extractCode = (content: string) => {
      if (currentMode === 'API_BATCH') return null; // Handled separately
      const langRegex = currentMode === 'SQL' ? /```sql\s*([\s\S]*?)\s*```/i : /```(javascript|js)\s*([\s\S]*?)\s*```/i;
      const match = content.match(langRegex);
      if (match) return match[1].trim(); 
      const genericMatch = content.match(/```\w*\s*([\s\S]*?)\s*```/);
      if (genericMatch) return genericMatch[1].trim();
      return null;
  };

  const parseBatchJson = (content: string) => {
      const match = content.match(/```json:batch\s*([\s\S]*?)\s*```/);
      if (match) {
          try {
              return JSON.parse(match[1]);
          } catch (e) {
              console.error("Failed to parse batch JSON", e);
          }
      }
      return null;
  };

  const getModeInfo = (m: GenerationMode) => {
      switch(m) {
          case 'SQL': return { label: 'SQL Copilot', icon: Database, color: 'text-blue-500', bg: 'bg-blue-600', grad: 'from-blue-600 to-indigo-700' };
          case 'FUNCTION': return { label: 'Logic Copilot', icon: Terminal, color: 'text-emerald-500', bg: 'bg-emerald-600', grad: 'from-emerald-500 to-teal-700' };
          case 'API_BATCH': return { label: 'Batch Generator', icon: Layers, color: 'text-purple-500', bg: 'bg-purple-600', grad: 'from-purple-600 to-pink-700' };
      }
  };

  const activeInfo = getModeInfo(currentMode);

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-all z-50 group bg-gradient-to-br ${activeInfo.grad} shadow-lg`}
          >
              <Sparkles className="w-6 h-6 animate-pulse" />
              <div className="absolute right-full mr-3 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm font-medium">
                  打开 {activeInfo.label}
              </div>
          </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
          <div className="fixed bottom-6 right-6 w-[420px] h-[650px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden ring-1 ring-slate-900/5">
              {/* Header with Mode Switcher */}
              <div className={`px-4 py-3 flex justify-between items-center text-white shadow-sm bg-gradient-to-r ${activeInfo.grad}`}>
                  <div className="relative" ref={dropdownRef}>
                      <button 
                        onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                        className="flex items-center gap-2 hover:bg-white/20 px-2 py-1 rounded-lg transition-colors"
                      >
                          <activeInfo.icon className="w-5 h-5" />
                          <span className="font-bold text-sm tracking-wide">{activeInfo.label}</span>
                          <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                      </button>

                      {isModeDropdownOpen && (
                          <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 text-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">
                                  切换生成模式
                              </div>
                              <button onClick={() => { setCurrentMode('SQL'); setIsModeDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-blue-50 hover:text-blue-600 text-sm text-left">
                                  <Database className="w-4 h-4 text-blue-500" /> SQL Copilot
                              </button>
                              <button onClick={() => { setCurrentMode('FUNCTION'); setIsModeDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-emerald-50 hover:text-emerald-600 text-sm text-left">
                                  <Terminal className="w-4 h-4 text-emerald-500" /> Function Copilot
                              </button>
                              {onBatchCreate && (
                                  <button onClick={() => { setCurrentMode('API_BATCH'); setIsModeDropdownOpen(false); }} className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-purple-50 hover:text-purple-600 text-sm text-left">
                                      <Layers className="w-4 h-4 text-purple-500" /> Batch Generator
                                  </button>
                              )}
                          </div>
                      )}
                  </div>
                  <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                      <X className="w-4 h-4" />
                  </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50" ref={scrollRef}>
                  {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs px-8 text-center pb-10">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-white shadow-sm border border-slate-100`}>
                              <activeInfo.icon className={`w-6 h-6 ${activeInfo.color}`} />
                          </div>
                          <h3 className="text-sm font-bold text-slate-700 mb-2">
                              {currentMode === 'SQL' ? 'SQL 编写助手' : (currentMode === 'FUNCTION' ? '函数逻辑助手' : '批量接口生成器')}
                          </h3>
                          <p className="mb-4 leading-relaxed">
                              {currentMode === 'SQL' && '我可以帮您编写复杂查询、优化 SQL 性能或解释代码逻辑。'}
                              {currentMode === 'FUNCTION' && '我可以帮您编写数据处理逻辑、正则表达式或算法函数。'}
                              {currentMode === 'API_BATCH' && '我可以根据业务需求，一次性规划并生成多个目录及 API 接口。'}
                          </p>
                      </div>
                  )}
                  {messages.map(msg => {
                      const code = msg.role === 'model' ? extractCode(msg.content) : null;
                      const batchData = msg.role === 'model' && currentMode === 'API_BATCH' ? parseBatchJson(msg.content) : null;

                      return (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[92%] rounded-2xl p-3.5 text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                {msg.role === 'model' && !code && !batchData && <div className="whitespace-pre-wrap leading-relaxed"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                                {msg.role === 'user' && <div className="leading-relaxed">{msg.content}</div>}
                                
                                {/* SQL / Function Code Block */}
                                {code && onApplyCode && (
                                    <div className="mt-1">
                                        <div className="text-xs text-slate-500 mb-2 whitespace-pre-wrap leading-relaxed">
                                            <ReactMarkdown>{msg.content.replace(/```[\s\S]*?```/g, '')}</ReactMarkdown>
                                        </div>
                                        <div className="bg-[#1e1e1e] rounded-lg overflow-hidden my-1 border border-slate-700 shadow-md">
                                            <div className="flex justify-between items-center px-3 py-1.5 bg-[#252526] border-b border-[#3e3e42]">
                                                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{currentMode}</span>
                                                <button 
                                                    onClick={() => onApplyCode(code)}
                                                    className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded font-medium transition-colors ${currentMode === 'SQL' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
                                                >
                                                    <Check className="w-3 h-3" /> 应用代码
                                                </button>
                                            </div>
                                            <pre className="p-3 text-xs text-[#d4d4d4] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed custom-scrollbar">
                                                {code}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Batch API Preview Block */}
                                {batchData && onBatchCreate && (
                                    <div className="mt-1">
                                        <div className="text-xs text-slate-500 mb-2 whitespace-pre-wrap leading-relaxed">
                                            <ReactMarkdown>{msg.content.replace(/```json:batch[\s\S]*?```/g, '')}</ReactMarkdown>
                                        </div>
                                        <div className="border border-purple-200 rounded-lg bg-purple-50 overflow-hidden">
                                            <div className="px-3 py-2 bg-purple-100 border-b border-purple-200 flex justify-between items-center">
                                                <span className="text-xs font-bold text-purple-800 flex items-center gap-1">
                                                    <Layers className="w-3.5 h-3.5" /> 
                                                    生成预览: {batchData.folders?.length || 0} 目录, {batchData.apis?.length || 0} 接口
                                                </span>
                                                <button 
                                                    onClick={() => { onBatchCreate(batchData); setIsOpen(false); }}
                                                    className="bg-purple-600 hover:bg-purple-700 text-white text-[10px] px-2 py-1 rounded flex items-center gap-1 transition-colors"
                                                >
                                                    <Check className="w-3 h-3" /> 全部创建
                                                </button>
                                            </div>
                                            <div className="p-2 space-y-2 max-h-48 overflow-y-auto">
                                                {batchData.folders?.map((f: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                                                        <span className="text-amber-500">📁</span> {f.name}
                                                    </div>
                                                ))}
                                                <div className="border-t border-purple-200 my-1"></div>
                                                {batchData.apis?.map((api: any, i: number) => (
                                                    <div key={i} className="flex items-center gap-2 text-xs text-slate-700 bg-white p-1.5 rounded border border-purple-100">
                                                        <span className={`px-1 rounded text-[10px] font-bold border ${api.method==='GET'?'bg-blue-50 text-blue-600 border-blue-100':api.method==='POST'?'bg-green-50 text-green-600 border-green-100':'bg-orange-50 text-orange-600 border-orange-100'}`}>{api.method}</span>
                                                        <span className="flex-1 truncate font-medium">{api.name}</span>
                                                        <span className="text-[10px] text-slate-400 truncate max-w-[80px]">{api.folderName}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                      );
                  })}
                  {isProcessing && (
                      <div className="flex justify-start">
                          <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none p-3 shadow-sm">
                              <div className="flex gap-1.5">
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-slate-100">
                  <div className="relative">
                      <textarea 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                        placeholder={
                            currentMode === 'API_BATCH' ? "描述业务模块，例如：创建一个用户管理模块，包含增删改查..." :
                            selectedContext ? "基于选中的代码提问..." : 
                            (currentMode === 'SQL' ? "描述查询需求..." : "描述函数逻辑...")
                        }
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none max-h-24 min-h-[46px]"
                        rows={1}
                      />
                      <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isProcessing}
                        className={`absolute right-1.5 bottom-1.5 p-2 text-white rounded-lg disabled:opacity-50 transition-all bg-gradient-to-br ${activeInfo.grad} shadow-sm`}
                      >
                          <Send className="w-4 h-4" />
                      </button>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default AIChatFloating;
