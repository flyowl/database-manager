
import React, { useState, useEffect, useRef } from 'react';
import { 
    Layout, 
    Server, 
    Network, 
    Plus, 
    Trash2, 
    Box, 
    HardDrive, 
    Activity, 
    MoreVertical,
    FileText,
    Monitor,
    AlertCircle,
    CheckCircle,
    Construction,
    ChevronDown,
    ChevronRight,
    Folder,
    FolderOpen,
    Settings,
    Edit2,
    FolderPlus,
    Terminal,
    Globe,
    Shield,
    BarChart2,
    PieChart,
    AlertTriangle,
    Users,
    Cloud,
    Lock,
    Zap,
    Cpu
} from 'lucide-react';
import CustomPageBuilder from './ops/CustomPageBuilder';

// --- Types & Mock Data ---

// Define available icons for selection
const AVAILABLE_ICONS = [
    { name: 'Layout', icon: Layout },
    { name: 'Server', icon: Server },
    { name: 'Activity', icon: Activity },
    { name: 'Terminal', icon: Terminal },
    { name: 'Database', icon: Box }, // Using Box as generic DB/Container representation if Database exists use it
    { name: 'Globe', icon: Globe },
    { name: 'Shield', icon: Shield },
    { name: 'BarChart', icon: BarChart2 },
    { name: 'PieChart', icon: PieChart },
    { name: 'FileText', icon: FileText },
    { name: 'Alert', icon: AlertTriangle },
    { name: 'Users', icon: Users },
    { name: 'Cloud', icon: Cloud },
    { name: 'Lock', icon: Lock },
    { name: 'Zap', icon: Zap },
    { name: 'Cpu', icon: Cpu },
];

interface ResourceMetric {
    total: number;
    used: number;
    unit: string;
}

interface PhysicalServer {
    id: string;
    name: string;
    ip: string;
    rack: string;
    u_pos: string;
    status: 'online' | 'offline' | 'maintenance';
    cpu: string;
    ram: string;
}

interface VirtualMachine {
    id: string;
    name: string;
    host_ip: string;
    os: string;
    vcpu: number;
    vram: string;
    status: 'running' | 'stopped';
}

interface StorageVolume {
    id: string;
    name: string;
    type: 'SAN' | 'NAS' | 'Local';
    capacity: string;
    used: string;
    iops: number;
}

// Tree Data Structure for Business
interface BusinessNode {
    id: string;
    name: string;
    type: 'dept' | 'biz';
    children?: BusinessNode[];
    status?: 'healthy' | 'warning' | 'critical'; // For business systems
}

// New Data Structure for Custom Navigation
interface CustomNode {
    id: string;
    name: string;
    type: 'page' | 'folder';
    parentId?: string;
    isOpen?: boolean;
    icon?: string; // Icon name from AVAILABLE_ICONS
}

const MOCK_BIZ_TREE: BusinessNode[] = [
    {
        id: 'dept-1', name: '电商业务部', type: 'dept', children: [
            { id: 'biz-1', name: '核心交易系统', type: 'biz', status: 'healthy' },
            { id: 'biz-2', name: '会员中心', type: 'biz', status: 'warning' },
            { id: 'biz-3', name: '营销活动平台', type: 'biz', status: 'healthy' },
        ]
    },
    {
        id: 'dept-2', name: '基础架构部', type: 'dept', children: [
            { id: 'biz-4', name: '监控平台', type: 'biz', status: 'healthy' },
            { id: 'biz-5', name: '日志服务', type: 'biz', status: 'critical' },
            { id: 'biz-6', name: 'CI/CD 流水线', type: 'biz', status: 'healthy' },
        ]
    },
    {
        id: 'dept-3', name: '大数据部', type: 'dept', children: [
            { id: 'biz-7', name: '数据仓库', type: 'biz', status: 'healthy' },
            { id: 'biz-8', name: '实时计算', type: 'biz', status: 'warning' },
        ]
    }
];

