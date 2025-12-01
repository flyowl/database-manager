
import React, { useState, useRef, useEffect } from 'react';
import { Database, Code2, Activity, Settings, Zap, User, Sparkles, Variable, LogOut, UserCog } from 'lucide-react';
import { AppPage } from '../../types';
import UserProfileModal from '../profile/UserProfileModal';

interface TopNavProps {
  activePage: AppPage;
  onNavigate: (page: AppPage) => void;
}

const TopNav: React.FC<TopNavProps> = ({ activePage, onNavigate }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { id: AppPage.SMART_QUERY, label: '智能问数', icon: Sparkles },
    { id: AppPage.DATASOURCE, label: '数据源管理', icon: Database },
    { id: AppPage.API_MANAGER, label: '在线接口管理', icon: Code2 },
    { id: AppPage.FUNCTION_MANAGER, label: '函数管理', icon: Variable },
    { id: AppPage.LOGS, label: '日志管理', icon: Activity },
    { id: AppPage.SETTINGS, label: '系统设置', icon: Settings },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
      if(confirm("确定要退出登录吗？")) {
          console.log("Logged out");
          window.location.reload();
      }
  };

  return (
    <div className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 flex-shrink-0 text-white shadow-md z-50 relative">
      <div className="flex items-center gap-8">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate(AppPage.SMART_QUERY)}>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white fill-current" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              APISQL
            </h1>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center space-x-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${activePage === item.id 
                  ? 'bg-slate-800 text-blue-400 shadow-inner' 
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}
              `}
            >
              <item.icon className={`w-4 h-4 ${activePage === item.id ? 'animate-pulse' : ''}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4 relative" ref={dropdownRef}>
        <div className="hidden md:flex flex-col items-end mr-2 cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
            <span className="text-xs font-medium text-slate-300">Admin User</span>
            <span className="text-[10px] text-slate-500">Super Administrator</span>
        </div>
        
        <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`w-9 h-9 rounded-full bg-slate-800 border flex items-center justify-center text-slate-400 hover:text-white transition-colors cursor-pointer relative ${isDropdownOpen ? 'border-blue-500 text-white ring-2 ring-blue-500/20' : 'border-slate-700 hover:border-slate-500'}`}
        >
          <User className="w-4 h-4" />
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-slate-900 rounded-full"></div>
        </button>

        {/* Dropdown Menu */}
        {isDropdownOpen && (
            <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                    <p className="text-sm font-bold text-slate-800">Admin User</p>
                    <p className="text-xs text-slate-500 truncate">admin@example.com</p>
                </div>
                
                <div className="p-1">
                    <button 
                        onClick={() => { setIsProfileModalOpen(true); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors text-left"
                    >
                        <UserCog className="w-4 h-4" /> 个人设置
                    </button>
                    <button 
                        onClick={() => { onNavigate(AppPage.SETTINGS); setIsDropdownOpen(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-blue-600 rounded-lg transition-colors text-left"
                    >
                        <Settings className="w-4 h-4" /> 系统设置
                    </button>
                </div>
                
                <div className="h-px bg-slate-100 my-1"></div>
                
                <div className="p-1">
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                    >
                        <LogOut className="w-4 h-4" /> 退出登录
                    </button>
                </div>
            </div>
        )}
      </div>

      <UserProfileModal 
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default TopNav;
