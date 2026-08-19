import { edgeStreets, graph, intersections } from '../data/mapData';

export function findShortestPath(startNode, targetNode) {
  const queue = [[startNode]];
  const visited = new Set();
  while (queue.length) {
    const path = queue.shift();
    const node = path.at(-1);
    if (node === targetNode) return path;
    if (visited.has(node)) continue;
    visited.add(node);
    graph[node].forEach((neighbor) => queue.push([...path, neighbor]));
  }
  return null;
}

const streetForEdge = (from, to) => edgeStreets[`${from}-${to}`] ?? edgeStreets[`${to}-${from}`];
const cellForEdge = (from, to) => [from, to].sort().join('-');

export function createRouteInstructions(startPlace, targetPlace) {
  return createNavigationPlan(startPlace, targetPlace).instructions;
}

function getDirection(fromId, toId) {
  const from = intersections[fromId];
  const to = intersections[toId];
  if (Math.abs(to.x - from.x) > Math.abs(to.y - from.y)) return to.x > from.x ? 'este' : 'oeste';
  return to.y > from.y ? 'sur' : 'norte';
}

function midpointBetween(first, second) {
  return { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 };
}

function isPointOnSegment(point, from, to) {
  const tolerance = 2;
  if (Math.abs(from.x - to.x) < tolerance) {
    return Math.abs(point.x - from.x) < tolerance
      && point.y >= Math.min(from.y, to.y) && point.y <= Math.max(from.y, to.y);
  }
  return Math.abs(point.y - from.y) < tolerance
    && point.x >= Math.min(from.x, to.x) && point.x <= Math.max(from.x, to.x);
}

export function createNavigationPlan(startPlace, targetPlace) {
  const path = findShortestPath(startPlace.node, targetPlace.node);
  if (!path) return { path: [], instructions: ['No hay una ruta disponible.'] };
  if (path.length < 2) return { path, instructions: [`Ya estás en ${targetPlace.name}.`] };

  const segments = path.slice(0, -1).map((from, index) => {
    const to = path[index + 1];
    return { from, to, street: streetForEdge(from, to), direction: getDirection(from, to) };
  });
  const firstSegment = segments[0];
  const checkpoint = firstSegment.to;
  const startIntersection = intersections[firstSegment.from];
  const targetIntersection = intersections[firstSegment.to];
  const targetPoint = { x: targetPlace.target.centerX, y: targetPlace.target.centerY };
  const targetIsBeforeIntersection = isPointOnSegment(targetPoint, startIntersection, targetIntersection);
  const waypoints = [
    startIntersection,
    targetIsBeforeIntersection ? midpointBetween(startIntersection, targetPoint) : targetIntersection
  ];
  const secondInstruction = targetIsBeforeIntersection
    ? `Sigue por ${firstSegment.street} hacia el ${firstSegment.direction}, en dirección de ${targetPlace.name}.`
    : `Sigue por ${firstSegment.street} hacia el ${firstSegment.direction} hasta la intersección de ${intersections[checkpoint].label}.`;

  // La fase inicial usa siempre tres pasos: salir, alcanzar un cruce y llegar.
  return {
    path,
    segments,
    checkpoint,
    waypoints,
    allowedCellIds: [startPlace.approachCell, ...segments.map(({ from, to }) => cellForEdge(from, to)), targetPlace.approachCell],
    instructions: [
      `Sal de ${startPlace.name} y llega a la intersección de ${intersections[firstSegment.from].label}.`,
      secondInstruction,
      `Llega a ${targetPlace.name}.`
    ]
  };
}
