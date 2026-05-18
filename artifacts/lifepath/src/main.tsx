import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Wire auth token to all generated API client calls
setAuthTokenGetter(() => localStorage.getItem("lifepath_token"));

createRoot(document.getElementById("root")!).render(<App />);