const MOCK_SERVERS: PhysicalServer[] = [
    { id: 'srv-01', name: 'DB-Master-01', ip: '10.0.1.10', rack: 'A01', u_pos: '12U', status: 'online', cpu: '2x Intel Xeon Gold 6248R', ram: '512GB' },
    { id: 'srv-02', name: 'DB-Slave-01', ip: '10.0.1.11', rack: 'A01', u_pos: '14U', status: 'online', cpu: '2x Intel Xeon Gold 6248R', ram: '512GB' },
    { id: 'srv-03', name: 'App-Node-01', ip: '10.0.1.20', rack: 'B02', u_pos: '08U', status: 'maintenance', cpu: '2x AMD EPYC 7763', ram: '256GB' },
    { id: 'srv-04', name: 'App-Node-02', ip: '10.0.1.21', rack: 'B02', u_pos: '10U', status: 'online', cpu: '2x AMD EPYC 7763', ram: '256GB' },
];

const MOCK_VMS: VirtualMachine[] = [
    { id: 'vm-101', name: 'k8s-master-01', host_ip: '10.0.1.20', os: 'Ubuntu 22.04', vcpu: 8, vram: '32GB', status: 'running' },
    { id: 'vm-102', name: 'k8s-worker-01', host_ip: '10.0.1.20', os: 'Ubuntu 22.04', vcpu: 16, vram: '64GB', status: 'running' },
    { id: 'vm-103', name: 'k8s-worker-02', host_ip: '10.0.1.21', os: 'Ubuntu 22.04', vcpu: 16, vram: '64GB', status: 'running' },
    { id: 'vm-104', name: 'redis-cluster-01', host_ip: '10.0.1.21', os: 'CentOS 7.9', vcpu: 4, vram: '16GB', status: 'stopped' },
];

const MOCK_STORAGE: StorageVolume[] = [
    { id: 'vol-01', name: 'DB-Data-Vol', type: 'SAN', capacity: '10TB', used: '6.5TB', iops: 15000 },
    { id: 'vol-02', name: 'App-Logs-Vol', type: 'NAS', capacity: '50TB', used: '12TB', iops: 5000 },
    { id: 'vol-03', name: 'Backup-Vol', type: 'NAS', capacity: '100TB', used: '85TB', iops: 2000 },
];

