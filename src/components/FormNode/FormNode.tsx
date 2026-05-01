import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { BlueprintGraph } from '../../types';

interface FormNodeDisplayData {
  id: string;
  component_key: string;
  component_type: string;
  component_id: string;
  name: string;
  prerequisites: string[];
  permitted_roles: string[];
  input_mapping: Record<string, unknown>;
  sla_duration: { number: number; unit: string };
  approval_required: boolean;
  approval_roles: string[];
  graph: BlueprintGraph;
  [key: string]: unknown;
}

function FormNode({ data, selected }: NodeProps & { data: FormNodeDisplayData; selected?: boolean }) {
  const typedData = data as FormNodeDisplayData;
  const mappingCount = Object.keys(typedData.input_mapping || {}).length;
  const form = typedData.graph?.forms?.find((f) => f.id === typedData.component_id);
  const fieldCount = form ? Object.keys(form.field_schema?.properties || {}).length : 0;

  return (
    <div className={`form-node ${selected ? 'form-node--selected' : ''}`}>
      <Handle type="target" position={Position.Left} className="flow-handle" />

      <div className="form-node__header">
        <div className="form-node__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <span className="form-node__type">Form</span>
      </div>

      <div className="form-node__title">{typedData.name}</div>

      <div className="form-node__meta">
        <div className="form-node__badge">
          <span className="badge-dot badge-dot--blue" />
          <span>{fieldCount} field{fieldCount !== 1 ? 's' : ''}</span>
        </div>
        {mappingCount > 0 && (
          <div className="form-node__badge">
            <span className="badge-dot badge-dot--green" />
            <span>{mappingCount} prefill{mappingCount !== 1 ? 's' : ''}</span>
          </div>
        )}
        {typedData.approval_required && (
          <div className="form-node__badge">
            <span className="badge-dot badge-dot--amber" />
            <span>Approval</span>
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="flow-handle" />
    </div>
  );
}

export default memo(FormNode);
