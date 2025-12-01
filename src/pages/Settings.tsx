
import React, { useState } from 'react';
import { 
    Save, Shield, Globe, Users, UserCog, Plus, Trash2, Edit2, 
    CheckSquare, X, ChevronDown, Cpu, Zap, Search, CheckCircle, 
    MoreHorizontal, Bot, Flame, Sparkles, Box, Aperture, Moon,
    Cloud, Server, Key, Share2, Power, Terminal, Copy, Lock
} from 'lucide-react';

enum SettingsTab {
  GENERAL = 'GENERAL',
  USERS = 'USERS',
  ROLES = 'ROLES',
  AI_MODELS = 'AI_MODELS',
  MCP_SERVER = 'MCP_SERVER'
}

// --- Mock Data ---

const MOCK_USERS = [
    { id: '1', name: 'Admin User', email: 'admin@example.com', role: 'Super Admin', status: 'Active', lastLogin: '2023-10-24 10:30' },
    { id: '2', name: 'John Doe', email: 'john@example.com', role: 'Developer', status: 'Active', lastLogin: '2023-10-23 15:45' },
    { id: '3', name: 'Jane Smith', email: 'jane@example.com', role: 'Viewer', status: 'Inactive', lastLogin: '2023-10-20 09:12' },
];

const MOCK_ROLES = [
    { id: '1', name: 'Super Admin', description: '拥有系统所有资源的完全访问权限', usersCount: 1, permissions: ['*'] },
    { id: '2', name: 'Developer', description: '可以创建和编辑 API，管理数据库连接', usersCount: 5, permissions: ['api:read', 'api:write', 'db:read', 'db:write'] },
    { id: '3', name: 'Viewer', description: '仅拥有 API 和日志的只读访问权限', usersCount: 12, permissions: ['api:read', 'logs:read'] },
];

const PERMISSION_TREE = [
    {
        id: 'sys', label: '系统管理', children: [
            { id: 'sys:user', label: '用户管理' },
            { id: 'sys:role', label: '角色管理' },
            { id: 'sys:log', label: '日志查看' }
        ]
    },
    {
        id: 'db', label: '数据库管理', children: [
            { id: 'db:read', label: '读取表结构' },
            { id: 'db:write', label: '修改表结构' },
            { id: 'db:data', label: '数据查询' }
        ]
    },
    {
        id: 'api', label: '接口管理', children: [
            { id: 'api:read', label: '查看接口' },
            { id: 'api:write', label: '编辑接口' },
            { id: 'api:publish', label: '发布接口' }
        ]
    }
];

// --- AI Model Data & Types ---

interface AiModelConfig {
    id: string;
    name: string; // e.g. "gpt-4"
    providerId: string;
    providerName: string;
    apiKey: string;
    baseUrl: string;
    isDefault: boolean;
    isEnabled: boolean;
}

