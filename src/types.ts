

export interface TableColumn {
  name: string;
  type: string;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  cnName?: string;
  description?: string;
}

export interface DatabaseTable {
  id: string;
  name: string;
  columns: TableColumn[];
  parentId?: string; // For folder structure
  cnName?: string;
  description?: string;
}

export interface Folder {
  id: string;
  name: string;
  isOpen: boolean;
  parentId?: string;
}

export enum TabOption {
  SQL = 'SQL',
  FIELDS = 'FIELDS',
  ER_DIAGRAM = 'ER_DIAGRAM',
  DATA = 'DATA'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: Date;
  isThinking?: boolean;
}

export interface QueryResult {
  columns: string[];
  data: Record<string, any>[];
  executionTime?: number;
}

export interface SavedQuery {
  id: string;
  name: string;
  sql: string;
  createdAt: Date;
}