import { NodeType, EdgeType, DiagNode, DiagramModel } from './types';

export function getNodeStyle(type: NodeType) {
  switch (type) {
    case 'actor':
    case 'role':
      return { borderRadius: '50%', background: '#dae8fc', border: '1px solid #6c8ebf' };
    case 'goal':
      return { borderRadius: '20px', background: '#dae8fc', border: '1px solid #6c8ebf' };
    case 'task':
      return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', background: '#dae8fc', border: '1px solid #6c8ebf' };
    case 'resource':
      return { background: '#dae8fc', border: '1px solid #6c8ebf' };
    case 'softgoal':
      return { borderRadius: '50% 50% 50% 50% / 70% 70% 30% 30%', background: '#dae8fc', border: '1px solid #6c8ebf' };
    case 'cps_component':
      return { borderRadius: '4px', background: '#bae6fd', border: '1px solid #0369a1' };
    case 'operational_goal':
      return { borderRadius: '50%', background: '#dbeafe', border: '1px solid #1e40af' };
    case 'action':
      return { background: '#dbeafe', border: '1px solid #1e40af' };
    case 'sw_resource':
      return { background: '#fef3c7', border: '1px solid #854d0e' };
    case 'hw_resource':
      return { background: '#fed7aa', border: '1px solid #9a3412' };
    case 'and_ref_operator':
    case 'or_ref_operator':
      return { background: '#f3e8ff', border: '1px solid #6b21a8' };
    case 'comm_thread':
    case 'listener_thread':
      return { clipPath: 'polygon(10% 0%, 100% 0%, 90% 100%, 0% 100%)', background: '#a5f3fc', border: '1px solid #164e63' };
    default:
      return { background: '#dae8fc', border: '1px solid #6c8ebf' };
  }
}

export function getStyleForType(t: NodeType): string {
  if (t === 'actor' || t === 'role') return 'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#dae8fc;strokeColor=#6c8ebf;';
  if (t === 'goal') return 'rounded=1;whiteSpace=wrap;html=1;arcSize=50;fillColor=#dae8fc;strokeColor=#6c8ebf;';
  if (t === 'task') return 'shape=hexagon;perimeter=hexagonPerimeter2;whiteSpace=wrap;html=1;fixedSize=1;strokeWidth=1;fillColor=#dae8fc;strokeColor=#6c8ebf;size=10;';
  if (t === 'resource') return 'rounded=0;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;';
  if (t === 'softgoal') return 'rounded=1;whiteSpace=wrap;html=1;arcSize=80;fillColor=#dae8fc;strokeColor=#6c8ebf;';
  if (t === 'cps_component') return 'swimlane;whiteSpace=wrap;html=1;fillColor=#e0f2fe;strokeColor=#0369a1;';
  if (t === 'operational_goal') return 'ellipse;whiteSpace=wrap;html=1;aspect=fixed;fillColor=#dbeafe;strokeColor=#1e40af;';
  if (t === 'action') return 'rounded=0;whiteSpace=wrap;html=1;fillColor=#dbeafe;strokeColor=#1e40af;';
  if (t === 'sw_resource') return 'shape=cylinder3;whiteSpace=wrap;html=1;boundedLbl=1;backgroundOutline=1;size=15;fillColor=#fef3c7;strokeColor=#854d0e;';
  if (t === 'hw_resource') return 'shape=cube;spacingTop=8;spacingLeft=2;spacingRight=12;size=10;direction=south;fillColor=#fed7aa;strokeColor=#9a3412;';
  if (t === 'and_ref_operator') return 'shape=or;whiteSpace=wrap;html=1;fillColor=#f3e8ff;strokeColor=#6b21a8;';
  if (t === 'or_ref_operator') return 'shape=xor;whiteSpace=wrap;html=1;fillColor=#f3e8ff;strokeColor=#6b21a8;';
  if (t === 'comm_thread') return 'shape=trapezoid;perimeter=trapezoidPerimeter;whiteSpace=wrap;html=1;fixedSize=1;fillColor=#a5f3fc;strokeColor=#164e63;';
  if (t === 'listener_thread') return 'shape=trapezoid;perimeter=trapezoidPerimeter;whiteSpace=wrap;html=1;fixedSize=1;flipV=1;fillColor=#a5f3fc;strokeColor=#164e63;';
  return 'rounded=1;whiteSpace=wrap;html=1;fillColor=#dae8fc;strokeColor=#6c8ebf;';
}

export function getStyleForEdge(t: EdgeType): string {
  if (t === 'and-refinement') return 'endArrow=ERone;html=1;rounded=0;endFill=0;endSize=10;';
  if (t === 'or-refinement') return 'endArrow=block;html=1;rounded=0;endFill=1;endSize=10;';
  if (t === 'contribution') return 'endArrow=open;html=1;rounded=0;endFill=0;endSize=10;';
  return 'endArrow=classic;html=1;rounded=0;endFill=0;endSize=10;';
}

export function getBoundaryStyle(t: NodeType): string {
  if (t === 'cps_component') return 'rounded=1;whiteSpace=wrap;html=1;dashed=1;dashPattern=3 2;strokeWidth=2;fillColor=none;strokeColor=#0369a1;';
  return 'ellipse;whiteSpace=wrap;html=1;dashed=1;dashPattern=3 2;strokeWidth=2;fillColor=none;strokeColor=#6c8ebf;';
}

