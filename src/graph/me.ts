// The signed-in user, from Graph.

import { graph, type GraphResult } from "./graph";

export interface Me {
  id: string; // Entra object id
  displayName: string;
  userPrincipalName: string;
  /** Primary email; null for accounts without a mailbox. PersonEmail uses it first. */
  mail: string | null;
}

/** Signed-in user. */
export async function getMe(): Promise<GraphResult<Me>> {
  return graph("GET", "/me?$select=id,displayName,userPrincipalName,mail");
}
