import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => void navigator.serviceWorker.register("/sw.js"));
}

type LaunchFile = { getFile: () => Promise<File> };
type LaunchParams = { files: LaunchFile[] };
type LaunchQueue = { setConsumer: (consumer: (params: LaunchParams) => void | Promise<void>) => void };

type LaunchWindow = Window & { launchQueue?: LaunchQueue };
const launchWindow = window as LaunchWindow;
if (launchWindow.launchQueue) {
  launchWindow.launchQueue.setConsumer(async (params) => {
    const entry = params.files?.[0];
    if (!entry) return;
    const file = await entry.getFile();
    window.dispatchEvent(new CustomEvent<File>("nff:file-open", { detail: file }));
  });
}

createRoot(document.getElementById("root")!).render(<App />);
