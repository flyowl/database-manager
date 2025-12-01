

import { DatabaseTable, DataSource, Folder, DatabaseModule, GlobalFunction } from '../types';

export const MOCK_TABLES: DatabaseTable[] = [
  {
    id: 'users',
    name: 'users',
    cnName: '用户表',
    description: '存储系统所有用户的基本信息',
    parentId: 'folder-1',
    columns: [
      { name: 'id', type: 'INT', isPrimaryKey: true, cnName: '用户ID', description: '主键自增' },
      { name: 'username', type: 'VARCHAR(50)', cnName: '用户名', description: '登录账号' },
      { name: 'email', type: 'VARCHAR(100)', cnName: '邮箱', description: '联系邮箱' },
      { name: 'created_at', type: 'TIMESTAMP', cnName: '创建时间', description: '注册时间' }
    ]
  },
  {
    id: 'orders',
    name: 'orders',
    cnName: '订单表',
    description: '用户的购买记录',
    parentId: 'folder-1',
    columns: [
      { name: 'id', type: 'INT', isPrimaryKey: true, cnName: '订单ID', description: '' },
      { name: 'user_id', type: 'INT', isForeignKey: true, cnName: '用户ID', description: '关联 users 表' },
      { name: 'total_amount', type: 'DECIMAL', cnName: '总金额', description: '' },
      { name: 'status', type: 'VARCHAR(20)', cnName: '状态', description: 'pending, paid, shipped' }
    ]
  },
  {
    id: 'products',
    name: 'products',
    cnName: '商品表',
    description: '库存商品信息',
    parentId: 'folder-2',
    columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, cnName: '商品ID', description: '' },
        { name: 'name', type: 'VARCHAR(100)', cnName: '商品名称', description: '' },
        { name: 'price', type: 'DECIMAL', cnName: '价格', description: '' }
    ]
  },
  {
    id: 'order_items',
    name: 'order_items',
    cnName: '订单明细表',
    description: '',
    parentId: 'folder-1',
    columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, cnName: 'ID', description: '' },
        { name: 'order_id', type: 'INT', isForeignKey: true, cnName: '订单ID', description: '' },
        { name: 'product_id', type: 'INT', isForeignKey: true, cnName: '商品ID', description: '' },
        { name: 'quantity', type: 'INT', cnName: '数量', description: '' }
    ]
  }
];

export const MOCK_DB_FOLDERS: Folder[] = [
  { id: 'folder-1', name: 'Sales Data', isOpen: true },
  { id: 'folder-2', name: 'Inventory', isOpen: false }
];

export const MOCK_MODULES: DatabaseModule[] = [
    { 
        id: 'mod-1', 
        name: '订单核心模块', 
        description: '包含用户下单核心流程涉及的表结构', 
        tableIds: ['users', 'orders', 'order_items'] 
    }
];

export const MOCK_DATA_SOURCES: DataSource[] = [
  { id: '1', name: 'Production DB (Core)', type: 'PostgreSQL', host: '192.168.1.10:5432', status: 'online', apiCount: 142, isDefault: true },
  { id: '2', name: 'User Analytics', type: 'MySQL', host: 'aws-east-1-rds...:3306', status: 'online', apiCount: 56 },
  { id: '3', name: 'Legacy Systems', type: 'SQL Server', host: 'corp-win-01:1433', status: 'offline', apiCount: 12 },
];

export const MOCK_FUNCTIONS: GlobalFunction[] = [
  { 
    id: 'fn-1', 
    name: 'Token Validation', 
    description: 'Validate JWT token from headers', 
    code: `function run(context) {\n  const token = context.headers['Authorization'];\n  if (!token) throw new Error('No token provided');\n  // verify logic...\n  return true;\n}`, 
    tags: ['Auth', 'Security'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: 'fn-2', 
    name: 'Data Masking', 
    description: 'Mask sensitive user data', 
    code: `function run(data) {\n  return data.map(item => ({\n    ...item,\n    phone: item.phone.replace(/(\\d{3})\\d{4}(\\d{4})/, '$1****$2')\n  }));\n}`, 
    tags: ['Privacy', 'Transform'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  { 
    id: 'fn-3', 
    name: 'Rate Limiting', 
    description: 'Check API rate limits', 
    code: `function run(context) {\n  const ip = context.ip;\n  // check redis...\n}`, 
    tags: ['Security'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];