export function isContainerType(t: NodeType): boolean {
  return t === 'actor' || t === 'role' || t === 'cps_component';
}

export function escapeXml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function cloneModel(m: DiagramModel): DiagramModel {
  return { nodes: m.nodes.map(n => ({...n})), edges: m.edges.map(e => ({...e})), nextId: m.nextId };
}

export function measureTextWidth(text: string): number {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (!ctx) return (text || '').length * 7;
  ctx.font = '11px sans-serif';
  return ctx.measureText(text || '').width;
}

export const NODE_DEFAULTS: Record<NodeType, {w: number, h: number}> = {
  actor: {w:80,h:80}, role: {w:80,h:80}, goal: {w:140,h:40}, task: {w:120,h:42}, resource: {w:100,h:44}, softgoal: {w:120,h:50},
  cps_component: {w:160,h:100}, operational_goal: {w:90,h:90}, action: {w:95,h:45}, sw_resource: {w:90,h:65}, hw_resource: {w:105,h:55},
  and_ref_operator: {w:50,h:65}, or_ref_operator: {w:50,h:65}, comm_thread: {w:135,h:45}, listener_thread: {w:135,h:45},
};

export function getMinSizeForNode(type: NodeType, label: string): {w: number, h: number} {
  const tw = measureTextWidth(label || ' ');
  const pad = 20;
  const reqW = Math.ceil(tw + pad);
  const p = NODE_DEFAULTS[type] || {w:100, h:40};
  if (type === 'actor' || type === 'role' || type === 'cps_component') {
    const d = Math.max(p.w, reqW, type === 'cps_component' ? 80 : 60);
    return {w: d, h: d};
  }
  const aspect = p.h / p.w;
  let w = Math.max(p.w, reqW);
  let h = Math.ceil(w * aspect);
  if (h < 32) h = 32;
  if (type === 'task') {
    w = Math.max(w, reqW + 10);
  }
  if (type === 'softgoal') {
    w = Math.max(w, reqW + 4);
  }
  return {w, h};
}

export function isInsideEllipse(px: number, py: number, ex: number, ey: number, ew: number, eh: number): boolean {
  const cx = ex + ew / 2;
  const cy = ey + eh / 2;
  const rx = ew / 2;
  const ry = eh / 2;
  if (rx <= 0 || ry <= 0) return false;
  const dx = (px - cx) / rx;
  const dy = (py - cy) / ry;
  return (dx * dx + dy * dy) <= 1;
}

export function isPointInContainer(px: number, py: number, n: DiagNode): boolean {
  if (!n.boundaryW || n.boundaryH == null) return false;
  const bx = n.boundaryX ?? 0;
  const by = n.boundaryY ?? 0;
  const bw = n.boundaryW;
  const bh = n.boundaryH;
  if (n.type === 'cps_component') {
    return px >= bx && px <= bx + bw && py >= by && py <= by + bh;
  }
  return isInsideEllipse(px, py, bx, by, bw, bh);
}

export function findContainingContainer(px: number, py: number, nodes: DiagNode[]): DiagNode | undefined {
  const cands = nodes.filter(n => isContainerType(n.type) && n.boundaryW != null && isPointInContainer(px, py, n));
  if (cands.length === 0) return undefined;
  return cands.reduce((best, cur) => {
    const ba = best.boundaryW! * best.boundaryH!;
    const ca = cur.boundaryW! * cur.boundaryH!;
    return ca < ba ? cur : best;
  });
}

export function getRectBoundaryIntersection(cx: number, cy: number, tx: number, ty: number, rect: {x: number, y: number, w: number, h: number}): {x: number, y: number} {
  const dx = tx - cx;
  const dy = ty - cy;
  if (Math.abs(dx) < 0.0001 && Math.abs(dy) < 0.0001) {
    return { x: cx, y: cy };
  }
  const left = rect.x;
  const right = rect.x + rect.w;
  const top = rect.y;
  const bottom = rect.y + rect.h;
  let minT = Infinity;
  let ix = cx, iy = cy;
  const check = (t: number, ixCalc: number, iyCalc: number) => {
    if (t > 0 && t < minT) {
      minT = t;
      ix = ixCalc;
      iy = iyCalc;
    }
  };
  if (Math.abs(dx) > 0.0001) {
    let t = (left - cx) / dx;
    let y = cy + t * dy;
    if (y >= top && y <= bottom) check(t, left, y);
    t = (right - cx) / dx;
    y = cy + t * dy;
    if (y >= top && y <= bottom) check(t, right, y);
  }
  if (Math.abs(dy) > 0.0001) {
    let t = (top - cy) / dy;
    let x = cx + t * dx;
    if (x >= left && x <= right) check(t, x, top);
    t = (bottom - cy) / dy;
    x = cx + t * dx;
    if (x >= left && x <= right) check(t, x, bottom);
  }
  if (minT === Infinity) {
    return { x: cx, y: cy };
  }
  return { x: ix, y: iy };
}
