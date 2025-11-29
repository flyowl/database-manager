import React, { useCallback, useRef } from 'react';
import ReactFlow, { 
  Node, 
  Edge, 
  Controls, 
  Background, 
  Handle, 
  Position,
  NodeProps,
  BackgroundVariant,
  Connection,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  OnNodesChange,
  OnEdgesChange,
  OnConnect
} from 'reactflow';
import { DatabaseTable } from '../../types';
import { XCircle } from 'lucide-react';

interface ERDiagramProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  onDrop: (event: React.DragEvent) => void;
  onDeleteNode: (nodeId: string) => void;
}

// Custom Node Component for Database Tables
const TableNode = ({ id, data }: NodeProps<{ label: string, cnName?: string, columns: any[], onDelete: (id: string) => void }>) => {
  return (
    <div className="bg-white rounded-lg border-2 border-slate-300 shadow-md min-w-[200px] overflow-hidden group">
      <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 font-bold text-sm text-slate-700 flex justify-between items-center handle cursor-move">
        <div className="flex flex-col">
            <span>{data.label}</span>
            {data.cnName && <span className="text-[10px] font-normal text-slate-500">{data.cnName}</span>}
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); data.onDelete(id); }}
          className="text-slate-400 hover:text-red-500 transition-colors"
          title="移除表"
        >
            <XCircle className="w-4 h-4" />
        </button>
      </div>
      <div className="p-2 space-y-1 bg-white">
        {data.columns.map((col: any, idx: number) => (
          <div key={idx} className="flex justify-between items-center text-xs relative px-1 py-0.5 hover:bg-slate-50 rounded">
            <div className="flex items-center gap-1.5">
               {col.isPrimaryKey && <span className="text-[10px] text-yellow-600 font-bold">PK</span>}
               {col.isForeignKey && <span className="text-[10px] text-blue-600 font-bold">FK</span>}
               <span className="text-slate-700">{col.name}</span>
            </div>
            <span className="text-slate-400">{col.type}</span>
            {/* Handles for connections */}
            <Handle type="source" position={Position.Right} id={`s-${col.name}`} className="!w-2 !h-2 !bg-slate-300 !border-slate-400 !-right-3 hover:!bg-blue-500 hover:!w-3 hover:!h-3 transition-all" />
            <Handle type="target" position={Position.Left} id={`t-${col.name}`} className="!w-2 !h-2 !bg-slate-300 !border-slate-400 !-left-3 hover:!bg-blue-500 hover:!w-3 hover:!h-3 transition-all" />
          </div>
        ))}
      </div>
    </div>
  );
};

const nodeTypes = { table: TableNode };

const ERDiagramContent: React.FC<ERDiagramProps> = ({ 
  nodes, 
  edges, 
  onNodesChange, 
  onEdgesChange, 
  onConnect,
  onDrop,
  onDeleteNode
}) => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDropHandler = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow/type');
      const tableId = event.dataTransfer.getData('application/reactflow/id');

      // check if the dropped element is valid
      if (typeof type === 'undefined' || !type || !tableId) {
        return;
      }

      // Project the position to react flow coordinates
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      // Pass the drop event up with position and id
      onDrop({ ...event, clientX: position.x, clientY: position.y, dataTransfer: { getData: () => tableId } } as any);
    },
    [project, onDrop]
  );

  return (
    <div className="h-full w-full bg-slate-50" ref={reactFlowWrapper}>
      <ReactFlow
        nodes={nodes.map(node => ({ ...node, data: { ...node.data, onDelete: onDeleteNode } }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onDragOver={onDragOver}
        onDrop={onDropHandler}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

const ERDiagram: React.FC<ERDiagramProps> = (props) => (
  <ReactFlowProvider>
    <ERDiagramContent {...props} />
  </ReactFlowProvider>
);

export default ERDiagram;