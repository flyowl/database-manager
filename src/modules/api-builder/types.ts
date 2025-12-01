

export type ApiMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string;
  sampleValue: string;
  description: string;
}

export interface ApiConfig {
  enablePagination: boolean;
  pageSize: number;
  enableSorting: boolean;
}

export interface ApiProcessingHook {
  id: string;
  name: string;
  type: 'script' | 'global';
  code: string;
  enabled: boolean;
  globalFunctionId?: string;
}

export interface ApiItem {
  id: string;
  name: string;
  path: string;
  method: ApiMethod;
  folderId: string;
  sql: string;
  description?: string;
  params: ApiParameter[];
  status: 'published' | 'draft';
  dataSourceId?: string;
  config: ApiConfig;
  preHooks?: ApiProcessingHook[];
  postHooks?: ApiProcessingHook[];
}

export interface ApiFolder {
  id: string;
  name: string;
  isOpen: boolean;
  type: 'system' | 'business' | 'custom';
  preHooks?: string[]; // IDs of global functions
  postHooks?: string[]; // IDs of global functions
}