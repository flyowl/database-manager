
import React, { useState } from 'react';
import { DatabaseTable, TableColumn } from '../../types';
import { Key, Link, Trash2, Plus, Type, FileText, Pencil, Check, X, ChevronDown, Settings2, Save } from 'lucide-react';

interface FieldManagerProps {
  table: DatabaseTable;
  onUpdateTable: (updatedTable: DatabaseTable) => void;
}

const FieldManager: React.FC<FieldManagerProps> = ({ table, onUpdateTable }) => {
  // --- Modal State ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  const [modalEditIndex, setModalEditIndex] = useState<number | null>(null);
  const [modalFieldData, setModalFieldData] = useState<TableColumn>({
    name: '', type: 'VARCHAR(100)', cnName: '', description: '', isPrimaryKey: false, isForeignKey: false
  });

  // --- Inline Edit State ---
  const [inlineEditIndex, setInlineEditIndex] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<TableColumn | null>(null);

  const SQL_TYPES = [
    'INT', 'BIGINT', 'VARCHAR(50)', 'VARCHAR(100)', 'VARCHAR(255)', 
    'TEXT', 'BOOLEAN', 'TIMESTAMP', 'DATE', 'DECIMAL', 'FLOAT', 'JSON', 'UUID'
  ];

  // --- Table Meta Handlers ---
  const handleTableNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateTable({ ...table, cnName: e.target.value });
  };

  const handleTableDescChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdateTable({ ...table, description: e.target.value });
  };

  // --- Modal Handlers ---
  const openAddModal = () => {
      setModalMode('add');
      setModalFieldData({
        name: '', type: 'VARCHAR(100)', cnName: '', description: '', isPrimaryKey: false, isForeignKey: false
      });
      setIsModalOpen(true);
  };

  const openEditModal = (index: number, e?: React.MouseEvent) => {
      e?.stopPropagation();
      setModalMode('edit');
      setModalEditIndex(index);
      setModalFieldData({ ...table.columns[index] });
      setIsModalOpen(true);
      // Ensure inline edit is closed to avoid conflicts
      setInlineEditIndex(null);
  };

  const saveModal = () => {
      if (!modalFieldData.name) return;
      
      const newCols = [...table.columns];
      if (modalMode === 'add') {
          newCols.push(modalFieldData);
      } else if (modalMode === 'edit' && modalEditIndex !== null) {
          newCols[modalEditIndex] = modalFieldData;
      }
      
      onUpdateTable({ ...table, columns: newCols });
      setIsModalOpen(false);
  };

  // --- Inline Edit Handlers ---
  const startInlineEdit = (index: number) => {
      if (inlineEditIndex !== null) return; // Prevent multiple inline edits
      setInlineEditIndex(index);
      setInlineEditData({ ...table.columns[index] });
  };

  const saveInlineEdit = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      if (inlineEditIndex !== null && inlineEditData) {
          const newCols = [...table.columns];
          newCols[inlineEditIndex] = inlineEditData;
          onUpdateTable({ ...table, columns: newCols });
          setInlineEditIndex(null);
          setInlineEditData(null);
      }
  };

  const cancelInlineEdit = (e?: React.MouseEvent) => {
      e?.stopPropagation();
      setInlineEditIndex(null);
      setInlineEditData(null);
  };

  const handleInlineChange = (field: keyof TableColumn, value: any) => {
      if (inlineEditData) {
          setInlineEditData({ ...inlineEditData, [field]: value });
      }
  };

  // --- Common Handlers ---
  const deleteColumn = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (confirm('确定要删除这个字段吗？')) {
        const newCols = table.columns.filter((_, i) => i !== index);
        onUpdateTable({ ...table, columns: newCols });
    }
  };

  const togglePK = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (inlineEditIndex === index && inlineEditData) {
        // Toggle in inline state
        setInlineEditData({ ...inlineEditData, isPrimaryKey: !inlineEditData.isPrimaryKey });
    } else {
        // Immediate toggle
        const newCols = [...table.columns];
        newCols[index] = { ...newCols[index], isPrimaryKey: !newCols[index].isPrimaryKey };
        onUpdateTable({ ...table, columns: newCols });
    }
  };

  const toggleFK = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (inlineEditIndex === index && inlineEditData) {
        // Toggle in inline state
        setInlineEditData({ ...inlineEditData, isForeignKey: !inlineEditData.isForeignKey });
    } else {
        // Immediate toggle
        const newCols = [...table.columns];
        newCols[index] = { ...newCols[index], isForeignKey: !newCols[index].isForeignKey };
        onUpdateTable({ ...table, columns: newCols });
    }
  };

  // Helper for beautified select
  const TypeSelect = ({ value, onChange, className }: { value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, className?: string }) => (
      <div className={`relative w-full ${className}`}>
          <select
              value={value}
              onChange={onChange}
              className="w-full appearance-none bg-white border border-slate-300 text-slate-700 py-1.5 pl-3 pr-8 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 transition-all cursor-pointer font-mono"
              onClick={(e) => e.stopPropagation()} 
          >
              {SQL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" />
          </div>
      </div>
  );

  return (
    <div className="p-6 h-full overflow-y-auto bg-slate-50 relative">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-blue-600">表:</span> {table.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="text" 
                placeholder="添加中文表名"
                value={table.cnName || ''}
                onChange={handleTableNameChange}
                className="text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 text-slate-600 placeholder:text-slate-300 transition-colors"
              />
              <span className="text-slate-300">|</span>
              <input 
                type="text" 
                placeholder="添加表描述/备注"
                value={table.description || ''}
                onChange={handleTableDescChange}
                className="text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none px-1 text-slate-500 placeholder:text-slate-300 min-w-[300px] transition-colors"
              />
            </div>
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded shadow-sm text-sm hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" /> 添加字段
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden pb-10">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 font-medium text-slate-600 w-48">字段名称</th>
                <th className="px-4 py-3 font-medium text-slate-600 w-32">中文名称</th>
                <th className="px-4 py-3 font-medium text-slate-600 w-44">数据类型</th>
                <th className="px-4 py-3 font-medium text-slate-600">备注说明</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-center w-12" title="Primary Key">PK</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-center w-12" title="Foreign Key">FK</th>
                <th className="px-4 py-3 font-medium text-slate-600 text-center w-28">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {table.columns.map((col, idx) => {
                const isInlineEditing = inlineEditIndex === idx;
                const data = isInlineEditing && inlineEditData ? inlineEditData : col;

                return (
                  <tr 
                    key={idx} 
                    onDoubleClick={() => startInlineEdit(idx)}
                    className={`group transition-colors ${isInlineEditing ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                  >
                    {/* Field Name */}
                    <td className="px-4 py-2.5">
                        {isInlineEditing ? (
                            <input 
                                type="text" 
                                value={data.name} 
                                onChange={(e) => handleInlineChange('name', e.target.value)}
                                className="w-full bg-white border border-blue-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-700 font-medium"
                                autoFocus
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="font-medium text-slate-700 select-none">{data.name}</span>
                        )}
                    </td>

                    {/* Chinese Name */}
                    <td className="px-4 py-2.5">
                        {isInlineEditing ? (
                            <input 
                                type="text" 
                                value={data.cnName || ''} 
                                onChange={(e) => handleInlineChange('cnName', e.target.value)}
                                className="w-full bg-white border border-blue-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-600"
                                onClick={(e) => e.stopPropagation()}
                            />
                        ) : (
                            <span className="text-slate-500 select-none">{data.cnName || '-'}</span>
                        )}
                    </td>

                    {/* Data Type (Beautified Dropdown) */}
                    <td className="px-4 py-2.5">
                        {isInlineEditing ? (
                            <TypeSelect 
                                value={data.type} 
                                onChange={(e) => handleInlineChange('type', e.target.value)} 
                            />
                        ) : (
                             <div className="flex items-center gap-2 text-slate-500 bg-slate-100 border border-slate-200 px-2 py-1 rounded w-fit text-xs font-mono select-none">
                                <Type className="w-3 h-3 text-slate-400" /> {data.type}
                            </div>
                        )}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-2.5">
                       {isInlineEditing ? (
                            <input 
                                type="text" 
                                value={data.description || ''} 
                                onChange={(e) => handleInlineChange('description', e.target.value)}
                                className="w-full bg-white border border-blue-300 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400 text-slate-500"
                                onClick={(e) => e.stopPropagation()}
                            />
                       ) : (
                            <div className="flex items-center gap-2 truncate max-w-[200px]" title={data.description}>
                                {data.description ? (
                                    <>
                                        <FileText className="w-3 h-3 text-slate-300 flex-shrink-0" />
                                        <span className="text-slate-500 truncate select-none">{data.description}</span>
                                    </>
                                ) : (
                                    <span className="text-slate-300 text-xs italic select-none">无备注</span>
                                )}
                            </div>
                       )}
                    </td>

                    {/* PK Toggle */}
                    <td className="px-4 py-2.5 text-center">
                      <button 
                        onClick={(e) => togglePK(idx, e)}
                        className={`p-1.5 rounded transition-all active:scale-95 ${data.isPrimaryKey ? 'bg-amber-100 text-amber-600 ring-1 ring-amber-200' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-400'}`}
                      >
                        <Key className="w-4 h-4" />
                      </button>
                    </td>

                    {/* FK Toggle */}
                    <td className="px-4 py-2.5 text-center">
                      <button 
                         onClick={(e) => toggleFK(idx, e)}
                         className={`p-1.5 rounded transition-all active:scale-95 ${data.isForeignKey ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-200' : 'text-slate-300 hover:bg-slate-100 hover:text-slate-400'}`}
                      >
                        <Link className="w-4 h-4" />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5 text-center">
                      {isInlineEditing ? (
                          <div className="flex items-center justify-center gap-1">
                              <button 
                                onClick={saveInlineEdit} 
                                className="p-1.5 text-white bg-green-500 hover:bg-green-600 rounded shadow-sm transition-colors" 
                                title="保存"
                              >
                                  <Check className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={cancelInlineEdit} 
                                className="p-1.5 text-slate-500 bg-white border border-slate-200 hover:bg-slate-100 rounded shadow-sm transition-colors" 
                                title="取消"
                              >
                                  <X className="w-3.5 h-3.5" />
                              </button>
                          </div>
                      ) : (
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={(e) => openEditModal(idx, e)}
                                className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="编辑字段 (弹窗)"
                              >
                                  <Settings2 className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => deleteColumn(idx, e)}
                                className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                title="删除字段"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                          </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-400 flex justify-between items-center">
             <span className="flex items-center gap-1">
                 <span className="font-bold">提示:</span> 双击行内容可直接编辑，或点击 <Settings2 className="w-3 h-3 inline"/> 打开详细编辑弹窗
             </span>
             <span>共 {table.columns.length} 个字段</span>
          </div>
        </div>
      </div>

      {/* --- Add/Edit Modal --- */}
      {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-[2px] z-50 flex items-center justify-center">
              <div className="bg-white rounded-lg shadow-2xl border border-slate-200 w-[500px] animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                      <h3 className="font-bold text-slate-700 flex items-center gap-2">
                          {modalMode === 'add' ? <Plus className="w-4 h-4 text-blue-600"/> : <Pencil className="w-4 h-4 text-blue-600"/>}
                          {modalMode === 'add' ? '添加新字段' : '编辑字段'}
                      </h3>
                      <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  
                  <div className="p-6 space-y-5">
                      {/* Row 1: Name & Type */}
                      <div className="grid grid-cols-2 gap-5">
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">字段名称 <span className="text-red-500">*</span></label>
                              <input 
                                  type="text" 
                                  autoFocus
                                  value={modalFieldData.name}
                                  onChange={(e) => setModalFieldData({...modalFieldData, name: e.target.value})}
                                  placeholder="例如: status"
                                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium"
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">数据类型</label>
                              <TypeSelect 
                                value={modalFieldData.type}
                                onChange={(e) => setModalFieldData({...modalFieldData, type: e.target.value})}
                              />
                          </div>
                      </div>

                      {/* Row 2: Chinese Name */}
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">中文名称</label>
                          <input 
                              type="text" 
                              value={modalFieldData.cnName}
                              onChange={(e) => setModalFieldData({...modalFieldData, cnName: e.target.value})}
                              placeholder="例如: 订单状态"
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all"
                          />
                      </div>

                      {/* Row 3: Description */}
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wide">备注说明</label>
                          <textarea 
                              rows={2}
                              value={modalFieldData.description}
                              onChange={(e) => setModalFieldData({...modalFieldData, description: e.target.value})}
                              placeholder="该字段的详细用途..."
                              className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all resize-none"
                          />
                      </div>

                      {/* Row 4: Toggles */}
                      <div className="flex gap-6 pt-2">
                          <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm ${modalFieldData.isPrimaryKey ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                  {modalFieldData.isPrimaryKey && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input type="checkbox" className="hidden" checked={modalFieldData.isPrimaryKey} onChange={(e) => setModalFieldData({...modalFieldData, isPrimaryKey: e.target.checked})} />
                              <div className="flex flex-col">
                                <span className="text-sm text-slate-700 group-hover:text-blue-600 font-bold">主键 (PK)</span>
                                <span className="text-[10px] text-slate-400">Primary Key</span>
                              </div>
                          </label>

                          <label className="flex items-center gap-3 cursor-pointer group p-2 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all">
                              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shadow-sm ${modalFieldData.isForeignKey ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
                                  {modalFieldData.isForeignKey && <Check className="w-3.5 h-3.5 text-white" />}
                              </div>
                              <input type="checkbox" className="hidden" checked={modalFieldData.isForeignKey} onChange={(e) => setModalFieldData({...modalFieldData, isForeignKey: e.target.checked})} />
                              <div className="flex flex-col">
                                <span className="text-sm text-slate-700 group-hover:text-blue-600 font-bold">外键 (FK)</span>
                                <span className="text-[10px] text-slate-400">Foreign Key</span>
                              </div>
                          </label>
                      </div>
                  </div>

                  {/* Footer */}
                  <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                      <button 
                          onClick={() => setIsModalOpen(false)}
                          className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
                      >
                          取消
                      </button>
                      <button 
                          onClick={saveModal}
                          disabled={!modalFieldData.name}
                          className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm disabled:opacity-50 transition-colors flex items-center gap-2"
                      >
                          {modalMode === 'add' ? <Plus className="w-4 h-4"/> : <Save className="w-4 h-4"/>}
                          {modalMode === 'add' ? '确认添加' : '保存修改'}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default FieldManager;
