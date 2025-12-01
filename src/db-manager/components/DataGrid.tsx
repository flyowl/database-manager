
import React from 'react';
import { QueryResult } from '../../types';
import { ChevronLeft, ChevronRight, Download, ChevronDown } from 'lucide-react';

interface DataGridProps {
  result: QueryResult | null;
  isLoading: boolean;
}

const DataGrid: React.FC<DataGridProps> = ({ result, isLoading }) => {
  
  const handleExportCSV = () => {
    if (!result || !result.data.length) return;

    const headers = result.columns.join(',');
    const rows = result.data.map(row => 
      result.columns.map(col => {
        const val = row[col];
        // Handle strings with commas or quotes
        if (typeof val === 'string') {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      }).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `query_result_${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-sm text-slate-500">正在查询数据...</span>
        </div>
      </div>
    );
  }

  if (!result || result.data.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white">
        <div className="p-4 bg-slate-50 rounded-full mb-3">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
        </div>
        <p>暂无数据</p>
        <p className="text-xs mt-1">运行查询或在左侧选择表以查看内容</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-t border-slate-200">
      {/* Header Info */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-500">
        <div>
           {result.data.length} 行数据 (耗时 {result.executionTime}ms)
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-1 hover:text-blue-600 transition-colors font-medium text-slate-600"
        >
            <Download className="w-3.5 h-3.5" /> 导出 CSV
        </button>
      </div>

      {/* Table Wrapper */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm text-left">
          <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="px-4 py-2 border-b border-r border-slate-200 font-medium text-slate-600 w-12 text-center bg-slate-50">#</th>
              {result.columns.map((col) => (
                <th key={col} className="px-4 py-2 border-b border-r border-slate-200 font-medium text-slate-600 whitespace-nowrap bg-slate-50">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.data.map((row, idx) => (
              <tr key={idx} className="hover:bg-blue-50/50 group">
                <td className="px-4 py-1.5 border-b border-r border-slate-100 text-slate-400 text-xs text-center">{idx + 1}</td>
                {result.columns.map((col) => (
                  <td key={`${idx}-${col}`} className="px-4 py-1.5 border-b border-r border-slate-100 text-slate-700 whitespace-nowrap">
                    {row[col]?.toString() ?? <span className="text-slate-300 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-2 border-t border-slate-200 bg-white flex items-center justify-end gap-3">
        <div className="relative">
          <select className="appearance-none text-xs border border-slate-200 rounded px-3 py-1.5 bg-white text-slate-600 focus:outline-none focus:border-blue-500 pr-8 hover:bg-slate-50 transition-colors cursor-pointer focus:ring-2 focus:ring-blue-100">
              <option>20 条/页</option>
              <option>50 条/页</option>
              <option>100 条/页</option>
          </select>
          <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        
        <span className="text-xs text-slate-500">第 1 页 / 共 5 页</span>
        
        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-50 text-slate-500 transition-colors" disabled>
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button className="p-1.5 rounded hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataGrid;
