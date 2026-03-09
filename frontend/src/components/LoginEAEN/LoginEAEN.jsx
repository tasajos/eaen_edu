import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginEAEN.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Mapa de rol → ruta del dashboard
const DASHBOARD_POR_ROL = {
  JEFE_ESTUDIOS:  "/dashboard-jefe",
  DOCENTE:        "/dashboard-docente",
  CURSANTE:       "/dashboard-cursante",
  JEFE_CURSO:     "/dashboard-jefe-curso",
};

function getDashboard(session) {
  if (!session) return "/";
  const tipo = String(session.tipo_usuario || "").trim();
  const rol  = String(session.rol || "").trim().toUpperCase();

  // Prioridad: tipo_usuario primero, luego campo rol
  if (tipo === "Cursante")     return DASHBOARD_POR_ROL.CURSANTE;
  if (rol  === "JEFE_ESTUDIOS") return DASHBOARD_POR_ROL.JEFE_ESTUDIOS;
  if (rol  === "DOCENTE")       return DASHBOARD_POR_ROL.DOCENTE;
  if (rol  === "JEFE_CURSO")    return DASHBOARD_POR_ROL.JEFE_CURSO;

  // fallback a jefe si no hay tipo claro (admin)
  return DASHBOARD_POR_ROL.JEFE_ESTUDIOS;
}

export default function LoginEAEN() {
  const navigate = useNavigate();
  const [ci,       setCi]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd,  setShowPwd]  = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  // Si ya hay sesión activa, redirigir al dashboard correspondiente
  useEffect(() => {
    try {
      const raw = localStorage.getItem("eaen_session");
      if (raw) {
        const session = JSON.parse(raw);
        navigate(getDashboard(session), { replace: true });
      }
    } catch { localStorage.removeItem("eaen_session"); }
  }, [navigate]);

  const canSubmit = useMemo(
    () => ci.trim().length > 0 && password.trim().length > 0 && !loading,
    [ci, password, loading]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ci: ci.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Credenciales incorrectas.");
        return;
      }
      // Guardar sesión completa
      localStorage.setItem("eaen_session", JSON.stringify(data.usuario));
      navigate(getDashboard(data.usuario), { replace: true });
    } catch {
      setError("No se pudo conectar con el servidor. Verifique su conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eaen-login-page">
      {/* Fondo decorativo */}
      <div className="login-bg-shapes">
        <div className="shape shape-1" />
        <div className="shape shape-2" />
        <div className="shape shape-3" />
      </div>

      <div className="login-container">
        {/* Franja superior de color */}
        <div className="login-top-bar" />

        <header className="login-header">
          <img src="/eaen.png" alt="Logo EAEN" className="eaen-logo" />
          <h1>Sistema Universitario EAEN</h1>
          <p>Escuela de Altos Estudios Nacionales — Avaroa</p>
          <p className="login-subtitle">Formación de Oficiales Militares Superiores y Personal Civil · Nivel Postgrado</p>
        </header>

        {error && (
          <div className="login-error" role="alert">
            <span>⚠️</span> {error}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <div className="field-group">
            <label htmlFor="ci">Carnet de Identidad</label>
            <div className="input-wrap">
              <span className="input-icon">🪪</span>
              <input
                type="text"
                id="ci"
                placeholder="Número de CI"
                autoComplete="username"
                value={ci}
                onChange={e => { setCi(e.target.value); setError(""); }}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="field-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-wrap">
              <span className="input-icon">🔒</span>
              <input
                type={showPwd ? "text" : "password"}
                id="password"
                placeholder="Contraseña"
                autoComplete="current-password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                disabled={loading}
                required
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
                aria-label="Mostrar u ocultar contraseña"
              >
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={!canSubmit}>
            {loading
              ? <><span className="spinner-ring" /> Verificando...</>
              : "Iniciar Sesión"}
          </button>
        </form>

        {/* Badges de roles disponibles */}
        <div className="roles-hint">
          <span className="roles-label">Acceso por rol:</span>
          {[
           // { icon: "🎓", label: "Jefe de Estudios" },
            //{ icon: "👨‍🏫", label: "Docente" },
            //{ icon: "🪖",  label: "Jefe de Curso" },
            //{ icon: "📚",  label: "Cursante" },
          ].map(r => (
            <span key={r.label} className="role-badge">{r.icon} {r.label}</span>
          ))}
        </div>

        <footer className="login-footer">
          <button className="link-btn" type="button">¿Olvidaste tu contraseña?</button>
          <p>&copy; 2026 EAEN · Desarrollado por Carlos Azcarraga — Chakuy Software</p>
        </footer>
      </div>
    </div>
  );
}