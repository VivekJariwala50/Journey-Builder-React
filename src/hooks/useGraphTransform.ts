import { useMemo } from 'react';
import { MarkerType } from '@xyflow/react';
import type { BlueprintGraph, GraphNode, GraphEdge } from '../types';

export function useGraphTransform(graph: BlueprintGraph | null) {
  const nodes = useMemo(() => {
    if (!graph) return [];
    return graph.nodes.map((node: GraphNode) => ({
      id: node.id,
      type: 'formNode',
      position: node.position,
      data: {
        ...node.data,
        graph,
      } as Record<string, unknown>,
    }));
  }, [graph]);

  const edges = useMemo(() => {
    if (!graph) return [];
    return graph.edges.map((edge: GraphEdge, idx: number) => ({
      id: `edge-${idx}`,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      animated: false,
      style: { stroke: '#6366f1', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#6366f1',
      },
    }));
  }, [graph]);

  return { nodes, edges };
}
