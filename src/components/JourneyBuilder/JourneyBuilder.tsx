import { useState, useCallback, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  MiniMap,
  Panel,
  type Node,
} from '@xyflow/react';

import FormNode from '../FormNode/FormNode';
import PrefillPanel from '../PrefillPanel/PrefillPanel';
import { fetchBlueprintGraph } from '../../api/graph';
import { useGraphTransform } from '../../hooks/useGraphTransform';
import type { BlueprintGraph, FormNodeData } from '../../types';

// CSS imports - imported in index.css via @xyflow/react
import '@xyflow/react/dist/style.css';

const nodeTypes = { formNode: FormNode };

const TENANT_ID = '1';
const BLUEPRINT_ID = 'bp_01jk766tckfwx84xjcxazggzyc';

interface NewMapping {
  type: string;
  source_node_id: string;
  source_field: string;
}

export default function JourneyBuilder() {
  const [graph, setGraph] = useState<BlueprintGraph | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeData, setSelectedNodeData] = useState<(FormNodeData & { graph: BlueprintGraph }) | null>(null);

  const { nodes: transformedNodes, edges: transformedEdges } = useGraphTransform(graph);
  const [nodes, setNodes, onNodesChange] = useNodesState(transformedNodes);
  const [, , onEdgesChange] = useEdgesState(transformedEdges);
  const [edges, setEdges] = useState(transformedEdges);

  useEffect(() => {
    setNodes(transformedNodes);
    setEdges(transformedEdges);
  }, [transformedNodes, transformedEdges, setNodes]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchBlueprintGraph(TENANT_ID, BLUEPRINT_ID);
        setGraph(data);
      } catch (err) {
        setError('Could not connect to the mock server. Make sure it is running on http://localhost:3000');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node) => {
      // Cast through unknown to avoid TS incompatibility
      const raw = node.data as unknown;
      const nodeData = raw as FormNodeData & { graph: BlueprintGraph };
      setSelectedNodeData(nodeData);
    },
    []
  );

  const handleUpdateMapping = useCallback(
    (nodeId: string, newMapping: Record<string, NewMapping>) => {
      if (!graph) return;

      const updatedGraph: BlueprintGraph = {
        ...graph,
        nodes: graph.nodes.map((n) =>
          n.id === nodeId
            ? { ...n, data: { ...n.data, input_mapping: newMapping } }
            : n
        ),
      };
      setGraph(updatedGraph);

      if (selectedNodeData?.component_key === nodeId) {
        setSelectedNodeData((prev) =>
          prev ? { ...prev, input_mapping: newMapping, graph: updatedGraph } : null
        );
      }

      setNodes((nds) =>
        nds.map((n) => {
          const currentData = n.data as unknown as Record<string, unknown>;
          if (n.id === nodeId) {
            return {
              ...n,
              data: {
                ...currentData,
                input_mapping: newMapping,
                graph: updatedGraph,
              } as Record<string, unknown>,
            };
          }
          return {
            ...n,
            data: {
              ...currentData,
              graph: updatedGraph,
            } as Record<string, unknown>,
          };
        })
      );
    },
    [graph, selectedNodeData, setNodes]
  );

  const handleClosePanel = useCallback(() => {
    setSelectedNodeData(null);
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p className="loading-text">Loading journey blueprint...</p>
        <p className="loading-sub">Connecting to mock server at localhost:3000</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-screen">
        <div className="error-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2 className="error-title">Connection Error</h2>
        <p className="error-message">{error}</p>
        <div className="error-instructions">
          <p>To start the mock server:</p>
          <code>cd frontendchallengeserver &amp;&amp; npm start</code>
        </div>
        <button
          className="btn btn--primary"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="journey-builder">
      <header className="journey-builder__header">
        <div className="header-brand">
          <div className="header-logo">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          </div>
          <div>
            <h1 className="header-title">Journey Builder</h1>
            {graph && <p className="header-subtitle">{graph.name} &bull; {graph.category}</p>}
          </div>
        </div>
        <div className="header-actions">
          <div className="header-stat">
            <span className="header-stat__value">{graph?.nodes.length || 0}</span>
            <span className="header-stat__label">Forms</span>
          </div>
          <div className="header-stat">
            <span className="header-stat__value">{graph?.edges.length || 0}</span>
            <span className="header-stat__label">Connections</span>
          </div>
          <div className="header-badge">
            <span className="status-dot" />
            Connected
          </div>
        </div>
      </header>

      <div className="journey-builder__content">
        <div className="flow-container">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.3}
            maxZoom={2}
            proOptions={{ hideAttribution: true }}
          >
            <Controls className="flow-controls" />
            <MiniMap
              className="flow-minimap"
              nodeColor="#6366f1"
              maskColor="rgba(15, 15, 20, 0.8)"
            />
            <Background
              variant={BackgroundVariant.Dots}
              gap={20}
              size={1}
              color="rgba(99, 102, 241, 0.15)"
            />
            <Panel position="top-left" className="flow-panel-hint">
              <div className="hint-card">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                </svg>
                Click a form node to configure prefill mappings
              </div>
            </Panel>
          </ReactFlow>
        </div>

        {selectedNodeData && graph && (
          <div className="panel-container">
            <PrefillPanel
              selectedNode={selectedNodeData}
              graph={graph}
              onClose={handleClosePanel}
              onUpdateMapping={handleUpdateMapping}
            />
          </div>
        )}
      </div>
    </div>
  );
}
