import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Code, Save, RefreshCw, Smartphone, Monitor, Tablet, Check, Database, Link, Plus, X, Search, Image as ImageIcon, Upload, FileCode, FileType, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../../types';
import { MOCK_APIS } from '../../modules/api-builder/data';
import ReactRunner from '../../components/LivePreview/ReactRunner';

interface CustomPageBuilderProps {
  pageId: string;
  pageName: string;
  initialHtml?: string;
  onSave: (html: string) => void;
}

// HTML System Instruction
const HTML_SYSTEM_INSTRUCTION = `
You are an expert UI/UX Frontend Developer specializing in Tailwind CSS.
Your task is to generate specific "internal tool" or "dashboard" HTML pages.

**DESIGN SYSTEM:**
- Use Tailwind CSS via CDN.
- Use Lucide Icons via CDN (\`<script src="https://unpkg.com/lucide@latest"></script>\`).
- **NO GLOBAL NAVIGATION**. This is an embedded page.
- Output pure HTML inside \`\`\`html\`\`\`.
- Use \`bg-slate-50\` for background.
- Ensure scripts handle interactivity strictly with vanilla JS.
- Make it look professional, clean, and dense (suitable for OPS tools).
`;

// React System Instruction
const REACT_SYSTEM_INSTRUCTION = `
You are an expert React Frontend Developer.
Your task is to generate a **single, functional React Component** code for an internal tool or dashboard.

**ENVIRONMENT & SCOPE:**
- **Pre-installed Libraries:**
  - \`React\` (and hooks like \`useState\`, \`useEffect\` are global).
  - \`recharts\` (LineChart, BarChart, AreaChart, PieChart, etc.).
  - \`lucide-react\` (All icons).
- **Styling:** Use **Tailwind CSS** classNames.

**STRICT RULES:**
1. **COMPONENT STRUCTURE:** 
   - Write standard React code.
   - **MUST** export the component as default: \`export default ComponentName;\`.
   - Do **NOT** use \`ReactDOM.render\` or \`createRoot\`.
   - Do **NOT** use \`import\` statements if possible (globals are provided), but if you do, only import from 'react', 'recharts', or 'lucide-react'.
2. **DATA:** Use real \`fetch\` if APIs are provided in context, otherwise use mock data variables.
3. **OUTPUT:** Return *only* the Javascript/JSX code inside a \`\`\`jsx\`\`\` block. No conversational text.

**EXAMPLE OUTPUT:**
\`\`\`jsx
const Dashboard = () => {
  const [data, setData] = useState([{ name: 'A', value: 100 }]);
  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-4 text-slate-800">Overview</h1>
      <div className="h-64 bg-white p-4 rounded shadow">
        <ResponsiveContainer width="100%" height="100%">
           <BarChart data={data}>
              <XAxis dataKey="name" />
              <Bar dataKey="value" fill="#3b82f6" />
           </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
export default Dashboard;
\`\`\`
`;

