import { useEffect, useState } from "react";
import { DiagnosticScreen } from "./diagnostic/DiagnosticScreen";
import { LogTestScreen } from "./log/LogTestScreen";

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

function Home() {
  return (
    <main className="screen">
      <header className="brand">
        <span className="brand__name">Agency Artifact</span>
        <span className="brand__sub">Home</span>
      </header>
      <p className="muted">Stage 0 test build.</p>
      <nav className="nav">
        <a href="#/log">Log half an hour (phone test)</a>
      </nav>
    </main>
  );
}

export function App() {
  const route = useHashRoute();
  if (route.startsWith("#/diagnostic")) return <DiagnosticScreen />;
  if (route.startsWith("#/log")) return <LogTestScreen />;
  return <Home />;
}
