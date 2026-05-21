import { useState, useEffect } from "react";
import "./PerfilUsuario.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function fmtFecha(f) {
  if (!f) return "—";
  const d = new Date(String(f).slice(0, 10) + "T12:00:00");
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const CAMPO = ({ label, value }) => (
  <div className="perf-campo">
    <span className="perf-campo-lbl">{label}</span>
    <span className="perf-campo-val">{value || "—"}</span>
  </div>
);

export default function PerfilUsuario({ session, onClose }) {
  const [tab,       setTab]       = useState("datos");
  const [datos,     setDatos]     = useState(null);
  const [loading,   setLoading]   = useState(true);

  // Cambio de contraseña
  const [pwActual,  setPwActual]  = useState("");
  const [pwNueva,   setPwNueva]   = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showActual, setShowActual] = useState(false);
  const [showNueva,  setShowNueva]  = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg,     setPwMsg]     = useState(null); // {tipo:"ok"|"error", texto}

  useEffect(() => {
    if (!session?.ci) { setLoading(false); return; }
    fetch(`${API}/usuarios/ci/${encodeURIComponent(session.ci)}`)
      .then(r => r.json())
      .then(d => setDatos(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.ci]);

  const cambiarPassword = async (e) => {
    e.preventDefault();
    setPwMsg(null);
    if (pwNueva !== pwConfirm)
      return setPwMsg({ tipo: "error", texto: "Las contraseñas nuevas no coinciden." });
    if (pwNueva.length < 6)
      return setPwMsg({ tipo: "error", texto: "La nueva contraseña debe tener al menos 6 caracteres." });
    setPwLoading(true);
    try {
      const r = await fetch(`${API}/usuarios/${session.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password_actual: pwActual, password_nueva: pwNueva }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setPwMsg({ tipo: "ok", texto: "✅ Contraseña actualizada correctamente." });
      setPwActual(""); setPwNueva(""); setPwConfirm("");
    } catch(err) {
      setPwMsg({ tipo: "error", texto: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  const iniciales = `${session?.ap_paterno?.[0] || ""}${session?.nombre?.[0] || ""}`.toUpperCase();

  return (
    <div className="perf-overlay" onClick={onClose}>
      <div className="perf-panel" onClick={e => e.stopPropagation()}>

        {/* Cabecera */}
        <div className="perf-header">
          <div className="perf-avatar">{iniciales}</div>
          <div className="perf-header-info">
            <div className="perf-nombre">
              {session?.ap_paterno} {session?.ap_materno}, {session?.nombre}
            </div>
            <div className="perf-rol">
              {session?.grado && <span>{session.grado} · </span>}
              {session?.tipo_usuario || session?.rol || "Usuario"}
            </div>
          </div>
          <button className="perf-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>

        {/* Tabs */}
        <div className="perf-tabs">
          <button
            className={`perf-tab${tab === "datos" ? " active" : ""}`}
            onClick={() => setTab("datos")}
          >👤 Mis datos</button>
          <button
            className={`perf-tab${tab === "password" ? " active" : ""}`}
            onClick={() => setTab("password")}
          >🔒 Cambiar contraseña</button>
        </div>

        {/* Contenido */}
        <div className="perf-body">

          {/* ── DATOS PERSONALES ── */}
          {tab === "datos" && (
            loading ? (
              <div className="perf-loading"><div className="perf-ring" /></div>
            ) : !datos ? (
              <p className="perf-empty">No se pudieron cargar los datos.</p>
            ) : (
              <div className="perf-secciones">
                <div className="perf-seccion">
                  <div className="perf-seccion-titulo">Identificación</div>
                  <div className="perf-campos">
                    <CAMPO label="CI"           value={datos.ci} />
                    <CAMPO label="EX"           value={datos.ex} />
                    <CAMPO label="Apellido paterno" value={datos.ap_paterno} />
                    <CAMPO label="Apellido materno" value={datos.ap_materno} />
                    <CAMPO label="Nombre"       value={datos.nombre} />
                    <CAMPO label="Grado / Profesión" value={datos.grado} />
                    <CAMPO label="Fecha nacimiento" value={fmtFecha(datos.fecha_nacimiento)} />
                  </div>
                </div>
                <div className="perf-seccion">
                  <div className="perf-seccion-titulo">Contacto y trabajo</div>
                  <div className="perf-campos">
                    <CAMPO label="Correo"       value={datos.correo} />
                    <CAMPO label="Email"        value={datos.email} />
                    <CAMPO label="Teléfono"     value={datos.telefono} />
                    <CAMPO label="Lugar de trabajo" value={datos.lugar_trabajo} />
                    <CAMPO label="Filial"       value={datos.filial} />
                    <CAMPO label="Fuerza"       value={datos.fuerza} />
                    <CAMPO label="Turno"        value={datos.turno} />
                  </div>
                </div>
                <div className="perf-seccion">
                  <div className="perf-seccion-titulo">Inscripción</div>
                  <div className="perf-campos">
                    <CAMPO label="Fecha inscripción" value={fmtFecha(datos.fecha_inscripcion)} />
                    <CAMPO label="Estado"       value={datos.estado} />
                  </div>
                </div>
              </div>
            )
          )}

          {/* ── CAMBIAR CONTRASEÑA ── */}
          {tab === "password" && (
            <form className="perf-pw-form" onSubmit={cambiarPassword}>
              <p className="perf-pw-hint">
                Ingresa tu contraseña actual y luego la nueva contraseña.
              </p>

              {/* Contraseña actual */}
              <div className="perf-pw-group">
                <label>Contraseña actual</label>
                <div className="perf-pw-input-wrap">
                  <input
                    type={showActual ? "text" : "password"}
                    value={pwActual}
                    onChange={e => setPwActual(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button type="button" className="perf-eye" onClick={() => setShowActual(v => !v)}>
                    {showActual ? "🙈" : "👁️"}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div className="perf-pw-group">
                <label>Nueva contraseña <span>(mín. 6 caracteres)</span></label>
                <div className="perf-pw-input-wrap">
                  <input
                    type={showNueva ? "text" : "password"}
                    value={pwNueva}
                    onChange={e => setPwNueva(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button type="button" className="perf-eye" onClick={() => setShowNueva(v => !v)}>
                    {showNueva ? "🙈" : "👁️"}
                  </button>
                </div>
                {/* Barra de fortaleza */}
                {pwNueva && (
                  <div className="perf-strength">
                    <div className={`perf-strength-bar ${
                      pwNueva.length < 6 ? "weak" :
                      pwNueva.length < 10 ? "medium" : "strong"
                    }`} style={{width: Math.min(100, pwNueva.length * 8) + "%"}} />
                    <span>{pwNueva.length < 6 ? "Débil" : pwNueva.length < 10 ? "Media" : "Fuerte"}</span>
                  </div>
                )}
              </div>

              {/* Confirmar */}
              <div className="perf-pw-group">
                <label>Confirmar nueva contraseña</label>
                <div className="perf-pw-input-wrap">
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={e => setPwConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="new-password"
                  />
                  {pwConfirm && (
                    <span className="perf-match-icon">
                      {pwNueva === pwConfirm ? "✅" : "❌"}
                    </span>
                  )}
                </div>
              </div>

              {/* Mensaje */}
              {pwMsg && (
                <div className={`perf-msg ${pwMsg.tipo}`}>{pwMsg.texto}</div>
              )}

              <button type="submit" className="perf-pw-submit" disabled={pwLoading}>
                {pwLoading ? "⏳ Actualizando..." : "🔒 Actualizar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
