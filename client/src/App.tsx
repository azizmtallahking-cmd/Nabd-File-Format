/* Design: ورشة الإشارة — the app opens directly into a tactile NFF workbench, never a generic landing page. */
import { useState, useEffect } from "react";
import Home from "./pages/Home";
import { AimDraftPage } from "./pages/AimDraftPage";
import { HmDraftPage } from "./pages/HmDraftPage";
import { SettingsPage } from "./pages/SettingsPage";

type Route = { room: string; fileId?: string; mode?: 'aim' | 'hm'; returnTo?: string };

export default function App() {
  const [route, setRoute] = useState<Route>({ room: "files" });

  useEffect(() => {
    const handleHash = () => {
      // Clean hash of leading '#' and optional leading '/'
      const cleanHash = window.location.hash.replace(/^#\/?/, "");
      if (!cleanHash) {
        setRoute({ room: "files" });
        return;
      }

      // Check for query parameters anywhere in hash
      const [pathPart, queryString] = cleanHash.split("?");
      const queryParams = new URLSearchParams(queryString || "");
      const returnTo = queryParams.get("returnTo") || undefined;

      const parts = pathPart.split("/").filter(Boolean);

      if (parts[0] === "draft" && parts[1] && parts[2]) {
        setRoute({ room: "draft", mode: parts[1] as 'aim' | 'hm', fileId: parts[2] });
      } else if (parts[0] === "settings") {
        setRoute({ room: "settings", returnTo });
      } else {
        setRoute({ room: parts[0] || "files" });
      }
    };

    window.addEventListener("hashchange", handleHash);
    handleHash();
    return () => window.removeEventListener("hashchange", handleHash);
  }, []);

  const navigate = (room: string, mode?: 'aim' | 'hm', fileId?: string) => {
    if (room === "draft" && mode && fileId) {
      window.location.hash = `draft/${mode}/${fileId}`;
    } else {
      window.location.hash = room;
    }
  };

  if (route.room === "draft" && route.fileId) {
    if (route.mode === "aim") return <AimDraftPage fileId={route.fileId} onBack={() => navigate("files")} />;
    if (route.mode === "hm") return <HmDraftPage fileId={route.fileId} onBack={() => navigate("files")} />;
  }

  if (route.room === "settings") {
    return <SettingsPage returnTo={route.returnTo} onBack={() => {
      if (route.returnTo) {
        window.location.hash = route.returnTo;
      } else {
        navigate("files");
      }
    }} />;
  }

  return <Home onNavigate={navigate} currentRoom={route.room} />;
}
