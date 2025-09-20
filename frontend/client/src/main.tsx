import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "katex/dist/katex.min.css";
import { AuthProvider } from "./contexts/auth-context";

createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <App />
  </AuthProvider>
);
