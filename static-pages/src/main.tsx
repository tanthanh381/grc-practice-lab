import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "../../app/globals.css";
import GrcLab from "../../app/grc-lab";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <GrcLab />
  </StrictMode>,
);
