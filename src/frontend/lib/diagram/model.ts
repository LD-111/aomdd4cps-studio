import { NodeType, EdgeType, DiagNode, DiagramModel } from './types';
import { isContainerType, getBoundaryStyle, getStyleForType, getStyleForEdge, escapeXml, getMinSizeForNode, findContainingContainer } from './utils';

const CIM_PALETTE: { type: NodeType; label: string; w: number; h: number }[] = [
  { type: 'actor', label: 'Actor', w: 80, h: 80 },
  { type: 'goal', label: 'Goal', w: 140, h: 40 },
  { type: 'task', label: 'Task', w: 120, h: 42 },
  { type: 'resource', label: 'Resource', w: 100, h: 44 },
  { type: 'softgoal', label: 'Softgoal', w: 120, h: 50 },
  { type: 'role', label: 'Role', w: 80, h: 80 },
];

const PIM_PALETTE: { type: NodeType; label: string; w: number; h: number }[] = [
  { type: 'cps_component', label: 'CPC', w: 160, h: 100 },
  { type: 'operational_goal', label: 'Op. Goal', w: 90, h: 90 },
  { type: 'action', label: 'Action', w: 95, h: 45 },
  { type: 'sw_resource', label: 'SW Res', w: 90, h: 65 },
  { type: 'hw_resource', label: 'HW Res', w: 105, h: 55 },
  { type: 'and_ref_operator', label: 'AND', w: 50, h: 65 },
  { type: 'or_ref_operator', label: 'OR', w: 50, h: 65 },
  { type: 'comm_thread', label: 'Comm Sender', w: 135, h: 45 },
  { type: 'listener_thread', label: 'Comm Receiver', w: 135, h: 45 },
];

export { CIM_PALETTE, PIM_PALETTE };

export function parseXmlToModel(xml: string, phase: 'cim' | 'pim' = 'cim'): DiagramModel {
  const model: DiagramModel = { nodes: [], edges: [], nextId: 100 };
  const isCim = phase === 'cim';
  const allowedNodeTypes = isCim
    ? ['actor','goal','task','resource','softgoal','role']
    : ['cps_component','operational_goal','action','sw_resource','hw_resource','and_ref_operator','or_ref_operator','comm_thread','listener_thread'];
  if (!xml) return model;
  try {
    const doc = new DOMParser().parseFromString(xml, 'text/xml');
    const cells = doc.querySelectorAll('mxCell, object');
    const idMap = new Map<string, DiagNode>();
    const idRemap = new Map<string, string>();
    let nextId = 100;
    const usedIds = new Set<string>();
    cells.forEach((el) => {
      const isObj = el.tagName === 'object';
      const mx = isObj ? el.querySelector('mxCell') : el;
      if (!mx) return;
      const rawId = el.getAttribute('id') || mx.getAttribute('id') || '';
      const parent = mx.getAttribute('parent') || '';
      if (parent === '0') return;
      const geo = mx.querySelector('mxGeometry');
      if (!geo) return;
      const x = parseFloat(geo.getAttribute('x') || '0');
      const y = parseFloat(geo.getAttribute('y') || '0');
      const w = parseFloat(geo.getAttribute('width') || '100');
      const h = parseFloat(geo.getAttribute('height') || '40');
      const label = (el.getAttribute('label') || mx.getAttribute('value') || '').replace(/<[^>]*>/g, '');
      const typ = (el.getAttribute('type') || '').toLowerCase() as NodeType;
      if (mx.getAttribute('vertex') === '1' && typ && allowedNodeTypes.includes(typ)) {
        let nodeId = rawId;
        if (!nodeId || usedIds.has(nodeId)) {
          while (usedIds.has('n' + nextId)) nextId++;
          nodeId = 'n' + nextId;
          nextId++;
        }
        usedIds.add(nodeId);
        const node: DiagNode = { id: nodeId, type: typ, label: label || typ, x, y, w, h, parentId: (parent && parent !== '1' ? parent : undefined) };
        model.nodes.push(node);
        idMap.set(nodeId, node);
        if (rawId && rawId !== nodeId) {
          idRemap.set(rawId, nodeId);
        }
      }
    });
    model.nodes.forEach(n => {
      if (n.parentId && idRemap.has(n.parentId)) {
        n.parentId = idRemap.get(n.parentId);
      }
    });
    cells.forEach((el) => {
      const mx = el.tagName === 'object' ? el.querySelector('mxCell') : el;
      if (!mx || mx.getAttribute('edge') !== '1') return;
      const rawId = el.getAttribute('id') || mx.getAttribute('id') || '';
      const sourceRaw = mx.getAttribute('source') || '';
      const targetRaw = mx.getAttribute('target') || '';
      const source = idRemap.get(sourceRaw) || sourceRaw;
      const target = idRemap.get(targetRaw) || targetRaw;
      if (!source || !target || !idMap.has(source) || !idMap.has(target)) return;
      const style = mx.getAttribute('style') || '';
      let etype: EdgeType = isCim ? 'dependency' : 'relation_from_to';
      const typeAttr = (el.getAttribute('type') || '').toLowerCase();
      const valAttr = el.getAttribute('value') || '';
      if (typeAttr) {
        etype = typeAttr as EdgeType;
      } else if (typeAttr === 'refinement') {
        etype = (valAttr === 'or' || style.includes('block')) ? 'or-refinement' : 'and-refinement';
      } else if (style.includes('ERone') || style.includes('block')) {
        etype = (valAttr === 'or' || style.includes('block')) ? 'or-refinement' : 'and-refinement';
      } else if (style.includes('open') || valAttr) {
        etype = 'contribution';
      } else if (style.includes('classic')) {
        etype = isCim ? 'dependency' : 'relation_from_to';
      }
      let edgeId = rawId;
      if (!edgeId || usedIds.has(edgeId)) {
        while (usedIds.has('e' + nextId)) nextId++;
        edgeId = 'e' + nextId;
        nextId++;
      }
      usedIds.add(edgeId);
      model.edges.push({ id: edgeId, source, target, type: etype, value: etype === 'contribution' ? (valAttr || undefined) : undefined });
    });
    let maxNum = nextId - 1;
    [...model.nodes, ...model.edges].forEach(item => {
      const num = parseInt((item.id || '').replace(/\D/g, '')) || 0;
      if (num > maxNum) maxNum = num;
    });
    model.nextId = maxNum + 1;

    cells.forEach((el) => {
      const isObj = el.tagName === 'object';
      const mx = isObj ? el.querySelector('mxCell') : el;
      if (!mx) return;
      const bfor = el.getAttribute('boundaryFor') || mx.getAttribute('boundaryFor') || '';
      if (!bfor) return;
      const geo = mx.querySelector('mxGeometry');
      if (!geo) return;
      const x = parseFloat(geo.getAttribute('x') || '0');
      const y = parseFloat(geo.getAttribute('y') || '0');
      const w = parseFloat(geo.getAttribute('width') || '200');
      const h = parseFloat(geo.getAttribute('height') || '150');
      const container = model.nodes.find(nn => nn.id === bfor);
      if (container) {
        container.boundaryX = x;
        container.boundaryY = y;
        container.boundaryW = w;
        container.boundaryH = h;
      }
    });
  } catch {}
  if (model.nodes.length === 0) {
    if (isCim) {
      model.nodes = [
        { id: 'a1', type: 'actor', label: 'System', x: 120, y: 80, w: 80, h: 80 },
        { id: 'g1', type: 'goal', label: 'Goal', x: 280, y: 100, w: 140, h: 40 },
      ];
      model.edges = [{ id: 'e1', source: 'a1', target: 'g1', type: 'and-refinement' }];
    } else {
      model.nodes = [
        { id: 'c1', type: 'cps_component', label: 'Component', x: 100, y: 80, w: 160, h: 100, boundaryX: 70, boundaryY: 50, boundaryW: 320, boundaryH: 220 },
        { id: 'og1', type: 'operational_goal', label: 'Op Goal', x: 180, y: 110, w: 90, h: 90 },
      ];
      model.edges = [{ id: 'e1', source: 'c1', target: 'og1', type: 'relation_from_to' }];
    }
  }
  model.nodes.forEach(n => {
    if (isContainerType(n.type) && n.boundaryW == null) {
      if (n.type === 'cps_component') {
        n.boundaryW = 280;
        n.boundaryH = 180;
        n.boundaryX = n.x - 20;
        n.boundaryY = n.y - 20;
      } else {
        n.boundaryW = 220;
        n.boundaryH = 160;
        n.boundaryX = n.x + 45;
        n.boundaryY = n.y - 35;
      }
    }
    const sz = getMinSizeForNode(n.type, n.label);
    n.w = Math.max(n.w, sz.w);
    n.h = Math.max(n.h, sz.h);
  });
  model.nodes.forEach(n => {
    if (isContainerType(n.type) || n.parentId != null) return;
    const cx = n.x + n.w / 2;
    const cy = n.y + n.h / 2;
    const cont = findContainingContainer(cx, cy, model.nodes);
    if (cont) n.parentId = cont.id;
  });
  return model;
}

