
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, X, Sparkles, Copy, Check, Code2, Database, Terminal } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { DatabaseTable, ChatMessage } from '../../../types';
import ReactMarkdown from 'react-markdown';

interface AIChatFloatingProps {
  schema?: DatabaseTable[];
  onApplyCode: (code: string) => void;
  mode: 'SQL' | 'FUNCTION';
  selectedContext?: string; // Code selected in the editor
}

const AIChatFloating: React.FC<AIChatFloatingProps> = ({ schema = [], onApplyCode, mode, selectedContext }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Use env key
  const API_KEY = process.env.API_KEY || '';
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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

        if (mode === 'SQL') {
            const schemaContext = schema.map(t => 
                `- Table: ${t.name} ${t.cnName ? `(${t.cnName})` : ''}\n  Columns: ${t.columns.map(c => `${c.name} (${c.type})`).join(', ')}`
            ).join('\n');

            systemInstruction = `你是一位精通 SQL 的数据库专家和代码生成器。
目标：根据用户需求和数据库结构，生成可直接执行的 SQL 语句。
规则：
1. 优先生成标准 SQL，确保兼容 PostgreSQL/MySQL。
2. 如果需要参数，严格使用 #{paramName} 格式。
3. 只输出 SQL 代码块 (markdown 格式)，不要包含过多的解释性文字。
4. 如果用户提供了"选中的代码"，请基于该代码进行优化、修复或重写。
5. 除非用户明确要求，否则不要生成 DROP/DELETE 等危险操作。`;

            prompt = `
[数据库表结构]
${schemaContext}

${selectedContext ? `[用户当前选中的 SQL 上下文]\n\`\`\`sql\n${selectedContext}\n\`\`\`\n(请基于此上下文进行修改或解答)` : ''}

[用户需求]
${userMsg.content}`;

        } else {
            // Function Mode
            systemInstruction = `你是一位资深的 JavaScript/Node.js 全栈工程师。
目标：编写用于 API 处理或数据转换的高效 JavaScript 函数。
规则：
1. 函数运行在沙箱环境中，通常签名为 function run(context) { ... } 或 function run(data) { ... }。
2. 代码应简洁、健壮，包含必要的注释。
3. 只输出 JavaScript 代码块 (markdown 格式)。
4. 如果用户提供了"选中的代码"，请基于该代码进行重构、优化或添加功能。
5. 可以使用 ES6+ 语法。`;

            prompt = `
${selectedContext ? `[用户当前选中的代码上下文]\n\`\`\`javascript\n${selectedContext}\n\`\`\`\n(请基于此上下文进行修改)` : ''}

[用户需求]
${userMsg.content}`;
        }

        const response = await ai.models.generateContentStream({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                systemInstruction: systemInstruction
            }
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
      // Try to match specific language blocks first based on mode
      const langRegex = mode === 'SQL' ? /```sql\s*([\s\S]*?)\s*```/i : /```(javascript|js)\s*([\s\S]*?)\s*```/i;
      const match = content.match(langRegex);
      if (match) return match[1].trim(); 

      // Fallback: match any code block
      const genericMatch = content.match(/```\w*\s*([\s\S]*?)\s*```/);
      if (genericMatch) return genericMatch[1].trim();

      // Fallback for simple one-liners without markdown
      const cleanContent = content.trim();
      if (mode === 'SQL' && /^(SELECT|INSERT|UPDATE|DELETE|WITH|CREATE|ALTER|SHOW|DESC)/i.test(cleanContent)) return cleanContent;
      if (mode === 'FUNCTION' && /^(function|const|let|var|return|if|for|while)/i.test(cleanContent)) return cleanContent;

      return null;
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
          <button 
            onClick={() => setIsOpen(true)}
            className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-110 transition-all z-50 group ${mode === 'SQL' ? 'bg-gradient-to-br from-blue-600 to-indigo-700 shadow-blue-500/40' : 'bg-gradient-to-br from-emerald-500 to-teal-700 shadow-teal-500/40'}`}
          >
              <Sparkles className="w-6 h-6 animate-pulse" />
              <div className="absolute right-full mr-3 bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm font-medium">
                  {mode === 'SQL' ? '智能 SQL 助手' : '智能函数助手'}
              </div>
          </button>
      )}

      {/* Chat Interface */}
      {isOpen && (
          <div className="fixed bottom-6 right-6 w-[400px] h-[600px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300 overflow-hidden ring-1 ring-slate-900/5">
              {/* Header */}
              <div className={`px-4 py-3 flex justify-between items-center text-white shadow-sm ${mode === 'SQL' ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-emerald-500 to-teal-600'}`}>
                  <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5" />
                      <span className="font-bold text-sm tracking-wide">{mode === 'SQL' ? 'SQL Copilot' : 'Code Copilot'}</span>
                  </div>
                  <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
                      <X className="w-4 h-4" />
                  </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50" ref={scrollRef}>
                  {messages.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs px-8 text-center pb-10">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${mode === 'SQL' ? 'bg-blue-100 text-blue-500' : 'bg-emerald-100 text-emerald-500'}`}>
                              {mode === 'SQL' ? <Database className="w-6 h-6" /> : <Terminal className="w-6 h-6" />}
                          </div>
                          <h3 className="text-sm font-bold text-slate-700 mb-2">
                              {mode === 'SQL' ? '我是您的 SQL 编写助手' : '我是您的函数逻辑助手'}
                          </h3>
                          <p className="mb-4 leading-relaxed">
                              {mode === 'SQL' 
                                ? '我可以帮您编写复杂查询、优化 SQL 性能或解释代码逻辑。' 
                                : '我可以帮您编写数据处理逻辑、正则表达式或算法函数。'}
                          </p>
                          
                          {selectedContext ? (
                              <div className="w-full bg-white border border-blue-200 rounded-lg p-3 text-left shadow-sm">
                                  <div className="flex items-center gap-1.5 text-blue-600 font-bold mb-1.5">
                                      <Code2 className="w-3.5 h-3.5" />
                                      已选中代码上下文
                                  </div>
                                  <code className="block truncate text-slate-500 font-mono bg-slate-50 px-2 py-1 rounded border border-slate-100 text-[10px]">
                                      {selectedContext.substring(0, 60).replace(/\n/g, ' ')}...
                                  </code>
                              </div>
                          ) : (
                              <div className="text-[10px] bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
                                  💡 提示：在编辑器中选中代码可进行针对性提问
                              </div>
                          )}
                      </div>
                  )}
                  {messages.map(msg => {
                      const code = msg.role === 'model' ? extractCode(msg.content) : null;
                      return (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[92%] rounded-2xl p-3.5 text-sm shadow-sm ${msg.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                {msg.role === 'model' && !code && <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>}
                                {msg.role === 'user' && <div className="leading-relaxed">{msg.content}</div>}
                                
                                {code && (
                                    <div className="mt-1">
                                        <div className="text-xs text-slate-500 mb-2 whitespace-pre-wrap leading-relaxed">
                                            <ReactMarkdown>{msg.content.replace(/```[\s\S]*?```/g, '')}</ReactMarkdown>
                                        </div>
                                        <div className="bg-[#1e1e1e] rounded-lg overflow-hidden my-1 border border-slate-700 shadow-md">
                                            <div className="flex justify-between items-center px-3 py-1.5 bg-[#252526] border-b border-[#3e3e42]">
                                                <span className="text-[10px] text-slate-400 font-mono font-bold uppercase">{mode === 'SQL' ? 'SQL' : 'JavaScript'}</span>
                                                <button 
                                                    onClick={() => onApplyCode(code)}
                                                    className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded font-medium transition-colors ${mode === 'SQL' ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-emerald-600 text-white hover:bg-emerald-500'}`}
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
                        placeholder={selectedContext ? "基于选中的代码提问..." : (mode === 'SQL' ? "描述查询需求..." : "描述函数逻辑...")}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none max-h-24 min-h-[46px]"
                        rows={1}
                      />
                      <button 
                        onClick={handleSend}
                        disabled={!input.trim() || isProcessing}
                        className={`absolute right-1.5 bottom-1.5 p-2 text-white rounded-lg disabled:opacity-50 transition-all ${mode === 'SQL' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
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
