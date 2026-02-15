import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./LoginEAEN.css";

export default function LoginEAEN() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ Si ya existe sesión, redirigir automáticamente
  useEffect(() => {
    const session = localStorage.getItem("eaen_session");
    if (session) {
      navigate("/dashboard-jefe");
    }
  }, [navigate]);

  const canSubmit = useMemo(() => {
    return username.trim().length > 0 && password.trim().length > 0 && !loading;
  }, [username, password, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      alert("Por favor, complete todos los campos.");
      return;
    }

    // ✅ Simulación de autenticación
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      const fakeSession = {
        username: username.trim(),
        role: "JEFE_ESTUDIOS",
        loginTime: new Date().toISOString(),
      };

      // Guardamos sesión
      localStorage.setItem("eaen_session", JSON.stringify(fakeSession));

      // Redirigir al dashboard
      navigate("/dashboard-jefe");
    }, 600);
  };

  return (
    <div className="eaen-login-page">
      <div className="login-container">
        <header className="login-header">
          {/* Imagen desde public */}
          <img
            src="/eaen.png"
            alt="Logo Escuela de Altos Estudios Nacionales"
            className="eaen-logo"
          />

          <h1>Bienvenido al Sistema Universitario EAEN - Avaroa</h1>
          <p>
            Formación de Oficiales Militares Superiores y Personal Civil - Nivel
            Postgrado
          </p>
        </header>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="username">Usuario:</label>
          <div className="input-group">
            <input
              type="text"
              id="username"
              placeholder="Ingrese su usuario"
              autoComplete="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <label htmlFor="password">Contraseña:</label>
          <div className="input-group">
            <input
              type={showPwd ? "text" : "password"}
              id="password"
              placeholder="Ingrese su contraseña"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              className="toggle-password"
              onClick={() => setShowPwd((v) => !v)}
              aria-label="Mostrar u ocultar contraseña"
            >
              {showPwd ? "🙈" : "👁️"}
            </button>
          </div>

          <button type="submit" className="login-button" disabled={!canSubmit}>
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>

        <footer className="login-footer">
          <a href="#" onClick={(e) => e.preventDefault()}>
            ¿Olvidaste tu contraseña?
          </a>
          <p>
            &copy; 2026 Escuela de Altos Estudios Nacionales - Desarrollado por
            Carlos Azcarraga - Chakuy Software.
          </p>
        </footer>
      </div>
    </div>
  );
}
