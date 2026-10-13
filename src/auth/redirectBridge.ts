// Entry point for auth.html. Hands the sign-in response back to the
// window that opened the popup.
import { broadcastResponseToMainFrame } from "@azure/msal-browser/redirect-bridge";

void broadcastResponseToMainFrame();
