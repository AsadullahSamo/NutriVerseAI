import React from "react"
import { createRoot } from "react-dom/client"
import App from "./App.jsx"
import "./index.css"
import "./styles/dropdown-options.css"
import "./lib/modal-fix.js"

const root = createRoot(document.getElementById("root"))

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
