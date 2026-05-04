import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./GestionNotificaciones.css";
import SidebarJefe from "../Shared/SidebarJefe";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TIPO_LABELS = {
  INFO:    { label: "ℹ Info",     emoji: "ℹ️" },
  ALERTA:  { label: "⚠ Alerta",  emoji: "⚠️" },
  URGENTE: { label: "🚨 Urgente", emoji: "🚨" },
};

function formatDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("es-BO", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

/* ── Toast ─────────────────────────────────── */
function Toast({ msg, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3200);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div className={`notif-toast${type === "error" ? " error" : ""}`}>
      <span>{type === "error" ? "❌" : "✅"}</span>
      {msg}
    </div>
  );
}

/* ── Modal confirmación ────────────────────── */
function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>{title}</h3>
        <p>{message}</p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn-danger"    onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Formulario nueva notificación ─────────── */
function FormNuevaNotificacion({ onCreated, showToast }) {
  const [form, setForm]     = useState({ titulo: "", mensaje: "", tipo: "INFO" });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleSubmit = async () => {
    if (!form.titulo.trim())  return showToast("El título es requerido", "error");
    if (!form.mensaje.trim()) return showToast("El mensaje es requerido", "error");

    setLoading(true);
    try {
      const res = await fetch(`${API}/notificaciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: form.titulo.trim(), mensaje: form.mensaje.trim(), tipo: form.tipo }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      showToast("Notificación enviada a todos los usuarios");
      setForm({ titulo: "", mensaje: "", tipo: "INFO" });
      onCreated();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="notif-form">
      <h2 className="form-section-title">🔔 Nueva Notificación</h2>

      {/* Tipo */}
      <div className="form-group">
        <label className="form-label">Tipo de notificación <span>*</span></label>
        <div className="tipo-selector">
          {Object.entries(TIPO_LABELS).map(([k, v]) => (
            <button
              key={k}
              className={`tipo-btn${form.tipo === k ? ` selected-${k}` : ""}`}
              onClick={() => set("tipo", k)}
            >
              {v.emoji} {k}
            </button>
          ))}
        </div>
      </div>

      {/* Título */}
      <div className="form-group">
        <label className="form-label">Título <span>*</span></label>
        <input
          className="form-input"
          placeholder="Ej: Convocatoria Examen Final"
          value={form.titulo}
          onChange={(e) => set("titulo", e.target.value)}
          maxLength={255}
        />
      </div>

      {/* Mensaje */}
      <div className="form-group">
        <label className="form-label">Mensaje <span>*</span></label>
        <textarea
          className="form-textarea"
          placeholder="Redacte el contenido de la notificación..."
          value={form.mensaje}
          onChange={(e) => set("mensaje", e.target.value)}
          rows={5}
        />
      </div>

      {/* Preview */}
      {(form.titulo || form.mensaje) && (
        <div className="preview-box">
          <div className="preview-label">Vista previa</div>
          <div className={`preview-card tipo-${form.tipo}`}>
            <div className="preview-card-title">
              {TIPO_LABELS[form.tipo].emoji} {form.titulo || "Sin título"}
            </div>
            <div className="preview-card-msg">{form.mensaje || "Sin mensaje"}</div>
          </div>
        </div>
      )}

      <div className="form-actions">
        <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
          {loading ? "Enviando..." : "📤 Enviar a todos"}
        </button>
        <button className="btn-secondary" onClick={() => setForm({ titulo: "", mensaje: "", tipo: "INFO" })}>
          Limpiar
        </button>
      </div>
    </div>
  );
}

/* ── Detalle notificación ──────────────────── */
function DetalleNotificacion({ notif, onDeleted, showToast, onBack }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading]         = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/notificaciones/${notif.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error");
      showToast("Notificación eliminada");
      onDeleted();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className="notif-detail">
      {confirmOpen && (
        <ConfirmModal
          title="¿Eliminar notificación?"
          message={`Se desactivará "${notif.titulo}". Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmOpen(false)}
        />
      )}

      <div className="detail-header">
        <div className="detail-titulo">
          {TIPO_LABELS[notif.tipo]?.emoji} {notif.titulo}
        </div>
        <span className={`notif-tipo-badge badge-${notif.tipo}`}>{notif.tipo}</span>
      </div>

      <div className="detail-meta">
        <span>📅 {formatDate(notif.creado_en)}</span>
        {notif.emisor_nombre && (
          <span>👤 <strong>{notif.emisor_ap_paterno} {notif.emisor_nombre}</strong></span>
        )}
        {notif.total_leidas !== undefined && (
          <span>👁 <strong>{notif.total_leidas}</strong> lecturas</span>
        )}
      </div>

      <div className="detail-msg">{notif.mensaje}</div>

      <div className="detail-actions">
        <button className="btn-secondary" onClick={onBack}>← Volver</button>
        <button className="btn-danger" onClick={() => setConfirmOpen(true)} disabled={loading}>
          🗑 Eliminar notificación
        </button>
      </div>
    </div>
  );
}

