
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  BarChart2, LineChart as LineIcon, PieChart as PieIcon, Activity, 
  Table as TableIcon, FileCode, Download, Maximize2, Minimize2, 
  X, Image as ImageIcon, FileSpreadsheet, AlertCircle
} from 'lucide-react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell 
} from 'recharts';

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: any[];
  xAxisKey: string;
  series: Array<{
    dataKey: string;
    name: string;
    color?: string;
  }>;
  sql?: string;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export const SmartChartWidget: React.FC<{ config: ChartConfig }> = ({ config: initialConfig }) => {
  const [config, setConfig] = useState(initialConfig);
  const [viewMode, setViewMode] = useState<'chart' | 'table' | 'sql'>('chart');
  const [isExpanded, setIsExpanded] = useState(false);
  const [chartType, setChartType] = useState(initialConfig.type || 'bar');
  const [showExportMenu, setShowExportMenu] = useState(false);
  
  const chartContainerRef = useRef<HTMLDivElement>(null);

  // Sync internal type if config updates and Auto-Detect Series
  useEffect(() => {
    let newConfig = { ...initialConfig };

    // Auto-generate series if missing
    if ((!newConfig.series || newConfig.series.length === 0) && newConfig.data && newConfig.data.length > 0) {
        const firstRow = newConfig.data[0];
        // Exclude xAxisKey from series candidates
        const keys = Object.keys(firstRow).filter(k => k !== newConfig.xAxisKey);
        
        // Simple heuristic: try to pick numeric keys for series
        const numericKeys = keys.filter(k => {
            const val = firstRow[k];
            return typeof val === 'number' || (!isNaN(parseFloat(val)) && isFinite(val));
        });
        
        const finalKeys = numericKeys.length > 0 ? numericKeys : keys;

        newConfig.series = finalKeys.map((k, idx) => ({
            dataKey: k,
            name: k,
            color: COLORS[idx % COLORS.length]
        }));
    }

    setChartType(newConfig.type || 'bar');
    setConfig(newConfig);
  }, [initialConfig]);

  const toggleExpand = () => setIsExpanded(!isExpanded);

  const handleExportCSV = () => {
    if (!config.data || !config.data.length) return;
    const headers = Object.keys(config.data[0]).join(',');
    const rows = config.data.map(row => 
        Object.values(row).map(v => 
            typeof v === 'string' ? `"${v.replace(/"/g, '""')}"` : v
        ).join(',')
    ).join('\n');

    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${config.title || 'chart_data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const renderChart = () => {
    if (!config.data || config.data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-sm">暂无数据可用于绘图</span>
            </div>
        );
    }

    const seriesToRender = config.series || [];
    if (seriesToRender.length === 0) {
         // Fallback if series is still missing (should be caught by effect, but as safety)
         const firstRow = config.data[0];
         const fallbackKeys = Object.keys(firstRow).filter(k => k !== config.xAxisKey);
         if(fallbackKeys.length === 0) {
             return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <AlertCircle className="w-8 h-8 mb-2 opacity-50" />
                    <span className="text-sm">无法解析图表数据系列 (Series)</span>
                </div>
            );
         }
    }

    // Ensure we have something to render if series state is empty but keys exist
    const activeSeries = seriesToRender.length > 0 ? seriesToRender : 
        Object.keys(config.data[0]).filter(k => k !== config.xAxisKey).map((k, i) => ({ dataKey: k, name: k, color: COLORS[i % COLORS.length] }));

    const CommonAxis = [
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" key="grid" />,
        <XAxis 
            dataKey={config.xAxisKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 12, fill: '#64748b'}} 
            dy={10}
            key="xaxis"
        />,
        <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 12, fill: '#64748b'}} 
            key="yaxis"
        />,
        <Tooltip 
            contentStyle={{backgroundColor: 'white', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
            itemStyle={{fontSize: '12px', color: '#334155'}}
            labelStyle={{fontWeight: 'bold', color: '#0f172a', marginBottom: '4px'}}
            cursor={{fill: '#f1f5f9'}}
            key="tooltip"
        />,
        <Legend wrapperStyle={{paddingTop: '20px'}} iconType="circle" key="legend" />
    ];

    return (
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        {chartType === 'line' ? (
          <LineChart data={config.data} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
            {CommonAxis}
            {activeSeries.map((s, i) => (
              <Line 
                key={s.dataKey}
                type="monotone" 
                dataKey={s.dataKey} 
                name={s.name}
                stroke={s.color || COLORS[i % COLORS.length]} 
                strokeWidth={3}
                dot={{r: 4, fill: 'white', strokeWidth: 2}}
                activeDot={{r: 6}}
              />
            ))}
          </LineChart>
        ) : chartType === 'area' ? (
          <AreaChart data={config.data} margin={{top: 10, right: 30, left: 0, bottom: 0}}>
            {CommonAxis}
            {activeSeries.map((s, i) => (
              <Area 
                key={s.dataKey}
                type="monotone" 
                dataKey={s.dataKey} 
                name={s.name}
                stroke={s.color || COLORS[i % COLORS.length]} 
                fill={s.color || COLORS[i % COLORS.length]} 
                fillOpacity={0.2}
              />
            ))}
          </AreaChart>
        ) : chartType === 'pie' ? (
          <PieChart>
             <Tooltip />
             <Legend />
             <Pie
              data={config.data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              paddingAngle={5}
              dataKey={activeSeries[0].dataKey}
              nameKey={config.xAxisKey}
            >
              {config.data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        ) : (
          <BarChart data={config.data} margin={{top: 10, right: 30, left: 0, bottom: 0}} barSize={32}>
            {CommonAxis}
            {activeSeries.map((s, i) => (
              <Bar 
                key={s.dataKey}
                dataKey={s.dataKey} 
                name={s.name}
                fill={s.color || COLORS[i % COLORS.length]} 
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        )}
      </ResponsiveContainer>
    );
  };

  // Fixed Style for Expanded Mode
  const expandedStyle: React.CSSProperties = isExpanded ? {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    margin: 0,
    borderRadius: 0,
  } : {};

  return (
    <>
      {isExpanded && <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" onClick={toggleExpand} />}
      <div 
        ref={chartContainerRef}
        // Added font-sans and whitespace-normal to reset inherited <pre> styles from markdown
        // Added w-full to ensure it takes up width
        className={`bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col transition-all duration-300 my-4 font-sans whitespace-normal w-full ${isExpanded ? 'h-screen' : 'h-[400px]'}`}
        style={expandedStyle}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                {chartType === 'bar' && <BarChart2 className="w-5 h-5" />}
                {chartType === 'line' && <LineIcon className="w-5 h-5" />}
                {chartType === 'pie' && <PieIcon className="w-5 h-5" />}
                {chartType === 'area' && <Activity className="w-5 h-5" />}
             </div>
             <div>
               <h3 className="font-bold text-slate-800 text-sm">{config.title || '数据分析图表'}</h3>
               <p className="text-[10px] text-slate-500">
                  {viewMode === 'chart' ? '可视化视图' : viewMode === 'table' ? '数据明细' : 'SQL 查询'}
               </p>
             </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-lg mr-2">
                <button 
                  onClick={() => setViewMode('chart')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'chart' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="图表视图"
                >
                    <BarChart2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-md transition-all ${viewMode === 'table' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  title="表格视图"
                >
                    <TableIcon className="w-4 h-4" />
                </button>
                {config.sql && (
                  <button 
                    onClick={() => setViewMode('sql')}
                    className={`p-1.5 rounded-md transition-all ${viewMode === 'sql' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                    title="查看 SQL"
                  >
                      <FileCode className="w-4 h-4" />
                  </button>
                )}
            </div>

            {/* Chart Type Switcher (only in chart mode) */}
            {viewMode === 'chart' && (
              <div className="flex items-center gap-1 border-r border-slate-200 pr-3 mr-1">
                 <button onClick={() => setChartType('bar')} className={`p-1.5 rounded hover:bg-slate-100 ${chartType === 'bar' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><BarChart2 className="w-4 h-4" /></button>
                 <button onClick={() => setChartType('line')} className={`p-1.5 rounded hover:bg-slate-100 ${chartType === 'line' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><LineIcon className="w-4 h-4" /></button>
                 <button onClick={() => setChartType('pie')} className={`p-1.5 rounded hover:bg-slate-100 ${chartType === 'pie' ? 'text-blue-600 bg-blue-50' : 'text-slate-400'}`}><PieIcon className="w-4 h-4" /></button>
              </div>
            )}

            {/* Actions */}
            <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <Download className="w-4 h-4" />
                </button>
                {showExportMenu && (
                    <div className="absolute right-0 top-full mt-2 w-32 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1">
                        <button onClick={handleExportCSV} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 text-left">
                            <FileSpreadsheet className="w-3.5 h-3.5" /> 导出 CSV
                        </button>
                        <button onClick={() => alert('暂不支持图片导出')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-600 hover:bg-slate-50 text-left">
                            <ImageIcon className="w-3.5 h-3.5" /> 导出 PNG
                        </button>
                    </div>
                )}
            </div>

            <button 
              onClick={toggleExpand}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            {isExpanded && (
               <button onClick={toggleExpand} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
               </button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
           {viewMode === 'chart' && (
               <div className="absolute inset-0 p-4">
                   {renderChart()}
               </div>
           )}

           {viewMode === 'table' && (
               <div className="h-full overflow-auto p-0">
                  <table className="w-full text-left text-sm border-collapse">
                     <thead className="bg-slate-50 sticky top-0 shadow-sm z-10">
                        <tr>
                            {config.data && config.data.length > 0 && Object.keys(config.data[0]).map(key => (
                                <th key={key} className="px-4 py-3 font-medium text-slate-600 border-b border-slate-200 whitespace-nowrap">{key}</th>
                            ))}
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {config.data?.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                                {Object.values(row).map((val: any, j) => (
                                    <td key={j} className="px-4 py-2.5 text-slate-700 whitespace-nowrap">{val}</td>
                                ))}
                            </tr>
                        ))}
                     </tbody>
                  </table>
               </div>
           )}

           {viewMode === 'sql' && (
               <div className="h-full overflow-auto p-4 bg-slate-900">
                   <pre className="font-mono text-xs text-green-400 whitespace-pre-wrap leading-relaxed">
                       {config.sql}
                   </pre>
               </div>
           )}
        </div>
      </div>
    </>
  );
};
