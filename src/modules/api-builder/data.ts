

import { ApiFolder, ApiItem } from './types';

export const MOCK_FOLDERS: ApiFolder[] = [
  { id: 'sys', name: '系统接口', isOpen: true, type: 'system' },
  { id: 'biz', name: '业务接口', isOpen: true, type: 'business' },
  { id: 'custom', name: '自定义接口', isOpen: false, type: 'custom' },
];

export const MOCK_APIS: ApiItem[] = [
  {
    id: 'api-1',
    name: '用户信息接口',
    path: '/api/v1/user/info',
    method: 'GET',
    folderId: 'sys',
    status: 'published',
    sql: 'SELECT id, username, email, role, created_at FROM users WHERE id = #{user_id}',
    params: [
      { name: 'user_id', type: 'Integer', required: true, defaultValue: '', sampleValue: '1001', description: '用户ID' }
    ],
    config: {
      enablePagination: false,
      pageSize: 20,
      enableSorting: false
    },
    preHooks: [],
    postHooks: []
  },
  {
    id: 'api-2',
    name: '权限管理接口',
    path: '/api/v1/user/permissions',
    method: 'GET',
    folderId: 'sys',
    status: 'published',
    sql: 'SELECT p.code, p.name FROM permissions p JOIN user_roles ur ON p.role_id = ur.role_id WHERE ur.user_id = #{user_id}',
    params: [],
    config: {
      enablePagination: false,
      pageSize: 20,
      enableSorting: false
    },
    preHooks: [],
    postHooks: []
  },
  {
    id: 'api-3',
    name: '产品类别销售分析',
    path: '/api/v1/sales/category-analysis',
    method: 'POST',
    folderId: 'biz',
    status: 'draft',
    sql: `SELECT 
  p.category_name,
  COUNT(o.id) as order_count,
  SUM(o.total_amount) as total_sales
FROM orders o
JOIN products p ON o.product_id = p.id
WHERE o.created_at BETWEEN #{start_date} AND #{end_date}
GROUP BY p.category_name
ORDER BY total_sales DESC`,
    params: [
      { name: 'start_date', type: 'Date', required: true, defaultValue: '', sampleValue: '2023-01-01', description: '开始日期' },
      { name: 'end_date', type: 'Date', required: true, defaultValue: '', sampleValue: '2023-12-31', description: '结束日期' }
    ],
    config: {
      enablePagination: true,
      pageSize: 50,
      enableSorting: true
    },
    preHooks: [],
    postHooks: []
  },
  {
    id: 'api-4',
    name: '库存查询接口',
    path: '/api/v1/inventory/check',
    method: 'GET',
    folderId: 'biz',
    status: 'published',
    sql: 'SELECT * FROM inventory WHERE quantity < #{min_threshold}',
    params: [],
    config: {
      enablePagination: true,
      pageSize: 10,
      enableSorting: true
    },
    preHooks: [],
    postHooks: []
  }
];