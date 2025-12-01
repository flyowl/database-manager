
import React from 'react';
import { Search, Filter, Download, AlertCircle, CheckCircle, Clock, ChevronDown } from 'lucide-react';

const LogManager: React.FC = () => {
  const logs = Array.from({ length: 15 }).map((_, i) => ({
    id: `log-${i}`,
    timestamp: new Date(Date.now() - i * 60000).toLocaleString(),
    method: i % 4 === 0 ? 'POST' : 'GET',
    path: i % 4 === 0 ? '/api/v1/orders' : `/api/v1/users/${i+100}`,
    status: i % 7 === 0 ? 500 : (i % 5 === 0 ? 400 : 200),
    latency: Math.floor(Math.random() * 200) + 20,
    ip: `192.168.1.${10 + i}`
  }));

  return (
    <div className="p-6 max-w-7xl mx-auto h-full flex flex-col">
       <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">API 调用日志</h2>
          <p className="text-slate-500 text-sm mt-1">监控接口调用情况、异常及性能指标</p>
        </div>
        <div className="flex gap-2">
            <button className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm hover:bg-slate-50 flex items-center gap-2">
                <Download className="w-4 h-4" /> 导出日志
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 mb-4 flex gap-4 items-center shadow-sm">
          <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="搜索 Request ID, API 路径..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" />
          </div>
          <div className="flex gap-2">
              <div className="relative">
                  <select className="appearance-none w-full bg-white border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
                      <option>所有状态</option>
                      <option>200 OK</option>
                      <option>4xx Error</option>
                      <option>5xx Error</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <div className="relative">
                  <select className="appearance-none w-full bg-white border border-slate-200 text-slate-700 py-2 pl-3 pr-8 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all cursor-pointer">
                      <option>最近 1 小时</option>
                      <option>最近 24 小时</option>
                      <option>最近 7 天</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <button className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                  <Filter className="w-4 h-4" />
              </button>
          </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-200 rounded-xl flex-1 overflow-hidden shadow-sm flex flex-col">
          <div className="overflow-auto flex-1">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                      <tr>
                          <th className="px-6 py-3 font-medium text-slate-600">状态</th>
                          <th className="px-6 py-3 font-medium text-slate-600">方法</th>
                          <th className="px-6 py-3 font-medium text-slate-600">路径</th>
                          <th className="px-6 py-3 font-medium text-slate-600">耗时</th>
                          <th className="px-6 py-3 font-medium text-slate-600">客户端 IP</th>
                          <th className="px-6 py-3 font-medium text-slate-600 text-right">时间</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                      {logs.map(log => (
                          <tr key={log.id} className="hover:bg-slate-50 group cursor-pointer">
                              <td className="px-6 py-3">
                                  <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                      log.status === 200 ? 'bg-green-50 text-green-700 border-green-100' : 
                                      log.status >= 500 ? 'bg-red-50 text-red-700 border-red-100' : 'bg-orange-50 text-orange-700 border-orange-100'
                                  }`}>
                                      {log.status === 200 ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                      {log.status}
                                  </div>
                              </td>
                              <td className="px-6 py-3">
                                  <span className={`font-mono text-xs font-bold ${
                                      log.method === 'GET' ? 'text-blue-600' : 
                                      log.method === 'POST' ? 'text-green-600' : 
                                      log.method === 'DELETE' ? 'text-red-600' : 'text-orange-600'
                                  }`}>
                                      {log.method}
                                  </span>
                              </td>
                              <td className="px-6 py-3 font-mono text-slate-600">{log.path}</td>
                              <td className="px-6 py-3 text-slate-500">{log.latency}ms</td>
                              <td className="px-6 py-3 text-slate-500 font-mono text-xs">{log.ip}</td>
                              <td className="px-6 py-3 text-right text-slate-400 flex items-center justify-end gap-1">
                                  <Clock className="w-3 h-3" /> {log.timestamp}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
          <div className="p-3 border-t border-slate-200 bg-slate-50 flex justify-between items-center text-xs text-slate-500">
              <span>共 1245 条日志</span>
              <div className="flex gap-2">
                  <button className="px-2 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50 disabled:opacity-50" disabled>上一页</button>
                  <button className="px-2 py-1 border border-slate-200 rounded bg-white hover:bg-slate-50">下一页</button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default LogManager;
