export interface SLADuration {
  number: number;
  unit: string;
}

export interface InputMappingValue {
  type: string;
  source_node_id?: string;
  source_field?: string;
  value?: string;
}

export interface FormNodeData {
  id: string;
  component_key: string;
  component_type: string;
  component_id: string;
  name: string;
  prerequisites: string[];
  permitted_roles: string[];
  input_mapping: Record<string, InputMappingValue>;
  sla_duration: SLADuration;
  approval_required: boolean;
  approval_roles: string[];
}

export interface GraphNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: FormNodeData;
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface FieldSchemaProperty {
  avantos_type: string;
  title?: string;
  type: string;
  format?: string;
  items?: {
    enum: string[];
    type: string;
  };
  uniqueItems?: boolean;
  enum?: unknown[] | null;
}

export interface FieldSchema {
  type: string;
  properties: Record<string, FieldSchemaProperty>;
  required: string[];
}

export interface UISchemaElement {
  type: string;
  scope: string;
  label: string;
  options?: Record<string, unknown>;
}

export interface UISchema {
  type: string;
  elements: UISchemaElement[];
}

export interface FormDefinition {
  id: string;
  name: string;
  description: string;
  is_reusable: boolean;
  field_schema: FieldSchema;
  ui_schema: UISchema;
  dynamic_field_config: Record<string, unknown>;
}

export interface BlueprintGraph {
  $schema: string;
  id: string;
  tenant_id: string;
  name: string;
  description: string;
  category: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  forms: FormDefinition[];
  branches: unknown[];
  triggers: unknown[];
}

export interface PrefillMapping {
  field_id: string;
  field_title: string;
  source_node_id: string;
  source_node_name: string;
  source_field_id: string;
  source_field_title: string;
}
