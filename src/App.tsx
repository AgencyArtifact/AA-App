import { useEffect, useState } from "react";
import { DiagnosticScreen } from "./diagnostic/DiagnosticScreen";
import { TaskScreen } from "./tasks/TaskScreen";

// Hash routes: they work on a static host (GitHub Pages) without server rewrites.
function useHashRoute(): string {
  const [route, setRoute] = useState(window.location.hash || "#/");
  useEffect(() => {
    const onChange = () => setRoute(window.location.hash || "#/");
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

export function App() {
  const route = useHashRoute();
  if (route.startsWith("#/diagnostic")) return <DiagnosticScreen />;
  // The one screen (decision 15). The diagnostic stays reachable until T8 passes.
  return <TaskScreen />;
}
