
import { ApiFolder, ApiItem } from './types';

export const MOCK_FOLDERS: ApiFolder[] = [
  { id: 'cmdb', name: 'CMDB 资产接口', isOpen: true, type: 'system' },
  { id: 'monitor', name: '监控告警接口', isOpen: true, type: 'business' },
  { id: 'deploy', name: '自动化发布', isOpen: false, type: 'custom' },
];

export const MOCK_APIS: ApiItem[] = [
  {
    id: 'api-1',
    name: '查询服务器列表',
    path: '/api/v1/cmdb/servers',
    method: 'GET',
    folderId: 'cmdb',
    status: 'published',
    sql: 'SELECT id, hostname, ip_address, status, region FROM servers WHERE status = #{status} AND region = #{region}',
    params: [
      { name: 'status', type: 'String', required: false, defaultValue: 'running', sampleValue: 'running', description: '运行状态' },
      { name: 'region', type: 'String', required: false, defaultValue: 'cn-hangzhou', sampleValue: 'cn-hangzhou', description: '所属区域' }
    ],
    config: {
      enablePagination: true,
      pageSize: 20,
      enableSorting: true
    },
    preHooks: [],
    postHooks: []
  },
  {
    id: 'api-2',
    name: '获取高危告警',
    path: '/api/v1/monitor/alerts/critical',
    method: 'GET',
    folderId: 'monitor',
    status: 'published',
    sql: 'SELECT * FROM alert_logs WHERE level = \'critical\' AND is_resolved = false ORDER BY created_at DESC',
    params: [],
    config: {
      enablePagination: true,
      pageSize: 50,
      enableSorting: false
    },
    preHooks: [],
    postHooks: []
  },
  {
    id: 'api-3',
    name: '部署历史统计',
    path: '/api/v1/deploy/stats',
    method: 'POST',
    folderId: 'deploy',
    status: 'draft',
    sql: `SELECT 
  a.name as app_name,
  COUNT(d.id) as deploy_count,
  SUM(CASE WHEN d.status = 'failed' THEN 1 ELSE 0 END) as fail_count,
  AVG(d.duration_seconds) as avg_duration
FROM deployments d
JOIN applications a ON d.app_id = a.id
WHERE d.created_at >= #{start_time}
GROUP BY a.name
ORDER BY fail_count DESC`,
    params: [
      { name: 'start_time', type: 'Date', required: true, defaultValue: '', sampleValue: '2023-11-01', description: '统计开始时间' }
    ],
    config: {
      enablePagination: false,
      pageSize: 100,
      enableSorting: true
    },
    preHooks: [],
    postHooks: []
  },
  {
    id: 'api-4',
    name: '更新服务器状态',
    path: '/api/v1/cmdb/server/status',
    method: 'PUT',
    folderId: 'cmdb',
    status: 'published',
    sql: 'UPDATE servers SET status = #{status} WHERE hostname = #{hostname}',
    params: [
        { name: 'hostname', type: 'String', required: true, defaultValue: '', sampleValue: 'web-prod-01', description: '主机名' },
        { name: 'status', type: 'String', required: true, defaultValue: '', sampleValue: 'maintenance', description: '新状态' }
    ],
    config: {
      enablePagination: false,
      pageSize: 1,
      enableSorting: false
    },
    preHooks: [],
    postHooks: []
  }
];