/* ── Componente principal ──────────────────── */
export default function GestionNotificaciones() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [notifs, setNotifs]         = useState([]);
  const [stats, setStats]           = useState({ total: 0, urgentes: 0, total_usuarios: 0 });
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(null);
  const [rightTab, setRightTab]     = useState("nueva");
  const [filterTipo, setFilterTipo] = useState("TODOS");
  const [search, setSearch]         = useState("");
  const [toast, setToast]           = useState(null);

  const showToast = useCallback((msg, type = "ok") => setToast({ msg, type }), []);

  const fetchNotifs = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/notificaciones`);
      const data = await res.json();
      if (Array.isArray(data)) setNotifs(data);
    } catch {
      showToast("Error al cargar notificaciones", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/notificaciones/stats`);
      const data = await res.json();
      if (data?.total !== undefined) setStats(data);
    } catch {}
  }, []);

  useEffect(() => { fetchNotifs(); fetchStats(); }, [fetchNotifs, fetchStats]);

  const handleCreated  = () => { fetchNotifs(); fetchStats(); };
  const handleDeleted  = () => { setSelected(null); setRightTab("nueva"); fetchNotifs(); fetchStats(); };
  const handleSelect   = (n) => { setSelected(n); setRightTab("detalle"); };

  const filtered = notifs.filter((n) => {
    const matchTipo   = filterTipo === "TODOS" || n.tipo === filterTipo;
    const q           = search.toLowerCase();
    const matchSearch = !q || n.titulo.toLowerCase().includes(q) || n.mensaje.toLowerCase().includes(q);
    return matchTipo && matchSearch;
  });

  const countByTipo = (t) => notifs.filter((n) => n.tipo === t).length;

  return (
    <div className="eaen-notif-page">
      <SidebarJefe open={sidebarOpen} />
      <button className="eaen-sidebar-toggle" onClick={() => setSidebarOpen((v) => !v)}>☰</button>

      {/* Main */}
      <div className="eaen-main">
        {/* Header */}
        <header className="eaen-header">
          <img src="/eaen.png" alt="Logo EAEN" className="eaen-header-logo" />
          <h1>Gestión de Notificaciones — EAEN Avaroa</h1>
          <div className="eaen-profile">
            <div className="eaen-avatar">JE</div>
            <span>Jefe de Estudios</span>
            <button
              className="eaen-logout"
              onClick={() => { localStorage.removeItem("eaen_session"); navigate("/", { replace: true }); }}
            >
              Logout
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="notif-stats-bar">
          <div className="notif-stat-card">
            <span className="stat-icon">🔔</span>
            <div className="stat-info">
              <div className="stat-num">{stats.total}</div>
              <div className="stat-label">Notificaciones activas</div>
            </div>
          </div>
          <div className="notif-stat-card urgente">
            <span className="stat-icon">🚨</span>
            <div className="stat-info">
              <div className="stat-num">{stats.urgentes}</div>
              <div className="stat-label">Urgentes activas</div>
            </div>
          </div>
          <div className="notif-stat-card alerta">
            <span className="stat-icon">⚠️</span>
            <div className="stat-info">
              <div className="stat-num">{countByTipo("ALERTA")}</div>
              <div className="stat-label">Alertas activas</div>
            </div>
          </div>
          <div className="notif-stat-card usuarios">
            <span className="stat-icon">👥</span>
            <div className="stat-info">
              <div className="stat-num">{stats.total_usuarios}</div>
              <div className="stat-label">Usuarios activos</div>
            </div>
          </div>
        </div>

        {/* Cuerpo */}
        <div className="notif-body">
          {/* Lista */}
          <div className="notif-list-panel">
            <div className="notif-list-header">
              <span className="notif-list-title">Historial ({filtered.length})</span>
              <div className="notif-filter-tabs">
                {["TODOS", "INFO", "ALERTA", "URGENTE"].map((t) => (
                  <button
                    key={t}
                    className={`filter-tab${filterTipo === t ? " active" : ""}`}
                    onClick={() => setFilterTipo(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="notif-search">
              <input
                placeholder="Buscar notificaciones..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="notif-list-scroll">
              {loading ? (
                <div className="notif-spinner"><div className="spin" /> Cargando...</div>
              ) : filtered.length === 0 ? (
                <div className="notif-empty">
                  <span>🔕</span>
                  {search || filterTipo !== "TODOS" ? "Sin resultados" : "No hay notificaciones"}
                </div>
              ) : (
                filtered.map((n) => (
                  <div
                    key={n.id}
                    className={`notif-item${selected?.id === n.id ? " selected" : ""}`}
                    onClick={() => handleSelect(n)}
                  >
                    <div className="notif-item-top">
                      <div className={`notif-tipo-dot dot-${n.tipo}`} />
                      <div className="notif-item-titulo">{n.titulo}</div>
                      <span className={`notif-tipo-badge badge-${n.tipo}`}>{n.tipo}</span>
                    </div>
                    <div className="notif-item-meta">
                      <span>{formatDate(n.creado_en)}</span>
                      {n.total_leidas !== undefined && <span>👁 {n.total_leidas}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Panel derecho */}
          <div className="notif-right-panel">
            <div className="notif-right-tabs">
              <button
                className={`right-tab${rightTab === "nueva" ? " active" : ""}`}
                onClick={() => setRightTab("nueva")}
              >
                ➕ Nueva notificación
              </button>
              {selected && (
                <button
                  className={`right-tab${rightTab === "detalle" ? " active" : ""}`}
                  onClick={() => setRightTab("detalle")}
                >
                  📄 Detalle
                </button>
              )}
            </div>

            <div className="notif-right-content">
              {rightTab === "nueva" && (
                <FormNuevaNotificacion onCreated={handleCreated} showToast={showToast} />
              )}
              {rightTab === "detalle" && selected && (
                <DetalleNotificacion
                  notif={selected}
                  onDeleted={handleDeleted}
                  showToast={showToast}
                  onBack={() => setRightTab("nueva")}
                />
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="eaen-footer">
          <p>&copy; 2026 Escuela de Altos Estudios Nacionales. Todos los derechos reservados.</p>
        </footer>
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
