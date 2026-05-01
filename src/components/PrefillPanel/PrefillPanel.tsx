import React, { useState, useMemo } from 'react';
import type { FormNodeData, BlueprintGraph, PrefillMapping, FieldSchemaProperty } from '../../types';

interface NewMapping {
  type: string;
  source_node_id: string;
  source_field: string;
}

interface PrefillPanelProps {
  selectedNode: FormNodeData & { graph: BlueprintGraph };
  graph: BlueprintGraph;
  onClose: () => void;
  onUpdateMapping: (nodeId: string, mapping: Record<string, NewMapping>) => void;
}

interface AncestorField {
  nodeId: string;
  nodeName: string;
  fieldId: string;
  fieldTitle: string;
}

function PrefillPanel({ selectedNode, graph, onClose, onUpdateMapping }: PrefillPanelProps) {
  const [activeTab, setActiveTab] = useState<'view' | 'add'>('view');
  const [selectedTargetField, setSelectedTargetField] = useState('');
  const [selectedSourceNode, setSelectedSourceNode] = useState('');
  const [selectedSourceField, setSelectedSourceField] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const currentForm = graph.forms.find((f) => f.id === selectedNode.component_id);
  const currentFieldSchema = currentForm?.field_schema?.properties || {};

  const ancestors = useMemo(() => {
    const adjMap: Record<string, string[]> = {};
    graph.edges.forEach((edge) => {
      if (!adjMap[edge.target]) adjMap[edge.target] = [];
      adjMap[edge.target].push(edge.source);
    });

    const visited = new Set<string>();
    const queue = [selectedNode.component_key];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;
      visited.add(current);
      (adjMap[current] || []).forEach((parent) => {
        if (!visited.has(parent)) queue.push(parent);
      });
    }
    visited.delete(selectedNode.component_key);
    return Array.from(visited);
  }, [graph, selectedNode.component_key]);

  const ancestorFields = useMemo(() => {
    const fields: AncestorField[] = [];
    ancestors.forEach((nodeId) => {
      const node = graph.nodes.find((n) => n.id === nodeId);
      if (!node) return;
      const form = graph.forms.find((f) => f.id === node.data.component_id);
      if (!form) return;
      Object.entries(form.field_schema?.properties || {}).forEach(([fieldId, fieldDef]) => {
        fields.push({
          nodeId,
          nodeName: node.data.name,
          fieldId,
          fieldTitle: (fieldDef as FieldSchemaProperty).title || fieldId,
        });
      });
    });
    return fields;
  }, [ancestors, graph]);

  const currentMappings = useMemo(() => {
    const mappings: PrefillMapping[] = [];
    Object.entries(selectedNode.input_mapping || {}).forEach(([fieldId, value]) => {
      if (value && value.source_node_id && value.source_field) {
        const sourceNode = graph.nodes.find((n) => n.id === value.source_node_id);
        const sourceForm = graph.forms.find((f) => f.id === sourceNode?.data.component_id);
        const sourceField = sourceForm?.field_schema?.properties?.[value.source_field] as FieldSchemaProperty | undefined;
        const targetField = currentFieldSchema[fieldId] as FieldSchemaProperty | undefined;

        mappings.push({
          field_id: fieldId,
          field_title: targetField?.title || fieldId,
          source_node_id: value.source_node_id,
          source_node_name: sourceNode?.data.name || value.source_node_id,
          source_field_id: value.source_field,
          source_field_title: sourceField?.title || value.source_field,
        });
      }
    });
    return mappings;
  }, [selectedNode.input_mapping, graph, currentFieldSchema]);

  const unmappedFields = useMemo(() => {
    return Object.entries(currentFieldSchema)
      .filter(([fieldId]) => {
        const m = selectedNode.input_mapping?.[fieldId];
        return !m || !m.source_node_id;
      })
      .map(([fieldId, def]) => ({
        fieldId,
        fieldTitle: (def as FieldSchemaProperty).title || fieldId,
      }));
  }, [currentFieldSchema, selectedNode.input_mapping]);

  const sourceNodeFields = useMemo(() => {
    if (!selectedSourceNode) return [];
    const node = graph.nodes.find((n) => n.id === selectedSourceNode);
    const form = graph.forms.find((f) => f.id === node?.data.component_id);
    return Object.entries(form?.field_schema?.properties || {}).map(([fieldId, def]) => ({
      fieldId,
      fieldTitle: (def as FieldSchemaProperty).title || fieldId,
    }));
  }, [selectedSourceNode, graph]);

  const handleAddMapping = () => {
    if (!selectedTargetField || !selectedSourceNode || !selectedSourceField) return;

    const existingMappings: Record<string, NewMapping> = {};
    Object.entries(selectedNode.input_mapping || {}).forEach(([fieldId, val]) => {
      if (val.source_node_id && val.source_field) {
        existingMappings[fieldId] = {
          type: val.type || 'form_field',
          source_node_id: val.source_node_id,
          source_field: val.source_field,
        };
      }
    });

    const newMapping: Record<string, NewMapping> = {
      ...existingMappings,
      [selectedTargetField]: {
        type: 'form_field',
        source_node_id: selectedSourceNode,
        source_field: selectedSourceField,
      },
    };
    onUpdateMapping(selectedNode.component_key, newMapping);
    setSelectedTargetField('');
    setSelectedSourceNode('');
    setSelectedSourceField('');
    setSearchTerm('');
    setActiveTab('view');
  };

  const handleDeleteMapping = (fieldId: string) => {
    const existingMappings: Record<string, NewMapping> = {};
    Object.entries(selectedNode.input_mapping || {}).forEach(([fId, val]) => {
      if (fId !== fieldId && val.source_node_id && val.source_field) {
        existingMappings[fId] = {
          type: val.type || 'form_field',
          source_node_id: val.source_node_id,
          source_field: val.source_field,
        };
      }
    });
    onUpdateMapping(selectedNode.component_key, existingMappings);
  };

  const filteredSourceFields = sourceNodeFields.filter(
    (f) =>
      f.fieldTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.fieldId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedByNode = ancestorFields.reduce<Record<string, AncestorField[]>>((acc, f) => {
    if (!acc[f.nodeId]) acc[f.nodeId] = [];
    acc[f.nodeId].push(f);
    return acc;
  }, {});

  return (
    <div className="prefill-panel">
      <div className="prefill-panel__header">
        <div className="prefill-panel__title-row">
          <div className="prefill-panel__icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </div>
          <div>
            <h2 className="prefill-panel__title">Prefill Mapping</h2>
            <p className="prefill-panel__subtitle">{selectedNode.name}</p>
          </div>
        </div>
        <button className="prefill-panel__close" onClick={onClose} aria-label="Close panel">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="prefill-panel__tabs">
        <button
          className={`prefill-panel__tab ${activeTab === 'view' ? 'prefill-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('view')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Current Mappings
          {currentMappings.length > 0 && (
            <span className="tab-badge">{currentMappings.length}</span>
          )}
        </button>
        <button
          className={`prefill-panel__tab ${activeTab === 'add' ? 'prefill-panel__tab--active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Mapping
        </button>
      </div>

      <div className="prefill-panel__body">
        {activeTab === 'view' && (
          <div className="prefill-view">
            {currentMappings.length === 0 ? (
              <div className="prefill-empty">
                <div className="prefill-empty__icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 17H7A5 5 0 0 1 7 7h2" />
                    <path d="M15 7h2a5 5 0 1 1 0 10h-2" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </div>
                <p className="prefill-empty__title">No prefill mappings yet</p>
                <p className="prefill-empty__desc">
                  Add mappings to prefill fields in this form from upstream forms.
                </p>
                <button className="btn btn--primary btn--sm" onClick={() => setActiveTab('add')}>
                  Add First Mapping
                </button>
              </div>
            ) : (
              <div className="mapping-list">
                {currentMappings.map((m) => (
                  <div key={m.field_id} className="mapping-card">
                    <div className="mapping-card__target">
                      <span className="mapping-label">This form field</span>
                      <span className="mapping-field">{m.field_title}</span>
                    </div>
                    <div className="mapping-card__arrow">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>
                    </div>
                    <div className="mapping-card__source">
                      <span className="mapping-label">From</span>
                      <span className="mapping-node">{m.source_node_name}</span>
                      <span className="mapping-field-small">{m.source_field_title}</span>
                    </div>
                    <button
                      className="mapping-card__delete"
                      onClick={() => handleDeleteMapping(m.field_id)}
                      title="Remove mapping"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'add' && (
          <div className="prefill-add">
            {ancestors.length === 0 ? (
              <div className="prefill-empty">
                <div className="prefill-empty__icon">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <p className="prefill-empty__title">No upstream forms</p>
                <p className="prefill-empty__desc">
                  This form has no predecessor forms so there are no fields available to prefill from.
                </p>
              </div>
            ) : (
              <div className="add-mapping-form">
                <div className="form-section">
                  <label className="form-label">
                    <span className="form-label__num">1</span>
                    Target Field (this form)
                  </label>
                  <select
                    className="form-select"
                    value={selectedTargetField}
                    onChange={(e) => setSelectedTargetField(e.target.value)}
                  >
                    <option value="">Select a field to prefill...</option>
                    {unmappedFields.map((f) => (
                      <option key={f.fieldId} value={f.fieldId}>
                        {f.fieldTitle}
                      </option>
                    ))}
                    {currentMappings.map((m) => (
                      <option key={m.field_id} value={m.field_id}>
                        {m.field_title} (already mapped)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-section">
                  <label className="form-label">
                    <span className="form-label__num">2</span>
                    Source Form
                  </label>
                  <select
                    className="form-select"
                    value={selectedSourceNode}
                    onChange={(e) => {
                      setSelectedSourceNode(e.target.value);
                      setSelectedSourceField('');
                      setSearchTerm('');
                    }}
                  >
                    <option value="">Select a source form...</option>
                    {ancestors.map((nodeId) => {
                      const node = graph.nodes.find((n) => n.id === nodeId);
                      return (
                        <option key={nodeId} value={nodeId}>
                          {node?.data.name || nodeId}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {selectedSourceNode && (
                  <div className="form-section">
                    <label className="form-label">
                      <span className="form-label__num">3</span>
                      Source Field
                    </label>
                    <div className="search-wrapper">
                      <svg className="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                      <input
                        type="text"
                        className="form-input search-input"
                        placeholder="Search fields..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                    <div className="field-picker">
                      {(() => {
                        const node = graph.nodes.find((n) => n.id === selectedSourceNode);
                        return (
                          <React.Fragment>
                            <div className="field-picker__group-label">{node?.data.name}</div>
                            {filteredSourceFields.map((f) => (
                              <button
                                key={f.fieldId}
                                className={`field-picker__item ${selectedSourceField === f.fieldId ? 'field-picker__item--selected' : ''}`}
                                onClick={() => setSelectedSourceField(f.fieldId)}
                              >
                                <span className="field-picker__name">{f.fieldTitle}</span>
                                <span className="field-picker__id">{f.fieldId}</span>
                                {selectedSourceField === f.fieldId && (
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            ))}
                            {filteredSourceFields.length === 0 && searchTerm && (
                              <div className="field-picker__empty">No fields match "{searchTerm}"</div>
                            )}
                          </React.Fragment>
                        );
                      })()}
                    </div>
                  </div>
                )}

                <button
                  className="btn btn--primary btn--full"
                  onClick={handleAddMapping}
                  disabled={!selectedTargetField || !selectedSourceNode || !selectedSourceField}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Add Prefill Mapping
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PrefillPanel;
