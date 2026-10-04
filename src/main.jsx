import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app.jsx";
import "./styles/fonts.css";
import "./styles/styles.css";
import "./styles/components.css";
import "./styles/catalog.css";
import "./styles/config-editor.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