const CustomPageBuilder: React.FC<CustomPageBuilderProps> = ({ pageId, pageName, initialHtml, onSave }) => {
  // Mode State - Defaults to HTML
  const [generationMode, setGenerationMode] = useState<'html' | 'react'>('html');

  // AI & Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // Image Input State
  const [pendingImage, setPendingImage] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Content State
  const [generatedCode, setGeneratedCode] = useState<string>(initialHtml || '');
  const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Context State
  const [isApiModalOpen, setIsApiModalOpen] = useState(false);
  const [selectedApiIds, setSelectedApiIds] = useState<Set<string>>(new Set());
  const [apiSearchTerm, setApiSearchTerm] = useState('');

  const scrollRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize Messages
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: 'init',
        role: 'model',
        content: `你好！我是 **${pageName}** 的页面生成助手。\n当前模式：**${generationMode === 'react' ? 'React Component' : 'Static HTML'}**。\n\n💡 **提示**：您可以直接 **粘贴(Ctrl+V)** 截图或点击上传图片，让我根据设计图生成代码。`,
        timestamp: new Date()
      }]);
    }
  }, [pageName]);

  // Auto-detect mode from content
  useEffect(() => {
    if (initialHtml) {
      if (initialHtml.includes('export default') || initialHtml.includes('import React')) {
        setGenerationMode('react');
      } else {
        setGenerationMode('html');
      }
      setGeneratedCode(initialHtml);
    }
  }, [initialHtml]);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, pendingImage]); 

  // Auto-save effect
  useEffect(() => {
    if (saveStatus === 'saved') {
      const timer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  // Image Handling
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handlePaste = (e: React.ClipboardEvent) => {
      const items = e.clipboardData.items;
      for (const item of items) {
          if (item.type.indexOf('image') !== -1) {
              const file = item.getAsFile();
              if (file) {
                  processFile(file);
                  e.preventDefault(); 
              }
          }
      }
  };

  const processFile = (file: File) => {
      const reader = new FileReader();
      reader.onloadend = () => {
          const base64String = reader.result as string;
          const base64Data = base64String.split(',')[1];
          setPendingImage({
              data: base64Data,
              mimeType: file.type,
              previewUrl: base64String
          });
      };
      reader.readAsDataURL(file);
  };

  const removePendingImage = () => {
      setPendingImage(null);
  };

  const handleSend = async () => {
    if ((!input.trim() && !pendingImage) || isProcessing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
      image: pendingImage?.previewUrl
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    const currentImage = pendingImage;
    setPendingImage(null);
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
      const apiKey = process.env.API_KEY || '';
      const ai = new GoogleGenAI({ apiKey });

      // 1. Context: APIs
      let apiContext = "";
      if (selectedApiIds.size > 0) {
          const selectedApis = MOCK_APIS.filter(api => selectedApiIds.has(api.id));
          apiContext = "\n\n**AVAILABLE APIS:**\n" + selectedApis.map(api => `
- Name: ${api.name}
  Method: ${api.method}
  Path: ${api.path}
  Params: ${JSON.stringify(api.params)}
          `).join('\n');
      }

      // 2. Context: Current Page
      let pageContext = "";
      if (generatedCode && generatedCode.length > 50) {
          const lang = generationMode === 'react' ? 'jsx' : 'html';
          pageContext = `\n\n**CURRENT CODE (Modify this):**\n\`\`\`${lang}\n${generatedCode}\n\`\`\`\n\nInstruction: Update the code based on the request.`;
      }

      const systemInstruction = generationMode === 'react' ? REACT_SYSTEM_INSTRUCTION : HTML_SYSTEM_INSTRUCTION;
      const fullPrompt = `${systemInstruction}${apiContext}${pageContext}\n\n**User Request:** ${input || (currentImage ? "Generate code based on this image." : "")}`;
      
      const contentsParts: any[] = [{ text: fullPrompt }];
      
      if (currentImage) {
          contentsParts.push({
              inlineData: {
                  mimeType: currentImage.mimeType,
                  data: currentImage.data
              }
          });
      }

      const responseStream = await ai.models.generateContentStream({
        model: 'gemini-2.5-flash',
        contents: [
            { role: 'user', parts: contentsParts }
        ],
      });

      let fullText = '';
      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          fullText += text;
          
          // Parse logic based on mode
          const codeBlockRegex = generationMode === 'react' 
            ? /```(?:jsx|javascript|js)\s*([\s\S]*?)(```|$)/
            : /```html\s*([\s\S]*?)(```|$)/;

          const match = fullText.match(codeBlockRegex);
          if (match && match[1]) {
              setGeneratedCode(match[1]);
          }

          setMessages(prev => prev.map(msg => 
            msg.id === aiMsgId ? { ...msg, content: fullText } : msg
          ));
        }
      }

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === aiMsgId ? { ...msg, content: "生成遇到错误，请重试。" } : msg
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveClick = () => {
    setSaveStatus('saving');
    onSave(generatedCode);
    setTimeout(() => setSaveStatus('saved'), 800);
  };

  const getPreviewHtml = (html: string) => {
    if (!html) return '<html><body class="flex items-center justify-center h-screen text-gray-400 bg-gray-50 font-sans">暂无内容</body></html>';
    let processedHtml = html;
    if (!processedHtml.includes('cdn.tailwindcss.com')) {
      processedHtml = processedHtml.replace('<head>', '<head><script src="https://cdn.tailwindcss.com"></script>');
    }
    // Inject Lucide script if missing in HTML mode
    if (!processedHtml.includes('unpkg.com/lucide')) {
       processedHtml = processedHtml.replace('</body>', '<script src="https://unpkg.com/lucide@latest"></script><script>lucide.createIcons();</script></body>');
    }
    return processedHtml;
  };

  // API Selection
  const toggleApiSelection = (id: string) => {
      const newSet = new Set(selectedApiIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedApiIds(newSet);
  };

  const renderApiModal = () => {
      if (!isApiModalOpen) return null;
      const filteredApis = MOCK_APIS.filter(api => api.name.toLowerCase().includes(apiSearchTerm.toLowerCase()) || api.path.includes(apiSearchTerm));

      return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[600px] h-[500px] flex flex-col animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-xl">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <Database className="w-5 h-5 text-blue-600" />
                          上下文接口 (API Context)
                      </h3>
                      <button onClick={() => setIsApiModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-3 border-b border-slate-100 bg-white">
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                              type="text" 
                              placeholder="搜索 API..." 
                              value={apiSearchTerm}
                              onChange={(e) => setApiSearchTerm(e.target.value)}
                              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                          />
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {filteredApis.map(api => (
                          <div 
                              key={api.id}
                              onClick={() => toggleApiSelection(api.id)}
                              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all ${
                                  selectedApiIds.has(api.id) 
                                  ? 'bg-blue-50 border-blue-200 shadow-sm' 
                                  : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                              }`}
                          >
                              <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 ${selectedApiIds.has(api.id) ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                  {selectedApiIds.has(api.id) && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${
                                          api.method === 'GET' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                          api.method === 'POST' ? 'bg-green-100 text-green-700 border-green-200' : 
                                          'bg-orange-100 text-orange-700 border-orange-200'
                                      }`}>{api.method}</span>
                                      <span className="text-sm font-medium text-slate-700 truncate">{api.name}</span>
                                  </div>
                                  <div className="text-xs text-slate-400 font-mono mt-1 truncate">{api.path}</div>
                              </div>
                          </div>
                      ))}
                  </div>

                  <div className="px-5 py-4 border-t border-slate-100 bg-slate-50 rounded-b-xl flex justify-between items-center">
                      <span className="text-xs text-slate-500">已选择 {selectedApiIds.size} 个接口</span>
                      <button 
                          onClick={() => setIsApiModalOpen(false)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
                      >
                          确认使用
                      </button>
                  </div>
              </div>
          </div>
      );
  };

  return (
    <div className="flex h-full w-full bg-slate-100 overflow-hidden">
      
      {/* Left: Preview Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'mr-0' : ''}`}>
        {/* Preview Toolbar */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-slate-700">{pageName}</span>
            
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                <button 
                    onClick={() => { setGenerationMode('html'); setGeneratedCode(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${generationMode === 'html' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileType className="w-3.5 h-3.5" /> HTML
                </button>
                <button 
                    onClick={() => { setGenerationMode('react'); setGeneratedCode(''); }}
                    className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-all ${generationMode === 'react' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileCode className="w-3.5 h-3.5" /> React
                </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex bg-slate-100 p-1 rounded-lg">
                <button 
                  onClick={() => setViewMode('desktop')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'desktop' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Desktop View"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('tablet')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'tablet' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Tablet View"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('mobile')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'mobile' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="Mobile View"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
             </div>
             
             <button 
               onClick={() => setShowCode(!showCode)}
               className={`p-1.5 rounded-lg border transition-all ${showCode ? 'bg-indigo-50 border-indigo-200 text-indigo-600' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
               title="Toggle Source Code"
             >
               <Code className="w-4 h-4" />
             </button>

             <button 
               onClick={handleSaveClick}
               disabled={!generatedCode || saveStatus === 'saving'}
               className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-all text-white shadow-sm ${saveStatus === 'saved' ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
             >
               {saveStatus === 'saving' ? (
                 <RefreshCw className="w-4 h-4 animate-spin" /> 
               ) : saveStatus === 'saved' ? (
                 <><Check className="w-4 h-4" /> 已保存</>
               ) : (
                 <><Save className="w-4 h-4" /> 保存</>
               )}
             </button>

             {/* Toggle Sidebar Button (Visible when closed) */}
             {!isSidebarOpen && (
                <button 
                  onClick={() => setIsSidebarOpen(true)}
                  className="p-1.5 rounded-lg border bg-white border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 transition-all ml-2"
                  title="展开 AI 助手"
                >
                  <PanelRightOpen className="w-4 h-4" />
                </button>
             )}
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 bg-slate-200/50 p-4 flex items-center justify-center overflow-hidden relative">
           {showCode ? (
             <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-2xl">
               <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 text-slate-400 text-xs font-mono">
                 <span>{generationMode === 'react' ? 'JSX Source' : 'HTML Source'}</span>
                 <button onClick={() => navigator.clipboard.writeText(generatedCode)} className="hover:text-white">Copy</button>
               </div>
               <textarea 
                 value={generatedCode}
                 onChange={(e) => setGeneratedCode(e.target.value)}
                 className="w-full h-full bg-slate-900 text-green-400 font-mono text-xs p-4 focus:outline-none resize-none"
                 spellCheck={false}
               />
             </div>
           ) : (
             <div 
               className={`bg-white shadow-2xl transition-all duration-300 overflow-hidden border border-slate-300 relative ${
                 viewMode === 'mobile' ? 'w-[375px] h-[667px] rounded-3xl border-8 border-slate-800' : 
                 viewMode === 'tablet' ? 'w-[768px] h-[1024px] rounded-xl border-4 border-slate-800' : 
                 'w-full h-full rounded-lg'
               }`}
             >
                {generationMode === 'html' ? (
                    <iframe
                      ref={iframeRef}
                      srcDoc={getPreviewHtml(generatedCode)}
                      className="w-full h-full"
                      title="Preview"
                      sandbox="allow-scripts"
                    />
                ) : (
                    <div className="w-full h-full overflow-auto">
                        <ReactRunner code={generatedCode} />
                    </div>
                )}
             </div>
           )}
        </div>
      </div>

      {/* Right: AI Chat Sidebar (CSS Transition instead of Unmount) */}
      <div 
        className={`bg-white border-l border-slate-200 flex flex-col flex-shrink-0 shadow-xl z-10 transition-all duration-300 ease-in-out ${
            isSidebarOpen ? 'w-[350px] opacity-100 translate-x-0' : 'w-0 opacity-0 translate-x-10 overflow-hidden border-l-0'
        }`}
      >
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center min-w-[350px]">
            <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <Bot className="w-5 h-5 text-indigo-600" />
                    AI 页面生成器
                </h3>
                <p className="text-xs text-slate-500 mt-1">当前模式: {generationMode === 'react' ? 'React (高级)' : 'HTML (基础)'}</p>
            </div>
            {/* Close Sidebar Button */}
            <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200 p-1.5 rounded transition-colors"
                title="收起"
            >
                <PanelRightClose className="w-4 h-4" />
            </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 min-w-[350px]" ref={scrollRef}>
            {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold shadow-sm flex-shrink-0
                    ${msg.role === 'user' ? 'bg-white border border-slate-200 text-slate-700' : 'bg-indigo-600 text-white'}
                `}>
                    {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`
                    max-w-[85%] rounded-2xl px-3 py-2 text-sm shadow-sm
                    ${msg.role === 'user' 
                    ? 'bg-white border border-slate-200 text-slate-700 rounded-tr-none' 
                    : 'bg-indigo-50 border border-indigo-100 text-indigo-900 rounded-tl-none'}
                `}>
                    {msg.image && (
                        <div className="mb-2 rounded-lg overflow-hidden border border-slate-200">
                            <img src={msg.image} alt="User Upload" className="max-w-full h-auto" />
                        </div>
                    )}
                    {msg.content.includes(generationMode === 'react' ? '```jsx' : '```html') ? (
                    <div>
                        <p className="mb-2">✅ 页面已生成</p>
                        <div className="text-[10px] text-indigo-400 italic">在左侧预览实时效果。支持 Recharts 图表和 Tailwind 样式。</div>
                    </div>
                    ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                </div>
                </div>
            ))}
            {isProcessing && (
                <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm">
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
            <div className="p-4 bg-white border-t border-slate-200 space-y-3 min-w-[350px]">
            {/* Pending Image Preview */}
            {pendingImage && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg animate-in fade-in slide-in-from-bottom-2">
                    <div className="w-10 h-10 rounded overflow-hidden border border-slate-200 bg-white">
                        <img src={pendingImage.previewUrl} alt="Pending" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-slate-700 truncate">已添加图片</div>
                        <div className="text-[10px] text-slate-400 truncate">{pendingImage.mimeType}</div>
                    </div>
                    <button onClick={removePendingImage} className="p-1 hover:bg-slate-200 rounded-full text-slate-500 hover:text-red-500">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Context Tools */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                <button 
                    onClick={() => setIsApiModalOpen(true)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                        selectedApiIds.size > 0 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                    <Link className="w-3 h-3" />
                    {selectedApiIds.size > 0 ? `已选 ${selectedApiIds.size} 个接口` : 'API 上下文'}
                </button>
                {generatedCode.length > 50 && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200 whitespace-nowrap cursor-default">
                        <Check className="w-3 h-3" /> 携带当前代码
                    </span>
                )}
            </div>

            <div className="relative">
                <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                    if(e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                    }
                }}
                onPaste={handlePaste}
                placeholder={generationMode === 'react' ? "描述 React 组件需求..." : "描述 HTML 页面需求..."}
                className="w-full pl-4 pr-20 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none h-[80px]"
                />
                
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                        title="上传图片"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={handleSend}
                        disabled={(!input.trim() && !pendingImage) || isProcessing}
                        className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors shadow-sm"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </div>
            </div>
        </div>
      
      {/* Modals */}
      {renderApiModal()}
    </div>
  );
};

export default CustomPageBuilder;