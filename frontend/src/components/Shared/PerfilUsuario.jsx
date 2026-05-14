import { useState, useEffect } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function fmtFecha(str) {
  if (!str) return "—";
  const d = new Date(str);
  if (isNaN(d)) return str;
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f1f5f9", gap: 12 }}>
      <span style={{ fontSize: 13, color: "#64748b", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#1e293b", fontWeight: 600, textAlign: "right" }}>{value || "—"}</span>
    </div>
  );
}

function SeccionLabel({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", letterSpacing: 1, textTransform: "uppercase", padding: "14px 0 4px" }}>
      {children}
    </div>
  );
}

function EyeIcon({ visible }) {
  return visible
    ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
    : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>;
}

function PasswordInput({ label, hint, value, onChange }) {
  const [visible, setVisible] = useState(false);
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: .8, textTransform: "uppercase", marginBottom: 6 }}>
        {label}{hint && <span style={{ fontWeight: 400, textTransform: "none", marginLeft: 6, color: "#94a3b8" }}>{hint}</span>}
      </div>
      <div style={{ position: "relative" }}>
        <input
          type={visible ? "text" : "password"}
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: "100%", boxSizing: "border-box", padding: "10px 42px 10px 14px",
            borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 14,
            outline: "none", background: "#f8fafc", color: "#1e293b",
          }}
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}
        >
          <EyeIcon visible={visible} />
        </button>
      </div>
    </div>
  );
}

export default function PerfilUsuario({ session, onClose }) {
  const [tab, setTab]           = useState("datos");
  const [perfil, setPerfil]     = useState(null);
  const [loadingP, setLoadingP] = useState(true);

  const [passActual,  setPassActual]  = useState("");
  const [passNueva,   setPassNueva]   = useState("");
  const [passConfirm, setPassConfirm] = useState("");
  const [passMsg,     setPassMsg]     = useState(null);
  const [passLoading, setPassLoading] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    if (!session?.ci) { setLoadingP(false); return; }
    fetch(`${API}/usuarios/ci/${session.ci}`)
      .then(r => r.json())
      .then(d => setPerfil(d))
      .catch(() => {})
      .finally(() => setLoadingP(false));
  }, [session?.ci]);

  const p      = perfil || session || {};
  const nombre = `${p.ap_paterno || ""} ${p.ap_materno || ""}, ${p.nombre || ""}`.trim();
  const rol    = p.tipo_usuario || p.rol || "";
  const grado  = p.grado || "";
  const inicial = (p.ap_paterno || p.nombre || "U")[0].toUpperCase();

  async function handleCambiarPass(e) {
    e.preventDefault();
    setPassMsg(null);
    if (!passActual.trim())                          return setPassMsg({ ok: false, text: "Ingrese su contraseña actual." });
    if (passNueva.trim().length < 6)                 return setPassMsg({ ok: false, text: "La nueva contraseña debe tener al menos 6 caracteres." });
    if (passNueva.trim() !== passConfirm.trim())     return setPassMsg({ ok: false, text: "Las contraseñas no coinciden." });
    setPassLoading(true);
    try {
      const res  = await fetch(`${API}/usuarios/${session.id}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password_actual: passActual.trim(), password_nueva: passNueva.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return setPassMsg({ ok: false, text: data.message || "Error al cambiar contraseña." });
      setPassMsg({ ok: true, text: "Contraseña actualizada correctamente." });
      setPassActual(""); setPassNueva(""); setPassConfirm("");
    } catch {
      setPassMsg({ ok: false, text: "Error de conexión." });
    } finally {
      setPassLoading(false);
    }
  }

  const tabStyle = active => ({
    flex: 1, padding: "12px 0", fontSize: 14, fontWeight: 600, cursor: "pointer",
    background: "none", border: "none", borderBottom: active ? "2.5px solid #3b82f6" : "2.5px solid transparent",
    color: active ? "#3b82f6" : "#64748b", transition: "all .2s",
  });

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 20, backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        style={{ background: "#fff", borderRadius: 16, width: "100%", maxWidth: 420, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,.4)", overflow: "hidden" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ background: "#0f172a", padding: "24px 20px 20px", position: "relative" }}>
          <button
            onClick={onClose}
            style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#fff", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}
          >×</button>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 52, height: 52, borderRadius: "50%", background: "linear-gradient(135deg,#f97316,#ea580c)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
              {inicial}
            </div>
            <div style={{ overflow: "hidden" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nombre}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{[grado, rol].filter(Boolean).join(" · ")}</div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", background: "#fff" }}>
          <button style={tabStyle(tab === "datos")}   onClick={() => setTab("datos")}>👤 Mis datos</button>
          <button style={tabStyle(tab === "pass")}    onClick={() => setTab("pass")}>🔒 Cambiar contraseña</button>
        </div>

        {/* Content */}
        <div style={{ overflowY: "auto", flex: 1, padding: "4px 20px 24px" }}>

          {tab === "datos" && (
            loadingP
              ? <div style={{ textAlign: "center", padding: 40, color: "#94a3b8" }}>Cargando...</div>
              : <>
                  <SeccionLabel>Identificación</SeccionLabel>
                  <Row label="CI"                value={p.ci} />
                  <Row label="EX"                value={p.ex} />
                  <Row label="Apellido paterno"  value={p.ap_paterno} />
                  <Row label="Apellido materno"  value={p.ap_materno} />
                  <Row label="Nombre"            value={p.nombre} />
                  <Row label="Grado / Profesión" value={p.grado} />
                  <Row label="Fecha nacimiento"  value={fmtFecha(p.fecha_nacimiento)} />

                  <SeccionLabel>Contacto y Trabajo</SeccionLabel>
                  <Row label="Correo"           value={p.correo} />
                  <Row label="Email"            value={p.email} />
                  <Row label="Teléfono"         value={p.telefono} />
                  <Row label="Lugar de trabajo" value={p.lugar_trabajo} />
                  <Row label="Filial"           value={p.filial} />
                  <Row label="Fuerza"           value={p.fuerza} />
                  <Row label="Turno"            value={p.turno} />

                  <SeccionLabel>Inscripción</SeccionLabel>
                  <Row label="Fecha inscripción" value={fmtFecha(p.fecha_inscripcion)} />
                  <Row label="Estado"            value={p.estado} />
                </>
          )}

          {tab === "pass" && (
            <form onSubmit={handleCambiarPass} style={{ paddingTop: 16 }}>
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#1d4ed8", lineHeight: 1.5 }}>
                Ingresa tu contraseña actual y luego la nueva contraseña.
              </div>
              <PasswordInput label="Contraseña actual"        value={passActual}  onChange={setPassActual} />
              <PasswordInput label="Nueva contraseña"         hint="(min. 6 caracteres)" value={passNueva}   onChange={setPassNueva} />
              <PasswordInput label="Confirmar nueva contraseña" value={passConfirm} onChange={setPassConfirm} />

              {passMsg && (
                <div style={{ padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 600, background: passMsg.ok ? "#f0fdf4" : "#fef2f2", color: passMsg.ok ? "#15803d" : "#b91c1c", border: `1px solid ${passMsg.ok ? "#bbf7d0" : "#fecaca"}` }}>
                  {passMsg.text}
                </div>
              )}

              <button
                type="submit"
                disabled={passLoading}
                style={{ width: "100%", padding: "13px 0", borderRadius: 10, background: passLoading ? "#475569" : "#0f172a", color: "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: passLoading ? "not-allowed" : "pointer" }}
              >
                {passLoading ? "Actualizando..." : "🔒 Actualizar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