const AI_PROVIDERS_LIST = [
    { id: 'aliyun', name: '阿里云百炼', icon: <Box className="w-6 h-6 text-orange-500" />, defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
    { id: 'baidu', name: '千帆大模型', icon: <Cloud className="w-6 h-6 text-blue-500" />, defaultBaseUrl: 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop' },
    { id: 'deepseek', name: 'DeepSeek', icon: <Bot className="w-6 h-6 text-indigo-600" />, defaultBaseUrl: 'https://api.deepseek.com/v1' },
    { id: 'tencent', name: '腾讯混元', icon: <Aperture className="w-6 h-6 text-blue-600" />, defaultBaseUrl: 'https://api.hunyuan.cloud.tencent.com/v1' },
    { id: 'spark', name: '讯飞星火', icon: <Flame className="w-6 h-6 text-blue-500" />, defaultBaseUrl: 'https://spark-api.xf-yun.com/v3.1/chat' },
    { id: 'gemini', name: 'Gemini', icon: <Sparkles className="w-6 h-6 text-rose-500" />, defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/' },
    { id: 'openai', name: 'OpenAI', icon: <Bot className="w-6 h-6 text-emerald-600" />, defaultBaseUrl: 'https://api.openai.com/v1' },
    { id: 'kimi', name: 'Kimi', icon: <Moon className="w-6 h-6 text-slate-800" />, defaultBaseUrl: 'https://api.moonshot.cn/v1' },
    { id: 'tencent_cloud', name: '腾讯云', icon: <Cloud className="w-6 h-6 text-blue-400" />, defaultBaseUrl: 'https://api.tencent.com' },
    { id: 'volcano', name: '火山引擎', icon: <Flame className="w-6 h-6 text-red-500" />, defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3' },
    { id: 'azure', name: 'Azure OpenAI', icon: <Box className="w-6 h-6 text-blue-600" />, defaultBaseUrl: 'https://{resource}.openai.azure.com' },
    { id: 'custom', name: '通用OpenAI', icon: <Server className="w-6 h-6 text-slate-600" />, defaultBaseUrl: '' },
];

const MOCK_AI_MODELS: AiModelConfig[] = [
    { id: '1', name: 'gemini-2.5-flash', providerId: 'gemini', providerName: 'Gemini', apiKey: 'AIzaSy...', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai/', isDefault: true, isEnabled: true },
    { id: '2', name: 'gpt-4o', providerId: 'openai', providerName: 'OpenAI', apiKey: 'sk-proj...', baseUrl: 'https://api.openai.com/v1', isDefault: false, isEnabled: true },
];

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>(SettingsTab.GENERAL);
  const [users, setUsers] = useState(MOCK_USERS);
  const [roles, setRoles] = useState(MOCK_ROLES);
  
  // -- User Management States --
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'Viewer', password: '', status: 'Active' });

  // -- Role/Permission States --
  const [showPermModal, setShowPermModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false); // New: Role Add/Edit Modal
  const [roleForm, setRoleForm] = useState({ id: '', name: '', description: '' });
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState<string | null>(null);

  // -- AI Model States --
  const [aiModels, setAiModels] = useState<AiModelConfig[]>(MOCK_AI_MODELS);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiModalStep, setAiModalStep] = useState(1);
  const [selectedProvider, setSelectedProvider] = useState<typeof AI_PROVIDERS_LIST[0] | null>(null);
  const [aiForm, setAiForm] = useState({ name: '', apiKey: '', baseUrl: '' });
  const [editingModelId, setEditingModelId] = useState<string | null>(null);

  // -- MCP States --
  const [mcpEnabled, setMcpEnabled] = useState(false);
  const [mcpConfig, setMcpConfig] = useState({
      exposeResources: true,
      exposeTools: true,
      exposeSmartQuery: true,
      port: 3000,
      token: 'sk-mcp-d82...'
  });

  // Render Functions

  const renderSidebar = () => (
      <div className="w-64 bg-white border-r border-slate-200 flex flex-col h-full flex-shrink-0">
          <div className="p-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">系统设置</h2>
          </div>
          <div className="p-2 space-y-1">
              <button 
                onClick={() => setActiveTab(SettingsTab.GENERAL)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === SettingsTab.GENERAL ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <Globe className="w-4 h-4" /> 通用设置
              </button>
              <button 
                onClick={() => setActiveTab(SettingsTab.USERS)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === SettingsTab.USERS ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <Users className="w-4 h-4" /> 用户管理
              </button>
              <button 
                onClick={() => setActiveTab(SettingsTab.ROLES)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === SettingsTab.ROLES ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <UserCog className="w-4 h-4" /> 角色设置
              </button>
              <button 
                onClick={() => setActiveTab(SettingsTab.AI_MODELS)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === SettingsTab.AI_MODELS ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <Cpu className="w-4 h-4" /> AI 模型配置
              </button>
              <div className="h-px bg-slate-100 my-2"></div>
              <button 
                onClick={() => setActiveTab(SettingsTab.MCP_SERVER)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === SettingsTab.MCP_SERVER ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                  <Share2 className="w-4 h-4" /> MCP 服务
                  <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">BETA</span>
              </button>
          </div>
      </div>
  );

  const renderGeneralSettings = () => (
    <div className="max-w-4xl p-8 space-y-6 animate-in fade-in duration-300">
        <div>
            <h3 className="text-xl font-bold text-slate-800 mb-1">通用设置</h3>
            <p className="text-sm text-slate-500">配置系统的基本参数和显示选项</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="grid grid-cols-2 gap-6">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">系统名称</label>
                    <input type="text" defaultValue="APISQL Platform" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">默认语言</label>
                    <div className="relative">
                        <select className="appearance-none w-full px-3 py-2 pr-8 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none bg-white cursor-pointer">
                            <option>简体中文 (zh-CN)</option>
                            <option>English (en-US)</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    </div>
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 mb-1">API Base URL</label>
                 <input type="text" defaultValue="https://api.example.com/v1" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 bg-slate-50" readOnly />
            </div>
        </div>

        <div className="flex justify-end">
             <button className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors">
                 <Save className="w-4 h-4" /> 保存设置
             </button>
        </div>
    </div>
  );

  // --- MCP Settings Implementation ---
  const renderMcpSettings = () => {
      const copyConfig = () => {
          const configStr = JSON.stringify({
              "mcpServers": {
                  "apisql": {
                      "command": "npx",
                      "args": ["-y", "@apisql/mcp-server"],
                      "env": { "APISQL_HOST": "https://api.your-domain.com", "APISQL_TOKEN": mcpConfig.token }
                  }
              }
          }, null, 2);
          navigator.clipboard.writeText(configStr);
          alert('配置已复制到剪贴板！');
      };

      return (
          <div className="max-w-4xl p-8 space-y-6 animate-in fade-in duration-300 h-full overflow-y-auto">
              <div className="flex justify-between items-start">
                  <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2">
                          <Share2 className="w-6 h-6 text-indigo-600" />
                          Model Context Protocol (MCP)
                      </h3>
                      <p className="text-sm text-slate-500 max-w-2xl">
                          MCP 是一种开放标准，允许 AI 模型（如 Claude Desktop）安全地连接到您的数据和工具。开启此服务后，外部 AI 助手可以直接查询数据库、调用 API 并获取系统上下文。
                      </p>
                  </div>
                  <a href="https://modelcontextprotocol.io/" target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                      了解更多 <ChevronDown className="-rotate-90 w-3 h-3" />
                  </a>
              </div>

              {/* Status Card */}
              <div className={`border rounded-xl p-6 transition-all ${mcpEnabled ? 'bg-indigo-50 border-indigo-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${mcpEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-300 text-slate-500'}`}>
                              <Power className="w-5 h-5" />
                          </div>
                          <div>
                              <div className="font-bold text-slate-800 text-lg">MCP 服务{mcpEnabled ? '已运行' : '未启动'}</div>
                              <div className="text-xs text-slate-500">{mcpEnabled ? '正在监听请求，可随时连接' : '点击右侧开关以启用服务'}</div>
                          </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={mcpEnabled} onChange={() => setMcpEnabled(!mcpEnabled)} />
                          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                  </div>

                  {mcpEnabled && (
                      <div className="bg-white rounded-lg border border-indigo-100 p-4 animate-in fade-in slide-in-from-top-2">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <span className="text-slate-500 block mb-1">SSE Endpoint</span>
                                  <code className="bg-slate-50 px-2 py-1 rounded text-indigo-700 font-mono border border-slate-200 select-all">
                                      https://api.your-domain.com/mcp/sse
                                  </code>
                              </div>
                              <div>
                                  <span className="text-slate-500 block mb-1">Access Token</span>
                                  <div className="flex items-center gap-2">
                                      <code className="bg-slate-50 px-2 py-1 rounded text-slate-700 font-mono border border-slate-200 flex-1 truncate">
                                          {mcpConfig.token}
                                      </code>
                                      <button className="text-indigo-600 hover:text-indigo-800 text-xs font-medium">重置</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  )}
              </div>

              {/* Configuration */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h4 className="font-bold text-slate-700">能力暴露配置</h4>
                      <span className="text-xs text-slate-400">选择对外暴露的资源与工具</span>
                  </div>
                  <div className="p-6 space-y-4">
                      <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                          <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${mcpConfig.exposeResources ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                              {mcpConfig.exposeResources && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={mcpConfig.exposeResources} onChange={() => setMcpConfig({...mcpConfig, exposeResources: !mcpConfig.exposeResources})} />
                          <div>
                              <div className="font-bold text-slate-800 text-sm">Expose Database Schema (Resources)</div>
                              <p className="text-xs text-slate-500 mt-1">允许 AI 读取数据库表结构、字段定义及备注信息。这将作为 MCP Resources 提供。</p>
                          </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                          <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${mcpConfig.exposeSmartQuery ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                              {mcpConfig.exposeSmartQuery && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={mcpConfig.exposeSmartQuery} onChange={() => setMcpConfig({...mcpConfig, exposeSmartQuery: !mcpConfig.exposeSmartQuery})} />
                          <div>
                              <div className="font-bold text-slate-800 text-sm">Smart Query Tool</div>
                              <p className="text-xs text-slate-500 mt-1">提供一个通用 SQL 执行工具，允许 AI 直接编写并执行 SQL 查询数据（建议仅在受控环境开启）。</p>
                          </div>
                      </label>

                      <label className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-200">
                          <div className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors ${mcpConfig.exposeTools ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'}`}>
                              {mcpConfig.exposeTools && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                          </div>
                          <input type="checkbox" className="hidden" checked={mcpConfig.exposeTools} onChange={() => setMcpConfig({...mcpConfig, exposeTools: !mcpConfig.exposeTools})} />
                          <div>
                              <div className="font-bold text-slate-800 text-sm">Expose APIs as Tools</div>
                              <p className="text-xs text-slate-500 mt-1">将所有状态为 "Published" 的 API 接口自动转换为 MCP Tools，供 AI 调用。</p>
                          </div>
                      </label>
                  </div>
              </div>

              {/* Client Config Helper */}
              <div className="bg-slate-900 rounded-xl p-6 text-slate-300 shadow-lg">
                  <div className="flex justify-between items-center mb-4">
                      <h4 className="font-bold text-white flex items-center gap-2">
                          <Terminal className="w-4 h-4" /> Claude Desktop 配置
                      </h4>
                      <button onClick={copyConfig} className="text-xs flex items-center gap-1 hover:text-white transition-colors">
                          <Copy className="w-3.5 h-3.5" /> 复制配置 JSON
                      </button>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                      将以下内容添加到您的 <code>claude_desktop_config.json</code> 文件中，即可连接本服务。
                  </p>
                  <pre className="bg-black/30 p-4 rounded-lg text-xs font-mono overflow-x-auto border border-slate-700 text-green-400">
{`{
  "mcpServers": {
    "apisql-platform": {
      "command": "npx",
      "args": ["-y", "@apisql/mcp-client"],
      "env": {
        "MCP_ENDPOINT": "https://api.your-domain.com/mcp/sse",
        "MCP_TOKEN": "${mcpConfig.token}"
      }
    }
  }
}`}
                  </pre>
              </div>
          </div>
      );
  };

  const renderAiModelSettings = () => {
      const handleSetDefault = (id: string) => {
          setAiModels(prev => prev.map(m => ({ ...m, isDefault: m.id === id })));
      };

      const handleToggleEnabled = (id: string) => {
          setAiModels(prev => prev.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m));
      };
      
      const handleDeleteModel = (id: string) => {
          if(confirm('确定要删除该模型配置吗？')) {
             setAiModels(prev => prev.filter(m => m.id !== id));
          }
      };

      const openAddModal = () => {
          setAiModalStep(1);
          setSelectedProvider(null);
          setAiForm({ name: '', apiKey: '', baseUrl: '' });
          setEditingModelId(null);
          setShowAiModal(true);
      };

      const handleEditModel = (model: AiModelConfig) => {
          const provider = AI_PROVIDERS_LIST.find(p => p.id === model.providerId);
          if (provider) {
             setSelectedProvider(provider);
             setAiForm({ name: model.name, apiKey: model.apiKey, baseUrl: model.baseUrl });
             setEditingModelId(model.id);
             setAiModalStep(2);
             setShowAiModal(true);
          }
      };

      return (
        <div className="p-8 h-full flex flex-col animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-800 mb-1">AI 模型配置</h3>
                    <p className="text-sm text-slate-500">管理 LLM 大模型连接，配置系统默认使用的智能引擎</p>
                </div>
                <button 
                    onClick={openAddModal}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium"
                >
                    <Plus className="w-4 h-4" /> 添加模型
                </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-6 py-3 font-medium text-slate-600">模型名称</th>
                            <th className="px-6 py-3 font-medium text-slate-600">供应商</th>
                            <th className="px-6 py-3 font-medium text-slate-600">API Key</th>
                            <th className="px-6 py-3 font-medium text-slate-600 text-center">状态</th>
                            <th className="px-6 py-3 font-medium text-slate-600 text-center">默认</th>
                            <th className="px-6 py-3 font-medium text-slate-600 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {aiModels.map(model => (
                            <tr key={model.id} className="hover:bg-slate-50 group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                                            {/* Attempt to find icon from list, or default */}
                                            {AI_PROVIDERS_LIST.find(p => p.id === model.providerId)?.icon || <Cpu className="w-4 h-4 text-slate-500"/>}
                                        </div>
                                        <div className="font-medium text-slate-800">{model.name}</div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-slate-600">{model.providerName}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-500 font-mono">
                                        {model.apiKey.substring(0, 4)}...{model.apiKey.substring(model.apiKey.length - 4)}
                                    </code>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleToggleEnabled(model.id)}
                                        className={`px-2 py-1 rounded text-xs font-bold border transition-all ${model.isEnabled ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}
                                    >
                                        {model.isEnabled ? '启用' : '禁用'}
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <button 
                                        onClick={() => handleSetDefault(model.id)}
                                        disabled={!model.isEnabled}
                                        className={`p-1.5 rounded-full transition-all cursor-pointer ${model.isDefault ? 'text-blue-600 bg-blue-50 ring-2 ring-blue-100' : 'text-slate-300 hover:text-blue-400 hover:bg-slate-100'}`}
                                        title={model.isDefault ? "当前默认" : "设为默认"}
                                    >
                                        <CheckCircle className={`w-5 h-5 ${model.isDefault ? 'fill-current' : ''}`} />
                                    </button>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button 
                                            onClick={() => handleEditModel(model)}
                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" 
                                            title="编辑"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteModel(model.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" 
                                            title="删除"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {aiModels.length === 0 && (
                    <div className="p-8 text-center text-slate-400">
                        <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p>暂无配置的模型，请添加一个。</p>
                    </div>
                )}
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700 flex items-start gap-2">
                <Bot className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                    <span className="font-bold">提示：</span> 系统会优先使用设为"默认"的模型进行 SQL 生成和智能问答。请确保该模型的 API Key 余额充足。
                    支持所有兼容 OpenAI 接口格式的模型服务（如 DeepSeek, Moonshot 等）。
                </div>
            </div>
        </div>
      );
  };

  const renderAiModal = () => {
      if (!showAiModal) return null;

      const handleNext = () => {
          if (selectedProvider) {
              setAiForm(prev => ({ ...prev, baseUrl: selectedProvider.defaultBaseUrl }));
              setAiModalStep(2);
          }
      };

      const handleSaveModel = () => {
          if (!aiForm.name || !aiForm.apiKey) return;
          
          if (editingModelId) {
             setAiModels(prev => prev.map(m => m.id === editingModelId ? {
                 ...m,
                 name: aiForm.name,
                 apiKey: aiForm.apiKey,
                 baseUrl: aiForm.baseUrl,
                 providerId: selectedProvider?.id || m.providerId,
                 providerName: selectedProvider?.name || m.providerName
             } : m));
          } else {
             const newModel: AiModelConfig = {
                 id: Date.now().toString(),
                 name: aiForm.name,
                 providerId: selectedProvider?.id || 'custom',
                 providerName: selectedProvider?.name || 'Custom',
                 apiKey: aiForm.apiKey,
                 baseUrl: aiForm.baseUrl,
                 isDefault: aiModels.length === 0,
                 isEnabled: true
             };
             setAiModels([...aiModels, newModel]);
          }
          
          setShowAiModal(false);
      };

      return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[800px] max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    {editingModelId ? (
                        <h3 className="font-bold text-slate-700 flex items-center gap-2">
                           <Edit2 className="w-4 h-4 text-blue-600"/> 编辑模型配置
                        </h3>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${aiModalStep === 1 ? 'bg-blue-600 text-white' : 'bg-green-500 text-white'}`}>1</div>
                            <div className={`h-1 w-8 rounded bg-slate-200 ${aiModalStep === 2 ? 'bg-blue-600' : ''}`}></div>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${aiModalStep === 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                            <span className="ml-2 font-bold text-slate-700">
                                {aiModalStep === 1 ? '选择供应商' : '添加模型'}
                            </span>
                        </div>
                    )}
                    <button onClick={() => setShowAiModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-slate-50">
                    {aiModalStep === 1 ? (
                        <div className="space-y-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="text" placeholder="搜索" className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500" />
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {AI_PROVIDERS_LIST.map(provider => (
                                    <button 
                                        key={provider.id}
                                        onClick={() => setSelectedProvider(provider)}
                                        className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all hover:shadow-md ${selectedProvider?.id === provider.id ? 'bg-white border-blue-500 ring-2 ring-blue-100 shadow-md' : 'bg-white border-slate-200 hover:border-blue-300'}`}
                                    >
                                        <div className="p-2 bg-slate-50 rounded-lg">
                                            {provider.icon}
                                        </div>
                                        <span className={`font-medium text-sm ${selectedProvider?.id === provider.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                            {provider.name}
                                        </span>
                                        {selectedProvider?.id === provider.id && <CheckCircle className="w-5 h-5 text-blue-500 ml-auto" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-md mx-auto space-y-5 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                             <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                                 <div className="p-2 bg-slate-50 rounded-lg">{selectedProvider?.icon}</div>
                                 <div>
                                     <div className="font-bold text-slate-800">{selectedProvider?.name}</div>
                                     <div className="text-xs text-slate-500">兼容 OpenAI 协议</div>
                                 </div>
                             </div>

                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">模型名称 (Model Name)</label>
                                 <input 
                                    type="text" 
                                    value={aiForm.name}
                                    onChange={(e) => setAiForm({...aiForm, name: e.target.value})}
                                    placeholder="例如: gpt-4-turbo, deepseek-chat"
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                                    autoFocus
                                 />
                                 <p className="text-[10px] text-slate-400 mt-1">请填写对应平台支持的真实模型标识符</p>
                             </div>

                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">API Key</label>
                                 <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="password" 
                                        value={aiForm.apiKey}
                                        onChange={(e) => setAiForm({...aiForm, apiKey: e.target.value})}
                                        placeholder="sk-........................"
                                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                                    />
                                 </div>
                             </div>

                             <div>
                                 <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">Base URL (API 地址)</label>
                                 <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                    <input 
                                        type="text" 
                                        value={aiForm.baseUrl}
                                        onChange={(e) => setAiForm({...aiForm, baseUrl: e.target.value})}
                                        placeholder="https://api.example.com/v1"
                                        className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-slate-600 bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50"
                                    />
                                 </div>
                             </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    {aiModalStep === 2 && !editingModelId && (
                        <button 
                            onClick={() => setAiModalStep(1)}
                            className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors mr-auto"
                        >
                            上一步
                        </button>
                    )}
                    <button 
                        onClick={() => setShowAiModal(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                    >
                        取消
                    </button>
                    {aiModalStep === 1 ? (
                         <button 
                            onClick={handleNext}
                            disabled={!selectedProvider}
                            className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
                        >
                            下一步
                        </button>
                    ) : (
                        <button 
                            onClick={handleSaveModel}
                            disabled={!aiForm.name || !aiForm.apiKey}
                            className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {editingModelId ? '保存修改' : '保存配置'}
                        </button>
                    )}
                </div>
            </div>
        </div>
      );
  };

  const renderUserManagement = () => (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">用户管理</h3>
                <p className="text-sm text-slate-500">管理系统用户及其访问权限</p>
            </div>
            <button 
                onClick={() => { 
                    setEditingUser(null); 
                    setUserForm({ name: '', email: '', role: 'Viewer', password: '', status: 'Active' });
                    setShowUserModal(true); 
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium"
            >
                <Plus className="w-4 h-4" /> 添加用户
            </button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex-1">
             <table className="w-full text-left text-sm">
                 <thead className="bg-slate-50 border-b border-slate-200">
                     <tr>
                         <th className="px-6 py-3 font-medium text-slate-600">用户</th>
                         <th className="px-6 py-3 font-medium text-slate-600">角色</th>
                         <th className="px-6 py-3 font-medium text-slate-600">状态</th>
                         <th className="px-6 py-3 font-medium text-slate-600">最后登录</th>
                         <th className="px-6 py-3 font-medium text-slate-600 text-right">操作</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                     {users.map(user => (
                         <tr key={user.id} className="hover:bg-slate-50 group">
                             <td className="px-6 py-4">
                                 <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                         {user.name.charAt(0)}
                                     </div>
                                     <div>
                                         <div className="font-medium text-slate-800">{user.name}</div>
                                         <div className="text-xs text-slate-500">{user.email}</div>
                                     </div>
                                 </div>
                             </td>
                             <td className="px-6 py-4">
                                 <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100 font-medium">
                                     {user.role}
                                 </span>
                             </td>
                             <td className="px-6 py-4">
                                 <div className="flex items-center gap-1.5">
                                     <div className={`w-2 h-2 rounded-full ${user.status === 'Active' ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                     <span className={user.status === 'Active' ? 'text-green-700' : 'text-slate-500'}>{user.status}</span>
                                 </div>
                             </td>
                             <td className="px-6 py-4 text-slate-500 text-xs">
                                 {user.lastLogin}
                             </td>
                             <td className="px-6 py-4 text-right">
                                 <div className="flex items-center justify-end gap-2">
                                     <button 
                                        onClick={() => {
                                            setEditingUser(user);
                                            setUserForm({ name: user.name, email: user.email, role: user.role, password: '', status: user.status });
                                            setShowUserModal(true);
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                     >
                                         <Edit2 className="w-4 h-4" />
                                     </button>
                                     <button 
                                        onClick={() => {
                                            if (confirm(`确定要删除用户 ${user.name} 吗?`)) {
                                                setUsers(prev => prev.filter(u => u.id !== user.id));
                                            }
                                        }}
                                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                     >
                                         <Trash2 className="w-4 h-4" />
                                     </button>
                                 </div>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
        </div>
    </div>
  );

  const renderRoleManagement = () => (
    <div className="p-8 h-full flex flex-col animate-in fade-in duration-300">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">角色设置</h3>
                <p className="text-sm text-slate-500">定义角色及其默认权限集</p>
            </div>
            <button 
                onClick={() => {
                    setRoleForm({ id: '', name: '', description: '' });
                    setShowRoleModal(true);
                }}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium"
            >
                <Plus className="w-4 h-4" /> 新建角色
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map(role => (
                <div key={role.id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                            <Shield className="w-6 h-6" />
                        </div>
                        <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-full">
                            {role.usersCount} 名用户
                        </div>
                    </div>
                    <h4 className="font-bold text-slate-800 text-lg mb-1">{role.name}</h4>
                    <p className="text-sm text-slate-500 mb-4 h-10 line-clamp-2">{role.description}</p>
                    
                    <div className="flex gap-2 border-t border-slate-100 pt-4">
                        <button 
                            onClick={() => {
                                setRoleForm({ id: role.id, name: role.name, description: role.description });
                                setShowRoleModal(true);
                            }}
                            className="flex-1 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded transition-colors border border-slate-200"
                        >
                            编辑信息
                        </button>
                        <button 
                            onClick={() => { setSelectedRoleForPerms(role.id); setShowPermModal(true); }}
                            className="flex-1 py-2 text-sm text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors"
                        >
                            配置权限
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );

  const renderPermissionModal = () => {
    if (!showPermModal) return null;
    const activeRole = roles.find(r => r.id === selectedRoleForPerms) || roles[0];
    
    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[900px] h-[600px] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        配置权限 - <span className="text-blue-600">{activeRole.name}</span>
                    </h3>
                    <button onClick={() => setShowPermModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Role Selector */}
                    <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
                        <div className="p-3 border-b border-slate-200 font-bold text-slate-500 text-xs uppercase tracking-wider">
                            切换角色
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {roles.map(role => (
                                <button
                                    key={role.id}
                                    onClick={() => setSelectedRoleForPerms(role.id)}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm flex justify-between items-center ${activeRole.id === role.id ? 'bg-white text-blue-700 font-medium shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}
                                >
                                    {role.name}
                                    {activeRole.id === role.id && <CheckSquare className="w-4 h-4" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Permission Tree */}
                    <div className="flex-1 bg-white flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-slate-500">功能权限列表</span>
                            </div>
                            <div className="flex gap-2">
                                    <button className="text-xs text-blue-600 hover:underline">全选</button>
                                    <span className="text-slate-300">|</span>
                                    <button className="text-xs text-blue-600 hover:underline">清空</button>
                            </div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-6">
                                {PERMISSION_TREE.map(module => (
                                    <div key={module.id} className="border border-slate-100 rounded-lg p-4">
                                        <div className="flex items-center gap-2 mb-3">
                                            <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked />
                                            <span className="font-bold text-slate-800">{module.label}</span>
                                        </div>
                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 pl-6">
                                            {module.children.map(perm => (
                                                <label key={perm.id} className="flex items-center gap-2 cursor-pointer hover:bg-slate-50 p-2 rounded transition-colors">
                                                    <input type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500" defaultChecked={Math.random() > 0.3} />
                                                    <span className="text-sm text-slate-600">{perm.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={() => setShowPermModal(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                    >
                        取消
                    </button>
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 shadow-sm transition-colors text-sm font-medium">
                        保存权限配置
                    </button>
                </div>
            </div>
        </div>
    );
  };

  // --- Add/Edit User Modal ---
  const renderUserModal = () => {
    if (!showUserModal) return null;

    const handleSaveUser = () => {
        if (!userForm.name || !userForm.email) return;

        if (editingUser) {
            setUsers(prev => prev.map(u => u.id === editingUser.id ? { 
                ...u, 
                name: userForm.name, 
                email: userForm.email, 
                role: userForm.role,
                status: userForm.status
            } : u));
        } else {
            const newUser = {
                id: Date.now().toString(),
                name: userForm.name,
                email: userForm.email,
                role: userForm.role,
                status: userForm.status,
                lastLogin: '-'
            };
            setUsers([...users, newUser]);
        }
        setShowUserModal(false);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        {editingUser ? <UserCog className="w-5 h-5 text-blue-600" /> : <Plus className="w-5 h-5 text-blue-600" />}
                        {editingUser ? '编辑用户' : '添加用户'}
                    </h3>
                    <button onClick={() => setShowUserModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">姓名</label>
                            <input 
                                type="text" 
                                value={userForm.name}
                                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                placeholder="John Doe"
                            />
                        </div>
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">状态</label>
                            <select 
                                value={userForm.status}
                                onChange={(e) => setUserForm({...userForm, status: e.target.value})}
                                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                            >
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">邮箱</label>
                        <input 
                            type="email" 
                            value={userForm.email}
                            onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            placeholder="john@example.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">角色</label>
                        <select 
                            value={userForm.role}
                            onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 bg-white"
                        >
                            {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                    </div>
                    {!editingUser && (
                         <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">初始密码</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input 
                                    type="password" 
                                    value={userForm.password}
                                    onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>
                    )}
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={() => setShowUserModal(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSaveUser}
                        disabled={!userForm.name || !userForm.email}
                        className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
                    >
                        保存用户
                    </button>
                </div>
            </div>
        </div>
    );
  };

  // --- Add/Edit Role Modal ---
  const renderRoleModal = () => {
      if (!showRoleModal) return null;

      const handleSaveRole = () => {
          if (!roleForm.name) return;

          if (roleForm.id) {
              setRoles(prev => prev.map(r => r.id === roleForm.id ? { ...r, name: roleForm.name, description: roleForm.description } : r));
          } else {
              const newRole = {
                  id: Date.now().toString(),
                  name: roleForm.name,
                  description: roleForm.description,
                  usersCount: 0,
                  permissions: []
              };
              setRoles([...roles, newRole]);
          }
          setShowRoleModal(false);
      };

      return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[60] flex items-center justify-center">
            <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] animate-in fade-in zoom-in-95 duration-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-blue-600" />
                        {roleForm.id ? '编辑角色' : '新建角色'}
                    </h3>
                    <button onClick={() => setShowRoleModal(false)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">角色名称 <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            autoFocus
                            value={roleForm.name}
                            onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                            placeholder="例如: Data Analyst"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">描述</label>
                        <textarea 
                            rows={3}
                            value={roleForm.description}
                            onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 resize-none"
                            placeholder="描述该角色的职责和权限范围..."
                        />
                    </div>
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={() => setShowRoleModal(false)}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSaveRole}
                        disabled={!roleForm.name}
                        className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors"
                    >
                        保存
                    </button>
                </div>
            </div>
        </div>
      );
  };

  return (
    <div className="flex h-full w-full bg-slate-50 overflow-hidden">
      {renderSidebar()}
      <div className="flex-1 h-full overflow-hidden bg-slate-50/50">
        {activeTab === SettingsTab.GENERAL && renderGeneralSettings()}
        {activeTab === SettingsTab.USERS && renderUserManagement()}
        {activeTab === SettingsTab.ROLES && renderRoleManagement()}
        {activeTab === SettingsTab.AI_MODELS && renderAiModelSettings()}
        {activeTab === SettingsTab.MCP_SERVER && renderMcpSettings()}
      </div>
      {renderPermissionModal()}
      {renderAiModal()}
      {renderUserModal()}
      {renderRoleModal()}
    </div>
  );
};

export default Settings;
