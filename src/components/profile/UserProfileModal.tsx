
import React, { useState } from 'react';
import { X, Save, User, Camera, Lock, Mail, Shield } from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'Super Administrator',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  if (!isOpen) return null;

  const handleSave = () => {
    // Mock save logic
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[100] flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-[500px] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            个人设置
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
            {/* Avatar */}
            <div className="flex flex-col items-center">
                <div className="relative group cursor-pointer">
                    <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-2xl font-bold border-4 border-slate-100 shadow-md">
                        <User className="w-10 h-10" />
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-white" />
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-2">点击更换头像</p>
            </div>

            {/* Basic Info */}
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">显示名称</label>
                    <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">邮箱地址</label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="email" 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">当前角色</label>
                    <div className="relative">
                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            value={formData.role}
                            disabled
                            className="w-full pl-9 pr-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-sm text-slate-500 cursor-not-allowed"
                        />
                    </div>
                </div>
            </div>

            {/* Password Section */}
            <div className="border-t border-slate-100 pt-4">
                <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-slate-400" /> 修改密码
                </h4>
                <div className="space-y-3">
                    <input 
                        type="password" 
                        placeholder="当前密码"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input 
                            type="password" 
                            placeholder="新密码"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                         <input 
                            type="password" 
                            placeholder="确认新密码"
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                    </div>
                </div>
            </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded transition-colors"
            >
                取消
            </button>
            <button 
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2"
            >
                <Save className="w-4 h-4" />
                保存修改
            </button>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