export function modelToXml(model: DiagramModel, diagramName = 'Diagram'): string {
  let cells = '<mxCell id="0"/><mxCell id="1" parent="0"/>';
  model.nodes.forEach(n => {
    if (isContainerType(n.type) && n.boundaryW != null) {
      const bstyle = getBoundaryStyle(n.type);
      const bx = n.boundaryX ?? (n.x + (n.type === 'cps_component' ? -20 : 45));
      const by = n.boundaryY ?? (n.y + (n.type === 'cps_component' ? -20 : -35));
      const bw = n.boundaryW;
      const bh = n.boundaryH;
      cells += `<object label="" boundaryFor="${n.id}" id="bnd-${n.id}"><mxCell style="${bstyle}" vertex="1" parent="1"><mxGeometry x="${bx}" y="${by}" width="${bw}" height="${bh}" as="geometry"/></mxCell></object>`;
    }
  });
  model.nodes.forEach(n => {
    const style = getStyleForType(n.type);
    cells += `<object label="${escapeXml(n.label)}" type="${n.type}" id="${n.id}"><mxCell style="${style}" vertex="1" parent="1"><mxGeometry x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" as="geometry"/></mxCell></object>`;
  });
  model.edges.forEach(e => {
    const style = getStyleForEdge(e.type);
    const val = e.value ? ` value="${escapeXml(e.value)}"` : '';
    cells += `<object label="" type="${e.type}"${val} id="${e.id}"><mxCell style="${style}" edge="1" parent="1" source="${e.source}" target="${e.target}"><mxGeometry relative="1" as="geometry"/></mxCell></object>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?><mxfile host="app.diagrams.net"><diagram name="${diagramName}" id="d1"><mxGraphModel dx="1200" dy="800" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="0" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0"><root>${cells}</root></mxGraphModel></diagram></mxfile>`;
}
