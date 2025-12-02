
import { DatabaseTable, DataSource, Folder, DatabaseModule, GlobalFunction } from '../types';

export const MOCK_TABLES: DatabaseTable[] = [
  {
    id: 'servers',
    name: 'servers',
    cnName: '服务器资产表',
    description: '存储所有物理机、虚拟机及云主机资产信息',
    parentId: 'folder-1',
    columns: [
      { name: 'id', type: 'INT', isPrimaryKey: true, cnName: '资产ID', description: '主键自增' },
      { name: 'hostname', type: 'VARCHAR(100)', cnName: '主机名', description: '服务器名称' },
      { name: 'ip_address', type: 'VARCHAR(50)', cnName: 'IP地址', description: '内网IP' },
      { name: 'os_version', type: 'VARCHAR(100)', cnName: '操作系统', description: '例如: Ubuntu 22.04 LTS' },
      { name: 'cpu_cores', type: 'INT', cnName: 'CPU核数', description: '' },
      { name: 'memory_gb', type: 'INT', cnName: '内存(GB)', description: '' },
      { name: 'region', type: 'VARCHAR(50)', cnName: '所属区域', description: '例如: cn-hangzhou' },
      { name: 'status', type: 'VARCHAR(20)', cnName: '运行状态', description: 'running, stopped, maintenance' }
    ]
  },
  {
    id: 'applications',
    name: 'applications',
    cnName: '应用服务表',
    description: '业务应用与微服务清单',
    parentId: 'folder-1',
    columns: [
      { name: 'id', type: 'INT', isPrimaryKey: true, cnName: '应用ID', description: '' },
      { name: 'name', type: 'VARCHAR(100)', cnName: '应用名称', description: '例如: order-service' },
      { name: 'language', type: 'VARCHAR(50)', cnName: '开发语言', description: 'Java, Go, Node.js' },
      { name: 'owner', type: 'VARCHAR(50)', cnName: '负责人', description: 'DevOps 负责人' },
      { name: 'deploy_path', type: 'VARCHAR(255)', cnName: '部署路径', description: '' }
    ]
  },
  {
    id: 'deployments',
    name: 'deployments',
    cnName: '部署发布记录',
    description: '记录所有应用的CI/CD发布历史',
    parentId: 'folder-2',
    columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, cnName: '记录ID', description: '' },
        { name: 'app_id', type: 'INT', isForeignKey: true, cnName: '应用ID', description: '关联 applications 表' },
        { name: 'version', type: 'VARCHAR(50)', cnName: '发布版本', description: 'Git Tag 或 Commit ID' },
        { name: 'status', type: 'VARCHAR(20)', cnName: '发布结果', description: 'success, failed, deploying' },
        { name: 'operator', type: 'VARCHAR(50)', cnName: '操作人', description: '' },
        { name: 'created_at', type: 'TIMESTAMP', cnName: '开始时间', description: '' },
        { name: 'duration_seconds', type: 'INT', cnName: '耗时(秒)', description: '' }
    ]
  },
  {
    id: 'alert_logs',
    name: 'alert_logs',
    cnName: '告警日志表',
    description: '监控系统产生的实时告警信息',
    parentId: 'folder-2',
    columns: [
        { name: 'id', type: 'BIGINT', isPrimaryKey: true, cnName: 'ID', description: '' },
        { name: 'server_id', type: 'INT', isForeignKey: true, cnName: '关联服务器', description: '' },
        { name: 'level', type: 'VARCHAR(20)', cnName: '告警级别', description: 'info, warning, critical' },
        { name: 'message', type: 'TEXT', cnName: '告警内容', description: '' },
        { name: 'is_resolved', type: 'BOOLEAN', cnName: '是否已解决', description: '' },
        { name: 'created_at', type: 'TIMESTAMP', cnName: '告警时间', description: '' }
    ]
  }
];

export const MOCK_DB_FOLDERS: Folder[] = [
  { id: 'folder-1', name: 'CMDB 资产', isOpen: true },
  { id: 'folder-2', name: '监控与运维', isOpen: true }
];

export const MOCK_MODULES: DatabaseModule[] = [
    { 
        id: 'mod-1', 
        name: '资产核心模块', 
        description: '服务器与应用基础信息管理', 
        tableIds: ['servers', 'applications'] 
    },
    { 
        id: 'mod-2', 
        name: '监控告警模块', 
        description: '日志流与告警归档', 
        tableIds: ['alert_logs', 'deployments'] 
    }
];

export const MOCK_DATA_SOURCES: DataSource[] = [
  { id: '1', name: 'CMDB Primary', type: 'PostgreSQL', host: '10.0.1.5:5432', status: 'online', apiCount: 85, isDefault: true },
  { id: '2', name: 'Prometheus Store', type: 'PostgreSQL', host: '10.0.2.10:5432', status: 'online', apiCount: 42 },
  { id: '3', name: 'Log Archive (Cold)', type: 'MySQL', host: '10.0.5.20:3306', status: 'online', apiCount: 15 },
];

export const MOCK_FUNCTIONS: GlobalFunction[] = [
  { 
    id: 'fn-1', 
    name: 'Alert Formatter', 
    description: 'Format alert messages for DingTalk/Slack', 
    code: `function run(context) {\n  const { level, message, host } = context.data;\n  const color = level === 'critical' ? '#ff0000' : '#ffa500';\n  return {\n    markdown: {\n      title: \`[\${level.toUpperCase()}] \${host}\`,\n      text: \`<font color="\${color}">\${message}</font>\`\n    }\n  };\n}`, 
    tags: ['Notify', 'Transform'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: 'fn-2', 
    name: 'IP Whitelist Check', 
    description: 'Check if request IP is in internal subnet', 
    code: `function run(context) {\n  const ip = context.ip;\n  if (!ip.startsWith('10.0.') && !ip.startsWith('192.168.')) {\n    throw new Error('Access Denied: External IP');\n  }\n  return true;\n}`, 
    tags: ['Security', 'Auth'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: 'fn-3', 
    name: 'CPU Threshold Filter', 
    description: 'Filter out low usage metrics', 
    code: `function run(data) {\n  // data is array of { host, cpu_usage }\n  return data.filter(item => item.cpu_usage > 80);\n}`, 
    tags: ['Monitor', 'Filter'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];
