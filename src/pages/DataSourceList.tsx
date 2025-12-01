
import React, { useState } from 'react';
import { AppPage } from '../types';
import { Plus, Database, Server, RefreshCw, ChevronRight, MoreHorizontal, ShieldCheck, X, Check, Search, HardDrive, Save, ChevronDown, LayoutGrid, Globe } from 'lucide-react';
import { MOCK_DATA_SOURCES } from '../data/mockData';

interface DataSourceListProps {
  onNavigate: (page: AppPage) => void;
}

const DB_CATEGORIES = [
    {
        id: 'relational',
        name: '关系型数据库',
        items: [
            { id: 'postgresql', name: 'PostgreSQL', type: 'SQL', color: 'bg-blue-50 text-blue-700 border-blue-100' },
            { id: 'mysql', name: 'MySQL', type: 'SQL', color: 'bg-orange-50 text-orange-700 border-orange-100' },
            { id: 'sqlserver', name: 'SQL Server', type: 'SQL', color: 'bg-red-50 text-red-700 border-red-100' },
            { id: 'oracle', name: 'Oracle', type: 'SQL', color: 'bg-red-50 text-red-900 border-red-100' },
            { id: 'mariadb', name: 'MariaDB', type: 'SQL', color: 'bg-amber-50 text-amber-700 border-amber-100' },
            { id: 'sqlite', name: 'SQLite', type: 'SQL', color: 'bg-slate-100 text-slate-700 border-slate-200' },
            { id: 'tidb', name: 'TiDB', type: 'SQL', color: 'bg-indigo-50 text-indigo-700 border-indigo-100' },
        ]
    },
    {
        id: 'nosql',
        name: 'NoSQL / 缓存',
        items: [
            { id: 'mongodb', name: 'MongoDB', type: 'NoSQL', color: 'bg-green-50 text-green-700 border-green-100' },
            { id: 'redis', name: 'Redis', type: 'NoSQL', color: 'bg-rose-50 text-rose-600 border-rose-100' },
            { id: 'elasticsearch', name: 'Elasticsearch', type: 'NoSQL', color: 'bg-yellow-50 text-yellow-700 border-yellow-100' },
            { id: 'cassandra', name: 'Cassandra', type: 'NoSQL', color: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
        ]
    },
    {
        id: 'warehouse',
        name: '大数据 / 数仓',
        items: [
            { id: 'clickhouse', name: 'ClickHouse', type: 'OLAP', color: 'bg-amber-50 text-amber-600 border-amber-100' },
            { id: 'snowflake', name: 'Snowflake', type: 'OLAP', color: 'bg-sky-50 text-sky-600 border-sky-100' },
        ]
    }
];

const DataSourceList: React.FC<DataSourceListProps> = ({ onNavigate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDb, setSelectedDb] = useState(DB_CATEGORIES[0].items[0]);
  const [formData, setFormData] = useState({
      name: '',
      host: '',
      port: '',
      user: '',
      password: '',
      database: ''
  });

  const handleOpenModal = () => {
      setFormData({ name: '', host: '', port: '', user: '', password: '', database: '' });
      setSelectedDb(DB_CATEGORIES[0].items[0]);
      setIsModalOpen(true);
  };

  const handleSave = () => {
      // In a real app, this would perform an API call
      setIsModalOpen(false);
      // alert(`Connected to ${selectedDb.name} at ${formData.host}`);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">数据源管理</h2>
          <p className="text-slate-500 text-sm mt-1">管理数据库连接，为 API 生成提供数据支持</p>
        </div>
        <button 
            onClick={handleOpenModal}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg shadow-sm transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> 新建数据源
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_DATA_SOURCES.map((source) => (
          <div 
            key={source.id} 
            className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 cursor-pointer relative overflow-hidden"
            onClick={() => onNavigate(AppPage.DATABASE_MANAGER)}
          >
            <div className="absolute top-0 right-0 p-4">
                {source.isDefault ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded-full border border-indigo-100 shadow-sm" title="默认数据库不可修改">
                        <ShieldCheck className="w-3 h-3" /> 默认
                    </span>
                ) : (
                    <button 
                        onClick={(e) => { e.stopPropagation(); }}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                )}
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 rounded-lg ${source.type === 'PostgreSQL' ? 'bg-blue-50 text-blue-600' : source.type === 'MySQL' ? 'bg-orange-50 text-orange-600' : 'bg-red-50 text-red-600'}`}>
                <Database className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-lg group-hover:text-blue-600 transition-colors">{source.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                    <span className={`inline-block w-2 h-2 rounded-full ${source.status === 'online' ? 'bg-green-500' : 'bg-slate-300'}`}></span>
                    <span className="text-xs text-slate-500 font-medium uppercase tracking-wide">{source.type}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3 mb-6">
               <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Server className="w-4 h-4 text-slate-400" />
                  <span className="truncate font-mono text-xs bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{source.host}</span>
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-500">
                  <RefreshCw className="w-4 h-4 text-slate-400" />
                  <span>已生成 API: <strong className="text-slate-800">{source.apiCount}</strong> 个</span>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-400">上次同步: 10 分钟前</span>
                <span className="flex items-center gap-1 text-sm font-medium text-blue-600 group-hover:translate-x-1 transition-transform">
                    进入数据库管理 <ChevronRight className="w-4 h-4" />
                </span>
            </div>
          </div>
        ))}

        {/* Add New Placeholder Card */}
        <button 
            onClick={handleOpenModal}
            className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center gap-4 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50/50 transition-all group min-h-[220px]"
        >
            <div className="w-12 h-12 rounded-full bg-slate-50 group-hover:bg-white flex items-center justify-center transition-colors">
                <Plus className="w-6 h-6" />
            </div>
            <span className="font-medium">连接新数据库</span>
        </button>
      </div>

      {/* New Data Source Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[950px] h-[650px] flex flex-col animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          <HardDrive className="w-5 h-5 text-blue-600" />
                          新建数据源连接
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>

                  <div className="flex flex-1 overflow-hidden">
                      {/* Left: DB Type Selection (Grid Layout) */}
                      <div className="w-[320px] bg-slate-50 border-r border-slate-200 flex flex-col">
                          <div className="p-4 border-b border-slate-200">
                             <div className="relative">
                                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                 <input type="text" placeholder="搜索数据库类型..." className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:border-blue-500 transition-all" />
                             </div>
                          </div>
                          <div className="flex-1 overflow-y-auto p-4 space-y-6">
                              {DB_CATEGORIES.map(category => (
                                  <div key={category.id}>
                                      <div className="text-xs font-bold text-slate-400 uppercase mb-3 px-1 flex items-center gap-2">
                                          {category.id === 'relational' ? <Database className="w-3 h-3" /> : (category.id === 'nosql' ? <Server className="w-3 h-3" /> : <Globe className="w-3 h-3" />)}
                                          {category.name}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                          {category.items.map(db => (
                                              <button
                                                  key={db.id}
                                                  onClick={() => setSelectedDb(db)}
                                                  className={`flex flex-col items-center justify-center gap-2 p-3 rounded-lg border transition-all hover:shadow-md
                                                      ${selectedDb.id === db.id 
                                                          ? 'bg-white border-blue-500 ring-1 ring-blue-500 shadow-sm' 
                                                          : 'bg-white border-slate-200 hover:border-blue-300'
                                                      }
                                                  `}
                                              >
                                                  <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-[10px] border ${db.color}`}>
                                                      {db.type === 'SQL' ? 'SQL' : db.type === 'NoSQL' ? 'NoSQL' : 'OLAP'}
                                                  </div>
                                                  <span className={`text-xs font-medium ${selectedDb.id === db.id ? 'text-blue-700' : 'text-slate-700'}`}>
                                                      {db.name}
                                                  </span>
                                                  {selectedDb.id === db.id && <div className="absolute top-2 right-2 text-blue-500"><Check className="w-3 h-3" /></div>}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      {/* Right: Connection Form */}
                      <div className="flex-1 p-8 overflow-y-auto bg-white flex flex-col">
                          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm border ${selectedDb.color}`}>
                                  {selectedDb.type === 'SQL' ? 'SQL' : selectedDb.type === 'NoSQL' ? 'NoSQL' : 'OLAP'}
                              </div>
                              <div>
                                  <h4 className="font-bold text-xl text-slate-800">配置 {selectedDb.name}</h4>
                                  <p className="text-sm text-slate-500 mt-1">请输入数据库连接详情以建立连接</p>
                              </div>
                          </div>

                          <div className="space-y-5 max-w-lg">
                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">连接名称 <span className="text-red-500">*</span></label>
                                  <input 
                                      type="text" 
                                      value={formData.name}
                                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                                      placeholder={`例如: My ${selectedDb.name} Prod`}
                                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                                  />
                              </div>

                              <div className="grid grid-cols-3 gap-5">
                                  <div className="col-span-2">
                                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">主机地址 (Host) <span className="text-red-500">*</span></label>
                                      <input 
                                          type="text" 
                                          value={formData.host}
                                          onChange={(e) => setFormData({...formData, host: e.target.value})}
                                          placeholder="127.0.0.1"
                                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">端口 (Port) <span className="text-red-500">*</span></label>
                                      <input 
                                          type="text" 
                                          value={formData.port}
                                          onChange={(e) => setFormData({...formData, port: e.target.value})}
                                          placeholder="5432"
                                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                      />
                                  </div>
                              </div>

                              <div>
                                  <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">数据库名称 (Database)</label>
                                  <input 
                                      type="text" 
                                      value={formData.database}
                                      onChange={(e) => setFormData({...formData, database: e.target.value})}
                                      placeholder="postgres"
                                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-mono"
                                  />
                              </div>

                              <div className="grid grid-cols-2 gap-5">
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">用户名 (User) <span className="text-red-500">*</span></label>
                                      <input 
                                          type="text" 
                                          value={formData.user}
                                          onChange={(e) => setFormData({...formData, user: e.target.value})}
                                          placeholder="admin"
                                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                      />
                                  </div>
                                  <div>
                                      <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">密码 (Password) <span className="text-red-500">*</span></label>
                                      <input 
                                          type="password" 
                                          value={formData.password}
                                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                                          placeholder="••••••••"
                                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all"
                                      />
                                  </div>
                              </div>
                              
                              <div className="pt-4">
                                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors p-2 hover:bg-blue-50 rounded -ml-2">
                                     <LayoutGrid className="w-4 h-4" />
                                     配置高级选项 (SSH Tunnel, SSL, Timeout)
                                     <ChevronDown className="w-3 h-3" />
                                 </button>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                      <button className="text-sm font-medium text-slate-600 hover:text-slate-900 px-4 py-2 border border-slate-200 hover:bg-white rounded-lg transition-colors flex items-center gap-2">
                          <RefreshCw className="w-4 h-4" /> 测试连接
                      </button>
                      <div className="flex gap-3">
                          <button 
                              onClick={() => setIsModalOpen(false)}
                              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                          >
                              取消
                          </button>
                          <button 
                              onClick={handleSave}
                              disabled={!formData.name || !formData.host}
                              className="px-6 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                          >
                              <Save className="w-4 h-4" />
                              保存并连接
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default DataSourceList;
