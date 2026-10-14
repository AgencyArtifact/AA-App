// The signed-in user, from Graph.

import { graph, type GraphResult } from "./graph";

export interface Me {
  id: string; // Entra object id
  displayName: string;
  userPrincipalName: string;
}

/** Signed-in user. */
export async function getMe(): Promise<GraphResult<Me>> {
  return graph("GET", "/me?$select=id,displayName,userPrincipalName");
}
