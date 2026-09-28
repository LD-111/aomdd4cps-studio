export type NodeType = 'actor' | 'goal' | 'task' | 'resource' | 'softgoal' | 'role' | 'cps_component' | 'operational_goal' | 'action' | 'sw_resource' | 'hw_resource' | 'and_ref_operator' | 'or_ref_operator' | 'comm_thread' | 'listener_thread';
export type EdgeType = 'and-refinement' | 'or-refinement' | 'dependency' | 'contribution' | 'relation_from_to' | 'comm_relation';

export interface DiagNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  boundaryX?: number;
  boundaryY?: number;
  boundaryW?: number;
  boundaryH?: number;
  parentId?: string;
}

export interface DiagEdge {
  id: string;
  source: string;
  target: string;
  type: EdgeType;
  value?: string;
}

export interface DiagramModel {
  nodes: DiagNode[];
  edges: DiagEdge[];
  nextId: number;
}

export interface DiagramEditorProps {
  initialXML?: string;
  onApply: (xml: string) => void;
  onBack: () => void;
  phase?: 'cim' | 'pim';
  onChange?: (xml: string) => void;
}
