import axios from 'axios';
import type { BlueprintGraph } from '../types';

const BASE_URL = 'http://localhost:3000';

export async function fetchBlueprintGraph(
  tenantId: string,
  blueprintId: string
): Promise<BlueprintGraph> {
  const url = `${BASE_URL}/api/v1/${tenantId}/actions/blueprints/${blueprintId}/graph`;
  const response = await axios.get<BlueprintGraph>(url);
  return response.data;
}
