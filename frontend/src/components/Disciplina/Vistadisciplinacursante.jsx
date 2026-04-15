import { useState, useEffect } from "react";
import "./DisciplinaJefeCurso.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function fmtFecha(f) {
  if (!f) return "—";
  const d = new Date(String(f).slice(0, 10) + "T12:00:00");
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "short", year: "numeric" });
}

export default function VistaDisciplinaCursante({ session, cursoId }) {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filtro, setFiltro]       = useState("TODOS");

  useEffect(() => {
    if (!session?.id || !cursoId) { setLoading(false); return; }
    setLoading(true);
    // Usa el endpoint historial que ya existe en server.js
    fetch(`${API}/disciplina/historial/${cursoId}/${session.id}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setRegistros(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.id, cursoId]);

  const meritos      = registros.filter(r => r.tipo === "MERITO");
  const demeritos    = registros.filter(r => r.tipo === "DEMERITO");
  const ptsMeritos   = meritos.reduce((s, r) => s + Number(r.puntos), 0);
  const ptsDemeritos = demeritos.reduce((s, r) => s + Number(r.puntos), 0);
  const saldo        = ptsMeritos - ptsDemeritos;

  const filtrados = filtro === "TODOS"
    ? registros
    : registros.filter(r => r.tipo === filtro);

  return (
    <div className="disc-wrap">
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h2 className="disc-title">⚖️ Mi Estado Disciplinario</h2>
        <p className="disc-subtitle">Registro de méritos y deméritos asignados en este curso</p>
      </div>

      {/* Tarjetas resumen */}
      <div className="disc-stats-row" style={{ marginBottom: 20 }}>
        <div className="disc-stat-card merito">
          <span style={{ fontSize: "1.5rem" }}>⭐</span>
          <span className="disc-stat-num">+{ptsMeritos.toFixed(1)}</span>
          <span className="disc-stat-lbl">Puntos de méritos</span>
          <span className="disc-stat-sub">{meritos.length} registro{meritos.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="disc-stat-card demerito">
          <span style={{ fontSize: "1.5rem" }}>⚠️</span>
          <span className="disc-stat-num">-{ptsDemeritos.toFixed(1)}</span>
          <span className="disc-stat-lbl">Puntos de deméritos</span>
          <span className="disc-stat-sub">{demeritos.length} registro{demeritos.length !== 1 ? "s" : ""}</span>
        </div>
        <div className={`disc-stat-card ${saldo > 0 ? "merito" : saldo < 0 ? "demerito" : "neutral"}`}>
          <span style={{ fontSize: "1.5rem" }}>⚖️</span>
          <span className="disc-stat-num" style={{
            color: saldo > 0 ? "#2e7d32" : saldo < 0 ? "#c62828" : "#1565c0"
          }}>
            {saldo > 0 ? "+" : ""}{saldo.toFixed(1)}
          </span>
          <span className="disc-stat-lbl">Saldo neto</span>
          <span className="disc-stat-sub">
            {saldo > 0 ? "Favorable" : saldo < 0 ? "Desfavorable" : "Sin registros"}
          </span>
        </div>
      </div>

      {/* Barra visual distribución */}
      {registros.length > 0 && (ptsMeritos + ptsDemeritos) > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{
            height: 10, borderRadius: 8, background: "#ffebee",
            overflow: "hidden", display: "flex"
          }}>
            <div style={{
              width: `${(ptsMeritos / (ptsMeritos + ptsDemeritos)) * 100}%`,
              background: "#4caf50", borderRadius: "8px 0 0 8px", transition: "width .4s"
            }} />
          </div>
          <div style={{
            display: "flex", justifyContent: "space-between",
            fontSize: "0.75rem", color: "#888", marginTop: 4
          }}>
            <span style={{ color: "#2e7d32" }}>⭐ {ptsMeritos.toFixed(1)} pts méritos</span>
            <span style={{ color: "#c62828" }}>⚠️ {ptsDemeritos.toFixed(1)} pts deméritos</span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <span style={{ fontSize: "0.82rem", color: "#888", alignSelf: "center" }}>
          Mis registros ({registros.length})
        </span>
        <div className="disc-filtro-btns">
          {[
            { key: "TODOS",    label: "Todos" },
            { key: "MERITO",   label: "⭐ Méritos" },
            { key: "DEMERITO", label: "⚠️ Deméritos" },
          ].map(f => (
            <button
              key={f.key}
              className={`disc-filtro-btn ${filtro === f.key ? "active" : ""}`}
              onClick={() => setFiltro(f.key)}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="disc-spinner"><div className="disc-ring" /></div>
      ) : filtrados.length === 0 ? (
        <div className="disc-empty">
          <span>{filtro === "MERITO" ? "⭐" : filtro === "DEMERITO" ? "⚠️" : "⚖️"}</span>
          <p>
            {filtro === "TODOS"
              ? "No tienes registros de disciplina aún."
              : `No tienes ${filtro === "MERITO" ? "méritos" : "deméritos"} registrados.`}
          </p>
        </div>
      ) : (
        <div className="disc-hist-list">
          {filtrados.map(r => (
            <div
              key={r.id}
              className={`disc-hist-item ${r.tipo === "MERITO" ? "merito" : "demerito"}`}
            >
              <div className="disc-hist-badge">
                {r.tipo === "MERITO" ? "⭐" : "⚠️"}
                <span style={{ fontWeight: 800 }}>
                  {r.tipo === "MERITO" ? "+" : "-"}{Number(r.puntos).toFixed(1)} pts
                </span>
              </div>
              <div className="disc-hist-content">
                <div className="disc-hist-desc">{r.descripcion}</div>
                <div className="disc-hist-meta">
                  {r.codigo && <span className="disc-hist-codigo">{r.codigo}</span>}
                  <span>📅 {fmtFecha(r.fecha)}</span>
                  {r.registrado_por_nombre && (
                    <span>👤 {r.registrado_por_nombre}</span>
                  )}
                </div>
                {r.observacion && (
                  <div className="disc-hist-obs">💬 {r.observacion}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