const OpsManager: React.FC = () => {
    // Navigation State
    const [activeNav, setActiveNav] = useState('business-module');
    
    // Custom Nodes State (Folders + Pages)
    const [customNodes, setCustomNodes] = useState<CustomNode[]>([
        { id: 'folder-demo', name: '日常监控', type: 'folder', isOpen: true, icon: 'Activity' },
        { id: 'custom-1', name: '巡检大盘', type: 'page', parentId: 'folder-demo', icon: 'BarChart' },
        { id: 'custom-2', name: '值班排班表', type: 'page', icon: 'Users' }
    ]);
    
    // Store HTML content for each custom page
    const [customPagesContent, setCustomPagesContent] = useState<Record<string, string>>({});

    // UI States
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);
    const [activeItemDropdownId, setActiveItemDropdownId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const addMenuRef = useRef<HTMLDivElement>(null);

    // Modal State
    const [modalConfig, setModalConfig] = useState<{
        isOpen: boolean;
        type: 'createPage' | 'createFolder' | 'edit';
        targetId?: string; 
        initialName?: string;
        initialParentId?: string;
        initialIcon?: string;
    }>({ isOpen: false, type: 'createPage' });

    const [formName, setFormName] = useState('');
    const [formParentId, setFormParentId] = useState<string>('');
    const [formIcon, setFormIcon] = useState<string>('');

    // Business Module Tree State
    const [selectedBusinessId, setSelectedBusinessId] = useState<string>('biz-1');
    const [expandedDepts, setExpandedDepts] = useState<string[]>(['dept-1', 'dept-2', 'dept-3']);

    // Content State
    const [activeMainTab, setActiveMainTab] = useState<'details' | 'topology'>('details');
    const [activeDetailSubTab, setActiveDetailSubTab] = useState<'server' | 'vm' | 'storage'>('server');

    // Click outside handler
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setActiveItemDropdownId(null);
            }
            if (addMenuRef.current && !addMenuRef.current.contains(event.target as Node)) {
                setIsAddMenuOpen(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // --- Handlers ---

    const openModal = (type: 'createPage' | 'createFolder' | 'edit', node?: CustomNode) => {
        setModalConfig({
            isOpen: true,
            type,
            targetId: node?.id,
            initialName: node?.name,
            initialParentId: node?.parentId,
            initialIcon: node?.icon
        });
        setFormName(node?.name || '');
        setFormParentId(node?.parentId || '');
        setFormIcon(node?.icon || '');
        setIsAddMenuOpen(false);
        setActiveItemDropdownId(null);
    };

    const handleModalSubmit = () => {
        if (!formName.trim()) return;

        if (modalConfig.type === 'createPage' || modalConfig.type === 'createFolder') {
            const newNode: CustomNode = {
                id: `${modalConfig.type === 'createFolder' ? 'folder' : 'custom'}-${Date.now()}`,
                name: formName,
                type: modalConfig.type === 'createFolder' ? 'folder' : 'page',
                parentId: formParentId || undefined,
                isOpen: true,
                icon: formIcon || undefined
            };
            setCustomNodes([...customNodes, newNode]);
            if (newNode.type === 'page') setActiveNav(newNode.id);
        } else if (modalConfig.type === 'edit' && modalConfig.targetId) {
            setCustomNodes(prev => prev.map(n => n.id === modalConfig.targetId ? {
                ...n,
                name: formName,
                parentId: formParentId || undefined,
                icon: formIcon || undefined
            } : n));
        }
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const handleDelete = (id: string) => {
        if (confirm('确认删除此项吗？如果是目录，其下所有内容也将被删除。')) {
            const idsToDelete = new Set([id]);
            // Find all children recursively (simple depth)
            customNodes.forEach(n => { if (n.parentId === id) idsToDelete.add(n.id); });
            
            setCustomNodes(prev => prev.filter(n => !idsToDelete.has(n.id)));
            
            // Clean up content
            const newContent = { ...customPagesContent };
            idsToDelete.forEach(i => delete newContent[i]);
            setCustomPagesContent(newContent);
            
            if (activeNav === id || idsToDelete.has(activeNav)) setActiveNav('business-module');
        }
        setActiveItemDropdownId(null);
    };

    const handleSaveCustomPage = (pageId: string, html: string) => {
        setCustomPagesContent(prev => ({
            ...prev,
            [pageId]: html
        }));
    };

    const toggleDept = (id: string) => {
        setExpandedDepts(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]);
    };

    const toggleCustomFolder = (id: string) => {
        setCustomNodes(prev => prev.map(n => n.id === id ? { ...n, isOpen: !n.isOpen } : n));
    };

    // --- Render Helpers ---

    const renderCustomIcon = (iconName?: string, className?: string) => {
        if (!iconName) return null;
        const iconData = AVAILABLE_ICONS.find(i => i.name === iconName);
        const Icon = iconData ? iconData.icon : null;
        if (!Icon) return null;
        return <Icon className={className} />;
    };

    const renderStatusBadge = (status: string) => {
        const styles = {
            online: 'bg-green-100 text-green-700 border-green-200',
            running: 'bg-green-100 text-green-700 border-green-200',
            offline: 'bg-red-100 text-red-700 border-red-200',
            stopped: 'bg-slate-100 text-slate-600 border-slate-200',
            maintenance: 'bg-amber-100 text-amber-700 border-amber-200',
        }[status] || 'bg-slate-100 text-slate-600';

        return (
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${styles} flex items-center gap-1 w-fit`}>
                <span className={`w-1.5 h-1.5 rounded-full ${status === 'online' || status === 'running' ? 'bg-green-500' : status === 'maintenance' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                {status.toUpperCase()}
            </span>
        );
    };

    const renderProgressBar = (value: number, colorClass: string) => (
        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div className={`h-full ${colorClass} transition-all duration-500`} style={{ width: `${value}%` }}></div>
        </div>
    );

    const renderCustomNavTree = (parentId?: string, depth = 0) => {
        const nodes = customNodes.filter(n => n.parentId === parentId);
        
        return nodes.map(node => {
            const hasCustomIcon = !!node.icon;
            
            return (
            <div key={node.id}>
                <div 
                    className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all mb-0.5 ${
                        activeNav === node.id 
                        ? 'bg-slate-800 text-white' 
                        : 'hover:bg-slate-800/50 hover:text-slate-200 text-slate-400'
                    }`}
                    style={{ paddingLeft: `${depth * 12 + 12}px` }}
                    onClick={() => {
                        if (node.type === 'folder') toggleCustomFolder(node.id);
                        else setActiveNav(node.id);
                    }}
                >
                    <div className="flex items-center gap-2 overflow-hidden flex-1">
                        {node.type === 'folder' ? (
                            <span className="text-slate-500 group-hover:text-slate-300 transition-colors">
                                {node.isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </span>
                        ) : null}
                        
                        {/* Icon Rendering Logic */}
                        {hasCustomIcon ? (
                            // Render custom icon
                            <div className={`${activeNav === node.id ? 'text-blue-400' : (node.type === 'folder' && node.isOpen ? 'text-blue-400' : 'text-slate-500 group-hover:text-slate-300')}`}>
                                {renderCustomIcon(node.icon, "w-3.5 h-3.5")}
                            </div>
                        ) : (
                            // Render default icon
                            node.type === 'folder' ? (
                                node.isOpen ? <FolderOpen className="w-3.5 h-3.5 text-blue-400" /> : <Folder className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
                            ) : (
                                <FileText className={`w-3.5 h-3.5 flex-shrink-0 ${activeNav === node.id ? 'text-blue-400' : 'text-slate-500'}`} />
                            )
                        )}
                        <span className="truncate">{node.name}</span>
                    </div>
                    
                    <div className="relative">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                setActiveItemDropdownId(activeItemDropdownId === node.id ? null : node.id);
                            }}
                            className={`p-1 rounded hover:bg-slate-700 transition-all ${activeItemDropdownId === node.id ? 'opacity-100 text-white' : 'opacity-0 group-hover:opacity-100 text-slate-500'}`}
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </button>
                        
                        {activeItemDropdownId === node.id && (
                            <div ref={dropdownRef} className="absolute right-0 top-full mt-1 w-28 bg-white rounded-lg shadow-xl py-1 z-50 text-slate-700 animate-in fade-in zoom-in-95 duration-100 border border-slate-200">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openModal('edit', node); }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 flex items-center gap-2 text-slate-600 hover:text-blue-600"
                                >
                                    <Edit2 className="w-3.5 h-3.5" /> 编辑设置
                                </button>
                                <div className="h-px bg-slate-100 my-0.5"></div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleDelete(node.id); }}
                                    className="w-full text-left px-3 py-2 text-xs hover:bg-red-50 text-red-600 flex items-center gap-2"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> 删除
                                </button>
                            </div>
                        )}
                    </div>
                </div>
                {node.type === 'folder' && node.isOpen && renderCustomNavTree(node.id, depth + 1)}
            </div>
            );
        });
    };

    const renderBusinessModuleContent = () => {
        // Find selected business details
        const selectedBiz = MOCK_BIZ_TREE.flatMap(d => d.children || []).find(b => b.id === selectedBusinessId) || MOCK_BIZ_TREE[0].children![0];
        const statusColor = selectedBiz.status === 'healthy' ? 'text-green-700 bg-green-50 border-green-100' : (selectedBiz.status === 'warning' ? 'text-amber-700 bg-amber-50 border-amber-100' : 'text-red-700 bg-red-50 border-red-100');
        const statusText = selectedBiz.status === 'healthy' ? '运行正常' : (selectedBiz.status === 'warning' ? '存在告警' : '严重故障');

        return (
            <div className="flex h-full w-full bg-slate-50">
                {/* Left Tree Sidebar */}
                <div className="w-64 bg-white border-r border-slate-200 flex-shrink-0 flex flex-col h-full">
                    <div className="p-4 border-b border-slate-100 font-bold text-slate-700 text-sm flex items-center gap-2">
                        <Network className="w-4 h-4 text-blue-600" />
                        业务架构视图
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {MOCK_BIZ_TREE.map(dept => (
                            <div key={dept.id} className="mb-2">
                                <div 
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-50 rounded cursor-pointer text-slate-600 select-none group"
                                    onClick={() => toggleDept(dept.id)}
                                >
                                    <span className="text-slate-400 group-hover:text-slate-600">
                                        {expandedDepts.includes(dept.id) ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                                    </span>
                                    <Folder className="w-3.5 h-3.5 text-blue-400 fill-blue-50" />
                                    <span className="text-xs font-bold">{dept.name}</span>
                                </div>
                                {expandedDepts.includes(dept.id) && dept.children && (
                                    <div className="ml-2.5 pl-2 border-l border-slate-100 mt-1 space-y-0.5">
                                        {dept.children.map(biz => (
                                            <div 
                                                key={biz.id}
                                                onClick={() => setSelectedBusinessId(biz.id)}
                                                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-xs transition-all ${
                                                    selectedBusinessId === biz.id 
                                                    ? 'bg-indigo-50 text-indigo-700 font-medium shadow-sm' 
                                                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 truncate">
                                                    <Box className={`w-3.5 h-3.5 ${selectedBusinessId === biz.id ? 'text-indigo-500' : 'text-slate-400'}`} />
                                                    <span className="truncate">{biz.name}</span>
                                                </div>
                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                                                    biz.status === 'healthy' ? 'bg-green-500 shadow-[0_0_4px_rgba(34,197,94,0.4)]' : 
                                                    biz.status === 'warning' ? 'bg-amber-500 shadow-[0_0_4px_rgba(245,158,11,0.4)]' : 'bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.4)]'
                                                }`} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Header */}
                    <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 pt-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                                    <Box className="w-6 h-6 text-indigo-600" />
                                    {selectedBiz.name}
                                </h2>
                                <p className="text-slate-500 text-sm mt-1">ID: {selectedBiz.id} • 部门: {MOCK_BIZ_TREE.find(d => d.children?.some(c => c.id === selectedBiz.id))?.name}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className={`px-3 py-1.5 rounded-lg border text-sm font-medium flex items-center gap-2 ${statusColor}`}>
                                    <Activity className="w-4 h-4" /> {statusText}
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-1">
                            {[
                                { id: 'details', label: '业务详情', icon: FileText },
                                { id: 'topology', label: '业务拓扑', icon: Network }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveMainTab(tab.id as any)}
                                    className={`
                                        flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors
                                        ${activeMainTab === tab.id 
                                            ? 'border-indigo-600 text-indigo-600 bg-indigo-50/50 rounded-t-lg' 
                                            : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-lg'}
                                    `}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content Body */}
                    <div className="flex-1 overflow-hidden bg-slate-50 p-6 relative">
                        {activeMainTab === 'details' ? (
                            <div className="h-full flex flex-col gap-6 overflow-y-auto">
                                {/* Summary Cards */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Server className="w-3 h-3"/> 物理服务器</div>
                                        <div className="text-2xl font-bold text-slate-800">{MOCK_SERVERS.length} <span className="text-xs font-normal text-slate-400">台</span></div>
                                        <div className="mt-2 text-xs text-green-600 bg-green-50 inline-block px-1.5 py-0.5 rounded">3 Online</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Monitor className="w-3 h-3"/> 虚拟机实例</div>
                                        <div className="text-2xl font-bold text-slate-800">{MOCK_VMS.length} <span className="text-xs font-normal text-slate-400">个</span></div>
                                        <div className="mt-2 text-xs text-blue-600 bg-blue-50 inline-block px-1.5 py-0.5 rounded">CPU使用率 45%</div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><HardDrive className="w-3 h-3"/> 存储总量</div>
                                        <div className="text-2xl font-bold text-slate-800">160 <span className="text-xs font-normal text-slate-400">TB</span></div>
                                        <div className="mt-2 w-full">
                                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                                <span>Used: 103.5 TB</span>
                                                <span>64%</span>
                                            </div>
                                            {renderProgressBar(64, 'bg-indigo-500')}
                                        </div>
                                    </div>
                                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                                        <div className="text-slate-500 text-xs font-bold uppercase mb-2 flex items-center gap-2"><Activity className="w-3 h-3"/> 健康评分</div>
                                        <div className={`text-2xl font-bold ${selectedBiz.status === 'healthy' ? 'text-emerald-600' : selectedBiz.status === 'warning' ? 'text-amber-500' : 'text-red-600'}`}>
                                            {selectedBiz.status === 'healthy' ? '98' : selectedBiz.status === 'warning' ? '75' : '45'} <span className="text-xs font-normal text-slate-400">/ 100</span>
                                        </div>
                                        <div className="mt-2 text-xs text-slate-400">{selectedBiz.status === 'healthy' ? '系统运行稳定' : '存在潜在风险'}</div>
                                    </div>
                                </div>

                                {/* Detailed Tabs & Table */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col min-h-[400px]">
                                    <div className="border-b border-slate-100 flex items-center px-4 py-3 gap-2">
                                        {[
                                            { id: 'server', label: '物理服务器', icon: Server, count: MOCK_SERVERS.length },
                                            { id: 'vm', label: '虚拟机列表', icon: Monitor, count: MOCK_VMS.length },
                                            { id: 'storage', label: '存储卷概况', icon: HardDrive, count: MOCK_STORAGE.length },
                                        ].map(st => (
                                            <button
                                                key={st.id}
                                                onClick={() => setActiveDetailSubTab(st.id as any)}
                                                className={`
                                                    px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all
                                                    ${activeDetailSubTab === st.id 
                                                        ? 'bg-slate-800 text-white shadow-md' 
                                                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}
                                                `}
                                            >
                                                <st.icon className="w-3.5 h-3.5" />
                                                {st.label}
                                                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${activeDetailSubTab === st.id ? 'bg-slate-600 text-white' : 'bg-slate-200 text-slate-500'}`}>{st.count}</span>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="flex-1 overflow-auto p-0">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-50 border-b border-slate-100 text-xs text-slate-500 sticky top-0">
                                                <tr>
                                                    {activeDetailSubTab === 'server' && (
                                                        <>
                                                            <th className="px-6 py-3 font-medium">名称 / ID</th>
                                                            <th className="px-6 py-3 font-medium">IP 地址</th>
                                                            <th className="px-6 py-3 font-medium">机架位置</th>
                                                            <th className="px-6 py-3 font-medium">配置 (CPU/RAM)</th>
                                                            <th className="px-6 py-3 font-medium text-right">状态</th>
                                                        </>
                                                    )}
                                                    {activeDetailSubTab === 'vm' && (
                                                        <>
                                                            <th className="px-6 py-3 font-medium">VM 名称</th>
                                                            <th className="px-6 py-3 font-medium">宿主机 IP</th>
                                                            <th className="px-6 py-3 font-medium">操作系统</th>
                                                            <th className="px-6 py-3 font-medium">资源配额</th>
                                                            <th className="px-6 py-3 font-medium text-right">状态</th>
                                                        </>
                                                    )}
                                                    {activeDetailSubTab === 'storage' && (
                                                        <>
                                                            <th className="px-6 py-3 font-medium">卷名称</th>
                                                            <th className="px-6 py-3 font-medium">类型</th>
                                                            <th className="px-6 py-3 font-medium">容量使用率</th>
                                                            <th className="px-6 py-3 font-medium">IOPS</th>
                                                            <th className="px-6 py-3 font-medium text-right">状态</th>
                                                        </>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {activeDetailSubTab === 'server' && MOCK_SERVERS.map(srv => (
                                                    <tr key={srv.id} className="hover:bg-slate-50 group">
                                                        <td className="px-6 py-3">
                                                            <div className="font-bold text-slate-700">{srv.name}</div>
                                                            <div className="text-xs text-slate-400 font-mono">{srv.id}</div>
                                                        </td>
                                                        <td className="px-6 py-3 font-mono text-slate-600">{srv.ip}</td>
                                                        <td className="px-6 py-3 text-slate-600">{srv.rack} - {srv.u_pos}</td>
                                                        <td className="px-6 py-3 text-xs text-slate-500">
                                                            <div><span className="font-bold">CPU:</span> {srv.cpu}</div>
                                                            <div><span className="font-bold">RAM:</span> {srv.ram}</div>
                                                        </td>
                                                        <td className="px-6 py-3 flex justify-end">
                                                            {renderStatusBadge(srv.status)}
                                                        </td>
                                                    </tr>
                                                ))}

                                                {activeDetailSubTab === 'vm' && MOCK_VMS.map(vm => (
                                                    <tr key={vm.id} className="hover:bg-slate-50 group">
                                                        <td className="px-6 py-3 font-bold text-slate-700">{vm.name}</td>
                                                        <td className="px-6 py-3 font-mono text-slate-600">{vm.host_ip}</td>
                                                        <td className="px-6 py-3 flex items-center gap-2">
                                                            {vm.os.includes('Ubuntu') ? <div className="w-2 h-2 rounded-full bg-orange-500"></div> : <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                                                            {vm.os}
                                                        </td>
                                                        <td className="px-6 py-3 text-xs font-mono text-slate-500 bg-slate-50 w-fit rounded p-1">
                                                            {vm.vcpu} vCPU / {vm.vram}
                                                        </td>
                                                        <td className="px-6 py-3 flex justify-end">
                                                            {renderStatusBadge(vm.status)}
                                                        </td>
                                                    </tr>
                                                ))}

                                                {activeDetailSubTab === 'storage' && MOCK_STORAGE.map(vol => {
                                                    const usage = parseFloat(vol.used) / parseFloat(vol.capacity) * 100; // Simplified calculation
                                                    return (
                                                        <tr key={vol.id} className="hover:bg-slate-50 group">
                                                            <td className="px-6 py-3 font-bold text-slate-700">{vol.name}</td>
                                                            <td className="px-6 py-3">
                                                                <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold border border-indigo-100">{vol.type}</span>
                                                            </td>
                                                            <td className="px-6 py-3 w-64">
                                                                <div className="flex justify-between text-xs mb-1">
                                                                    <span>{vol.used} / {vol.capacity}</span>
                                                                    <span className="font-bold">{usage.toFixed(1)}%</span>
                                                                </div>
                                                                {renderProgressBar(usage, usage > 80 ? 'bg-red-500' : 'bg-blue-500')}
                                                            </td>
                                                            <td className="px-6 py-3 font-mono text-slate-600">{vol.iops.toLocaleString()}</td>
                                                            <td className="px-6 py-3 flex justify-end">
                                                                <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-3.5 h-3.5"/> Healthy</span>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            // Topology View - Placeholder
                            <div className="h-full w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl bg-slate-50/50">
                                <div className="relative">
                                    <Construction className="w-24 h-24 text-slate-300" />
                                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded shadow-sm">DEV</div>
                                </div>
                                <h3 className="text-xl font-bold text-slate-600 mt-6">业务拓扑图 ({selectedBiz.name}) 开发中</h3>
                                <p className="text-slate-400 mt-2 text-sm max-w-md text-center">
                                    我们正在构建可视化的业务架构拓扑，支持自动发现依赖关系、实时流量监控与故障根因分析。
                                </p>
                                <button className="mt-6 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-600 hover:text-indigo-600 hover:border-indigo-300 transition-colors shadow-sm text-sm font-medium">
                                    查看预览版文档
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderCustomPage = (pageId: string) => {
        const page = customNodes.find(p => p.id === pageId);
        const pageName = page?.name || '未命名页面';
        return (
            <CustomPageBuilder 
                key={pageId}
                pageId={pageId}
                pageName={pageName}
                initialHtml={customPagesContent[pageId]}
                onSave={(html) => handleSaveCustomPage(pageId, html)}
            />
        );
    };

    const getFolderOptions = () => {
        return customNodes.filter(n => n.type === 'folder');
    };

    return (
        <div className="flex w-full h-full bg-slate-100 overflow-hidden relative">
            {/* Sidebar */}
            <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col flex-shrink-0 text-slate-300">
                {/* Header */}
                <div className="p-4 border-b border-slate-800">
                    <h2 className="text-white font-bold text-lg flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-blue-500" /> 运维管理中心
                    </h2>
                </div>

                {/* Fixed Navigation */}
                <div className="p-3">
                    <div className="text-[10px] font-bold text-slate-500 uppercase px-3 mb-2 tracking-wider">固定导航</div>
                    <button
                        onClick={() => setActiveNav('business-module')}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            activeNav === 'business-module' 
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                            : 'hover:bg-slate-800 hover:text-white'
                        }`}
                    >
                        <Layout className="w-4 h-4" /> 业务模块
                    </button>
                </div>

                {/* Custom Navigation */}
                <div className="p-3 flex-1 overflow-y-auto">
                    <div className="flex items-center justify-between px-3 mb-2 relative">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">自定义页面</span>
                        
                        <div ref={addMenuRef} className="relative">
                            <button 
                                onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}
                                className="text-slate-500 hover:text-white transition-colors"
                                title="添加..."
                            >
                                <Plus className="w-3.5 h-3.5" />
                            </button>
                            
                            {isAddMenuOpen && (
                                <div className="absolute right-0 top-full mt-1 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                                    <button 
                                        onClick={() => openModal('createFolder')}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                    >
                                        <FolderPlus className="w-3.5 h-3.5" /> 新建目录
                                    </button>
                                    <button 
                                        onClick={() => openModal('createPage')}
                                        className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 hover:text-white flex items-center gap-2"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> 新建页面
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        {renderCustomNavTree()}
                    </div>
                </div>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500 text-center">
                    v2.5.0 Build 20231125
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0 bg-slate-50">
                {activeNav === 'business-module' ? (
                    renderBusinessModuleContent()
                ) : (
                    renderCustomPage(activeNav)
                )}
            </div>

            {/* Config Modal (Create/Edit) */}
            {modalConfig.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-[100] flex items-center justify-center">
                    <div className="bg-white rounded-xl shadow-2xl w-[400px] p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                            {modalConfig.type === 'edit' ? <Edit2 className="w-5 h-5 text-blue-600"/> : <Plus className="w-5 h-5 text-blue-600"/>}
                            {modalConfig.type === 'createPage' && '新建自定义页面'}
                            {modalConfig.type === 'createFolder' && '新建目录'}
                            {modalConfig.type === 'edit' && '编辑项目'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">名称</label>
                                <input 
                                    type="text" 
                                    value={formName}
                                    onChange={(e) => setFormName(e.target.value)}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                    placeholder="例如: 监控大盘"
                                    autoFocus
                                />
                            </div>

                            {(modalConfig.type === 'createPage' || (modalConfig.type === 'edit')) && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">所属目录</label>
                                    <div className="relative">
                                        <select 
                                            value={formParentId}
                                            onChange={(e) => setFormParentId(e.target.value)}
                                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 appearance-none"
                                        >
                                            <option value="">(根目录)</option>
                                            {getFolderOptions()
                                                .filter(f => f.id !== modalConfig.targetId) // Prevent selecting self as parent
                                                .map(folder => (
                                                <option key={folder.id} value={folder.id}>📁 {folder.name}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1.5 uppercase">选择图标</label>
                                <div className="grid grid-cols-6 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200 max-h-32 overflow-y-auto">
                                    <button 
                                        type="button"
                                        onClick={() => setFormIcon('')}
                                        className={`p-2 rounded flex items-center justify-center transition-all ${
                                            formIcon === '' 
                                            ? 'bg-white border border-blue-500 text-blue-600 shadow-sm' 
                                            : 'text-slate-400 hover:bg-white hover:text-slate-600 border border-transparent'
                                        }`}
                                        title="默认"
                                    >
                                        <span className="text-[10px] font-bold">Def</span>
                                    </button>
                                    {AVAILABLE_ICONS.map((item) => (
                                        <button 
                                            key={item.name}
                                            type="button"
                                            onClick={() => setFormIcon(item.name)}
                                            className={`p-2 rounded flex items-center justify-center transition-all ${
                                                formIcon === item.name 
                                                ? 'bg-white border border-blue-500 text-blue-600 shadow-sm' 
                                                : 'text-slate-500 hover:bg-white hover:text-slate-700 border border-transparent'
                                            }`}
                                            title={item.name}
                                        >
                                            <item.icon className="w-4 h-4" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button 
                                onClick={() => setModalConfig({...modalConfig, isOpen: false})}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg text-sm font-medium transition-colors"
                            >
                                取消
                            </button>
                            <button 
                                onClick={handleModalSubmit}
                                disabled={!formName.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                            >
                                确认
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OpsManager;
