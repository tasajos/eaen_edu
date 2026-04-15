// src/hooks/useNotificaciones.js
import { useState, useEffect, useCallback } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getSession() {
  try { return JSON.parse(localStorage.getItem("eaen_session") || "null"); }
  catch { return null; }
}

export function useNotificaciones(autoRefreshSeconds = 30) {
  const session = getSession();
  const [notifs,  setNotifs]  = useState([]);
  const [loading, setLoading] = useState(true);

  const cargar = useCallback(async () => {
    if (!session?.id) return;
    try {
      const res  = await fetch(`${API}/notificaciones?usuario_id=${session.id}`);
      const data = await res.json();
      // Solo las que NO han sido leídas por este usuario
      setNotifs(Array.isArray(data) ? data.filter(n => !n.leida) : []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [session?.id]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    if (!autoRefreshSeconds) return;
    const t = setInterval(cargar, autoRefreshSeconds * 1000);
    return () => clearInterval(t);
  }, [cargar, autoRefreshSeconds]);

  // Marcar una → desaparece INMEDIATAMENTE del UI (optimistic update)
  const marcarLeida = useCallback(async (id) => {
    setNotifs(prev => prev.filter(n => n.id !== id));
    try {
      await fetch(`${API}/notificaciones/${id}/leer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuario_id: session?.id }),
      });
    } catch { cargar(); }
  }, [session?.id, cargar]);

  // Marcar TODAS → desaparecen TODAS inmediatamente
  const marcarTodasLeidas = useCallback(async () => {
    const ids = notifs.map(n => n.id);
    setNotifs([]);
    try {
      await Promise.all(ids.map(id =>
        fetch(`${API}/notificaciones/${id}/leer`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ usuario_id: session?.id }),
        })
      ));
    } catch { cargar(); }
  }, [notifs, session?.id, cargar]);

  return { notifs, loading, noLeidas: notifs.length, marcarLeida, marcarTodasLeidas };
}
