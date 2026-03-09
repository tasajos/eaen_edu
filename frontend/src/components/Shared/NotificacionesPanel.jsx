// src/components/Shared/NotificacionesPanel.jsx
import { useState } from "react";
import "./NotificacionesPanel.css";

const TIPO = {
  INFO:    { icon: "ℹ️",  cls: "info",    label: "Info" },
  ALERTA:  { icon: "⚠️",  cls: "alerta",  label: "Alerta" },
  URGENTE: { icon: "🚨",  cls: "urgente", label: "Urgente" },
};

/**
 * Props:
 *   notifs            — array de notifs no leídas (del hook)
 *   loading           — boolean
 *   marcarLeida       — fn(id)
 *   marcarTodasLeidas — fn()
 */
export function NotificacionesPanel({ notifs, loading, marcarLeida, marcarTodasLeidas }) {
  const [abierta, setAbierta] = useState(null);

  if (loading) return (
    <div className="np-loading"><div className="np-spin"/> Cargando...</div>
  );

  if (!notifs.length) return (
    <div className="np-empty">
      <span>🔔</span>
      <p>No tienes notificaciones pendientes</p>
      <small>Cuando lleguen nuevas notificaciones aparecerán aquí</small>
    </div>
  );

  return (
    <div className="np-wrap">
      {/* toolbar */}
      {notifs.length > 1 && (
        <div className="np-toolbar">
          <span className="np-count">
            {notifs.length} notificación{notifs.length !== 1 ? "es" : ""} sin leer
          </span>
          <button className="np-btn-all" onClick={marcarTodasLeidas}>
            ✓ Marcar todas como leídas
          </button>
        </div>
      )}

      <div className="np-list">
        {notifs.map(n => {
          const cfg     = TIPO[n.tipo] || TIPO.INFO;
          const expanded = abierta === n.id;
          return (
            <div key={n.id} className={`np-item np-${cfg.cls}${expanded ? " np-open" : ""}`}>
              <div className={`np-stripe np-stripe-${cfg.cls}`}/>

              <div className="np-body">
                {/* header — clic para expandir */}
                <div className="np-head" onClick={() => setAbierta(expanded ? null : n.id)}>
                  <span className="np-icon">{cfg.icon}</span>
                  <div className="np-text">
                    <div className="np-title">{n.titulo}</div>
                    {!expanded && (
                      <div className="np-preview">
                        {n.mensaje.length > 90 ? n.mensaje.slice(0,90)+"…" : n.mensaje}
                      </div>
                    )}
                  </div>
                  <div className="np-right">
                    <span className={`np-badge np-badge-${cfg.cls}`}>{cfg.label}</span>
                    <span className="np-date">{n.creado_en?.slice(0,10)}</span>
                    <span className="np-chevron">{expanded ? "▲" : "▼"}</span>
                  </div>
                </div>

                {/* contenido expandido */}
                {expanded && (
                  <div className="np-detail">
                    <p className="np-msg">{n.mensaje}</p>
                    {n.emisor_nombre && (
                      <p className="np-from">
                        📋 Enviado por: <strong>{n.emisor_ap_paterno} {n.emisor_nombre}</strong>
                      </p>
                    )}
                    <button
                      className="np-btn-read"
                      onClick={() => marcarLeida(n.id)}
                    >
                      ✓ Marcar como leída — no volver a mostrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Campanita para el header — muestra badge con cantidad */
export function NotifBell({ noLeidas, onClick }) {
  return (
    <button className="np-bell" onClick={onClick} title="Ver notificaciones">
      🔔
      {noLeidas > 0 && (
        <span className="np-bell-dot">{noLeidas > 99 ? "99+" : noLeidas}</span>
      )}
    </button>
  );
}