import { useState, useEffect, useCallback, useRef } from "react";
import PerfilUsuario from "../../Shared/PerfilUsuario";
import mammoth from "mammoth";
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../../hooks/useNotificaciones";
import { NotificacionesPanel, NotifBell } from "../../Shared/NotificacionesPanel";
import "../../Shared/NotificacionesPanel.css";
import "./DashboardDocente.css";
import VistaCalendario from "../../Shared/VistaCalendario";
import "../../Shared/VistaCalendario.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

function getSession() {
  try { return JSON.parse(localStorage.getItem("eaen_session") || "null"); }
  catch { return null; }
}

// Formatea fecha ISO o date string a DD/MM/YYYY
function fmtFecha(f) {
  if (!f) return "—";
  const d = new Date(f);
  if (isNaN(d)) return f;
  return d.toLocaleDateString("es-BO", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function Spinner() {
  return <div className="doc-spinner"><div className="spin-ring"/></div>;
}

/* ══════════════════════════════════════════════════════════
   VISTA ASISTENCIA
══════════════════════════════════════════════════════════ */
function VistaAsistencia({ materia, participantes, showToast }) {
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0,10));
  const [asist, setAsist] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => setAsist(Object.fromEntries(participantes.map(p => [p.id, "P"]))), [participantes]);

  const toggle = id => {
    const o = ["P","T","A","J"];
    setAsist(prev => ({ ...prev, [id]: o[(o.indexOf(prev[id]||"P") + 1) % o.length] }));
  };

  const guardar = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/asistencia`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id: materia.curso_id, materia_id: materia.id, fecha,
          registros: participantes.map(p => ({ usuario_id: p.id, estado: asist[p.id] || "P" }))
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      showToast("✅ Asistencia registrada correctamente");
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    finally { setSaving(false); }
  };

  const B = { P:"pres", A:"aus", T:"tard", J:"just" };
  const L = { P:"Presente", A:"Ausente", T:"Tardanza", J:"Justificado" };
  const I = { P:"✅", A:"❌", T:"⏰", J:"📋" };

  return (
    <div>
      <div className="vista-toolbar">
        <div className="form-field" style={{marginBottom:0}}>
          <label>Fecha de registro</label>
          <input type="date" value={fecha} onChange={e => setFecha(e.target.value)}/>
        </div>
        <div className="asist-legend">
          {Object.entries(I).map(([k,v]) => (
            <span key={k} className={`legend-dot badge-${B[k]}`}>{v} {L[k]}</span>
          ))}
          <span style={{color:"#aaa",fontSize:11,fontStyle:"italic"}}>clic para cambiar estado</span>
        </div>
      </div>

      {!participantes.length ? <p className="empty-msg">No hay participantes en este curso.</p> : (
        <div className="doc-table-wrap">
          <table className="doc-table">
            <thead>
              <tr><th>#</th><th>Participante</th><th>CI</th><th>Estado</th><th style={{textAlign:"center"}}>Acción</th></tr>
            </thead>
            <tbody>
              {participantes.map((p, i) => {
                const e = asist[p.id] || "P";
                return (
                  <tr key={p.id}>
                    <td className="muted">{i+1}</td>
                    <td className="bold">{p.ap_paterno} {p.ap_materno}, {p.nombre}</td>
                    <td className="muted">{p.ci}</td>
                    <td><span className={`badge badge-${B[e]}`}>{L[e]}</span></td>
                    <td style={{textAlign:"center"}}>
                      <button className={`asist-toggle asist-${e}`} onClick={() => toggle(p.id)} title="Clic para cambiar">{I[e]}</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="vista-footer">
        <button className="btn-primary" onClick={guardar} disabled={saving}>
          {saving ? "Guardando..." : "💾 Guardar asistencia"}
        </button>
        <button className="btn-ghost" onClick={() => setAsist(Object.fromEntries(participantes.map(p => [p.id,"P"])))}>
          Marcar todos presentes
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VISTA CALIFICACIONES — Sistema SHD (Saber / Hacer / Decidir)
══════════════════════════════════════════════════════════ */

const SHD_CONFIG = [
  {
    dim: "SABER", peso: 30, color: "#1565c0", bg: "#e3f2fd", border: "#90caf9",
    secciones: [
      { nombre: "RESOLUCIÓN DE PROBLEMAS", indicadores: [
        { codigo:"a", nombre:"Investigación con Profundidad y acierto" },
        { codigo:"b", nombre:"Capacidad de Análisis" },
        { codigo:"c", nombre:"Acierto en la comprensión y solución" },
      ]},
      { nombre: "EXPRESIÓN ESCRITA", indicadores: [
        { codigo:"a", nombre:"Calidad y precisión en la redacción" },
        { codigo:"b", nombre:"Ortografía" },
        { codigo:"c", nombre:"Hecho coherente y con objetividad" },
      ]},
    ],
  },
  {
    dim: "HACER", peso: 40, color: "#6a1b9a", bg: "#f3e5f5", border: "#ce93d8",
    secciones: [
      { nombre: "EXPRESIÓN ORAL", indicadores: [
        { codigo:"a", nombre:"Expone sus ideas en forma clara" },
        { codigo:"b", nombre:"Coherente en el razonamiento" },
        { codigo:"c", nombre:"Capacidad de síntesis" },
        { codigo:"d", nombre:"Uso correcto de terminología" },
        { codigo:"e", nombre:"Uso correcto de recursos técnicos" },
        { codigo:"f", nombre:"Sostiene sus criterios con seguridad" },
        { codigo:"g", nombre:"Prueba o sustentación oral individual" },
      ]},
    ],
  },
  {
    dim: "DECIDIR", peso: 20, color: "#2e7d32", bg: "#e8f5e9", border: "#a5d6a7",
    secciones: [
      { nombre: "ACTUACIÓN EN GRUPOS", indicadores: [
        { codigo:"a", nombre:"Aporte de Información" },
        { codigo:"b", nombre:"Dominio de técnicas de dinámica de grupo" },
        { codigo:"c", nombre:"Capacidad de Organización" },
      ]},
      { nombre: "TOMA DE DECISIONES", indicadores: [
        { codigo:"a", nombre:"Aprecia los hechos objetivamente" },
        { codigo:"b", nombre:"Decide con acierto" },
      ]},
    ],
  },
];

function VistaCalificaciones({ materia, participantes, showToast }) {
  const [indicadores, setIndicadores] = useState([]);
  const [notas,       setNotas]       = useState({});
  const [bloqueados,  setBloqueados]  = useState({});
  const [saving,         setSaving]         = useState({});
  const [savingBorrador, setSavingBorrador] = useState({});
  const [confirmUid,     setConfirmUid]     = useState(null);
  const [dimActiva,   setDimActiva]   = useState("SABER");
  const [facDatos,    setFacDatos]    = useState({});
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    if (!materia?.id) return;
    setLoading(true);
    Promise.all([
      fetch(`${API}/shd/indicadores`).then(r => r.json()).catch(() => []),
      fetch(`${API}/shd/notas/materia/${materia.id}`).then(r => r.json()).catch(() => null),
      fetch(`${API}/eval-facilitador/materia/${materia.id}`).then(r => r.json()).catch(() => []),
    ]).then(([inds, libro, fac]) => {
      setIndicadores(Array.isArray(inds) ? inds : []);
      if (libro?.libro) {
        const m = {}, bl = {};
        libro.libro.forEach(p => {
          m[p.usuario_id] = p.notas || {};
          if (p.bloqueado) bl[p.usuario_id] = true;
        });
        setNotas(m);
        setBloqueados(bl);
      }
      if (Array.isArray(fac)) {
        const mf = {};
        fac.forEach(ev => { mf[ev.cursante_id] = { promedio: Number(ev.promedio), ponderaje: Number(ev.ponderaje) }; });
        setFacDatos(mf);
      }
    }).finally(() => setLoading(false));
  }, [materia?.id]);

  // Busca el id del indicador en el catálogo del servidor
  const getIndicadorId = (dim, codigo, nombre) => {
    const ind = indicadores.find(i =>
      i.dimension === dim && i.codigo === codigo &&
      i.nombre.toLowerCase().trim() === nombre.toLowerCase().trim()
    ) || indicadores.find(i => i.dimension === dim && i.codigo === codigo);
    return ind?.id ?? `${dim}_${codigo}`;
  };

  const getNota = (uid, indId) => Number(notas[uid]?.[indId] ?? 0);

  const setNota = (uid, indId, val) => {
    setNotas(prev => ({
      ...prev,
      [uid]: { ...prev[uid], [indId]: Math.min(100, Math.max(0, Number(val) || 0)) }
    }));
  };

  // Promedio de una dimensión para un cursante (0-100)
  const promDim = (uid, dim) => {
    const inds = indicadores.filter(i => i.dimension === dim);
    if (!inds.length) return 0;
    return inds.reduce((a, i) => a + getNota(uid, i.id), 0) / inds.length;
  };

  // Aporte de la dimensión a los 90 pts
  const aporteDim = (uid, dim) => {
    const cfg = SHD_CONFIG.find(c => c.dim === dim);
    return promDim(uid, dim) * (cfg?.peso ?? 0) / 100;
  };

  // Total catedrático (SABER+HACER+DECIDIR) → 0-90
  const promCatedratico = uid =>
    aporteDim(uid, "SABER") + aporteDim(uid, "HACER") + aporteDim(uid, "DECIDIR");

  const getFacPonderaje = uid => facDatos[uid]?.ponderaje != null ? Number(facDatos[uid].ponderaje) : null;
  const getFacPromedio  = uid => facDatos[uid]?.promedio  != null ? Number(facDatos[uid].promedio)  : null;

  const postNotas = async (uid, bloquear) => {
    const r = await fetch(`${API}/shd/notas/usuario`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        curso_id:   materia.curso_id,
        materia_id: materia.id,
        usuario_id: uid,
        notas:      notas[uid] || {},
        bloquear,
      }),
    });
    const d = await r.json();
    if (!r.ok) throw new Error(d.message);
    return d;
  };

  // Guardar borrador (sin bloquear) — disponible en cualquier tab
  const guardarBorrador = async (uid) => {
    setSavingBorrador(p => ({ ...p, [uid]: true }));
    try {
      await postNotas(uid, false);
      showToast("💾 Borrador guardado");
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    finally { setSavingBorrador(p => ({ ...p, [uid]: false })); }
  };

  // Guardar y bloquear — acción definitiva desde el modal de confirmación
  const guardarUsuario = async (uid) => {
    setSaving(p => ({ ...p, [uid]: true }));
    try {
      await postNotas(uid, true);
      setBloqueados(p => ({ ...p, [uid]: true }));
      showToast("✅ Calificaciones registradas y bloqueadas");
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    finally { setSaving(p => ({ ...p, [uid]: false })); setConfirmUid(null); }
  };

  const MIN_APRO = 63; // 70% de 90 pts
  const confirmParticipante = participantes.find(p => p.id === confirmUid);
  const totalBloqueados = Object.keys(bloqueados).length;
  const dimCfg = SHD_CONFIG.find(c => c.dim === dimActiva);

  return (
    <div>
      {/* ── Modal confirmación ── */}
      {confirmUid && confirmParticipante && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.6)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:2000, backdropFilter:"blur(4px)"
        }}>
          <div style={{
            background:"#fff", borderRadius:20, padding:"36px 40px",
            maxWidth:480, width:"92%", boxShadow:"0 24px 80px rgba(0,0,0,0.28)",
            display:"flex", flexDirection:"column", alignItems:"center", gap:18, textAlign:"center"
          }}>
            <div style={{fontSize:52}}>🔒</div>
            <div>
              <div style={{fontSize:19, fontWeight:800, color:"#003366", marginBottom:6}}>
                ¿Registrar calificaciones?
              </div>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background:"#e3f2fd", padding:"8px 16px", borderRadius:20,
                fontSize:14, color:"#1565c0", fontWeight:600, marginTop:4
              }}>
                <span style={{
                  width:32, height:32, borderRadius:"50%", background:"#1565c0",
                  color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, fontSize:14, flexShrink:0
                }}>{confirmParticipante.ap_paterno?.[0]||"?"}</span>
                {confirmParticipante.ap_paterno} {confirmParticipante.ap_materno}, {confirmParticipante.nombre}
              </div>
            </div>
            <div style={{
              width:"100%", background:"#f7f9fc", borderRadius:12,
              padding:"14px 18px", textAlign:"left", border:"1.5px solid #eef2f7"
            }}>
              {SHD_CONFIG.map(cfg => {
                const pr = promDim(confirmUid, cfg.dim);
                const ap = aporteDim(confirmUid, cfg.dim);
                return (
                  <div key={cfg.dim} style={{
                    display:"flex", justifyContent:"space-between",
                    padding:"6px 0", borderBottom:"1px solid #f0f4f8", fontSize:13
                  }}>
                    <span style={{color:"#5a6a80"}}>
                      {cfg.dim} <span style={{fontSize:11,color:"#aaa"}}>({cfg.peso} pts)</span>
                    </span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontWeight:800,color:cfg.color}}>
                      {pr.toFixed(1)}/100 → {ap.toFixed(1)} pts
                    </span>
                  </div>
                );
              })}
              <div style={{
                display:"flex", justifyContent:"space-between",
                paddingTop:10, marginTop:4, fontSize:14, fontWeight:700
              }}>
                <span style={{color:"#003366"}}>Total catedrático</span>
                <span style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:18,
                  color: promCatedratico(confirmUid) >= MIN_APRO ? "#2e7d32" : "#c62828"
                }}>{promCatedratico(confirmUid).toFixed(1)} / 90</span>
              </div>
            </div>
            <div style={{
              background:"#fff8e1", border:"2px solid #ffe082", borderRadius:10,
              padding:"12px 16px", fontSize:13, color:"#b45309",
              lineHeight:1.6, width:"100%", textAlign:"left"
            }}>
              ⚠️ <strong>Esta acción es permanente.</strong> Las notas quedarán
              bloqueadas en el sistema.
            </div>
            <div style={{display:"flex", gap:10, width:"100%"}}>
              <button onClick={() => guardarUsuario(confirmUid)} disabled={saving[confirmUid]} style={{
                flex:1, padding:"12px 0", background:"#003366", color:"#fff",
                border:"none", borderRadius:10, fontSize:14, fontWeight:700,
                cursor:saving[confirmUid]?"not-allowed":"pointer",
                opacity:saving[confirmUid]?.65:1, fontFamily:"inherit"
              }}>
                {saving[confirmUid] ? "⏳ Guardando..." : "✅ Confirmar y bloquear"}
              </button>
              <button onClick={() => setConfirmUid(null)} style={{
                flex:1, padding:"12px 0", background:"transparent", color:"#5a6a80",
                border:"2px solid #e8ecf2", borderRadius:10, fontSize:13.5,
                fontWeight:600, cursor:"pointer", fontFamily:"inherit"
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Banner pesos */}
      <div style={{
        display:"flex", flexWrap:"wrap", gap:8, marginBottom:16,
        background:"#f0f4ff", borderRadius:10, padding:"10px 16px",
        fontSize:12, color:"#003366", border:"1.5px solid #c5cae9"
      }}>
        <span style={{fontWeight:700, marginRight:4}}>Sistema de calificación:</span>
        <span style={{background:"#1565c0",color:"#fff",padding:"2px 10px",borderRadius:20}}>
          📘 SABER <strong>30 pts</strong>
        </span>
        <span style={{background:"#6a1b9a",color:"#fff",padding:"2px 10px",borderRadius:20}}>
          ✋ HACER <strong>40 pts</strong>
        </span>
        <span style={{background:"#2e7d32",color:"#fff",padding:"2px 10px",borderRadius:20}}>
          🧠 DECIDIR <strong>20 pts</strong>
        </span>
        <span style={{background:"#ff6600",color:"#fff",padding:"2px 10px",borderRadius:20}}>
          🎯 Facilitador <strong>2.5 pts</strong>
        </span>
        <span style={{background:"#1565c0",color:"#fff",padding:"2px 10px",borderRadius:20,opacity:.7}}>
          👥 Cursantes <strong>5 pts</strong>
        </span>
        <span style={{background:"#2e7d32",color:"#fff",padding:"2px 10px",borderRadius:20,opacity:.7}}>
          ⚖️ Disciplina <strong>2.5 pts</strong>
        </span>
      </div>

      {totalBloqueados > 0 && (
        <div style={{
          display:"flex", alignItems:"center", gap:8,
          background:"#f3e5f5", border:"1.5px solid #ce93d8",
          borderRadius:10, padding:"9px 16px", marginBottom:14, fontSize:13, color:"#6a1b9a"
        }}>
          🔒 <strong>{totalBloqueados}</strong> de {participantes.length} cursantes con calificaciones bloqueadas.
        </div>
      )}

      {loading ? (
        <div className="doc-spinner"><div className="spin-ring"/></div>
      ) : (<>
        {/* Tabs de dimensiones */}
        <div style={{display:"flex", gap:6, marginBottom:16, flexWrap:"wrap"}}>
          {SHD_CONFIG.map(cfg => (
            <button key={cfg.dim} onClick={() => setDimActiva(cfg.dim)} style={{
              padding:"8px 20px", borderRadius:8, border:"2px solid",
              borderColor: dimActiva === cfg.dim ? cfg.color : "#e0e0e0",
              background: dimActiva === cfg.dim ? cfg.color : "#fff",
              color: dimActiva === cfg.dim ? "#fff" : "#555",
              fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit",
              transition:"all .15s"
            }}>
              {cfg.dim === "SABER" ? "📘" : cfg.dim === "HACER" ? "✋" : "🧠"} {cfg.dim} / {cfg.peso} pts
            </button>
          ))}
          <button onClick={() => setDimActiva("RESUMEN")} style={{
            padding:"8px 20px", borderRadius:8, border:"2px solid",
            borderColor: dimActiva === "RESUMEN" ? "#e65100" : "#e0e0e0",
            background: dimActiva === "RESUMEN" ? "#e65100" : "#fff",
            color: dimActiva === "RESUMEN" ? "#fff" : "#555",
            fontWeight:700, cursor:"pointer", fontSize:13, fontFamily:"inherit",
            marginLeft:"auto"
          }}>
            📊 Resumen
          </button>
        </div>

        {/* ── TABLA POR DIMENSIÓN ── */}
        {dimActiva !== "RESUMEN" && dimCfg && (
          <div className="doc-table-wrap" style={{overflowX:"auto"}}>
            <table className="doc-table">
              <thead>
                <tr>
                  <th rowSpan={2}>#</th>
                  <th rowSpan={2}>Participante</th>
                  <th rowSpan={2}>CI</th>
                  {dimCfg.secciones.map(sec => (
                    <th key={sec.nombre}
                      colSpan={sec.indicadores.length}
                      style={{textAlign:"center", background:dimCfg.bg, color:dimCfg.color, fontWeight:800, borderBottom:"1px solid "+dimCfg.border}}>
                      {sec.nombre}
                    </th>
                  ))}
                  <th rowSpan={2} style={{textAlign:"center",background:dimCfg.bg,color:dimCfg.color}}>
                    Prom<br/><span style={{fontSize:10,fontWeight:400}}>(0-100)</span>
                  </th>
                  <th rowSpan={2} style={{textAlign:"center",background:dimCfg.bg,color:dimCfg.color}}>
                    Aporte<br/><span style={{fontSize:10,fontWeight:400}}>/{dimCfg.peso} pts</span>
                  </th>
                  <th rowSpan={2} style={{textAlign:"center"}}>Acción</th>
                </tr>
                <tr>
                  {dimCfg.secciones.flatMap(sec =>
                    sec.indicadores.map(ind => {
                      const indId = getIndicadorId(dimCfg.dim, ind.codigo, ind.nombre);
                      return (
                        <th key={indId} style={{
                          textAlign:"center", minWidth:60, maxWidth:80,
                          fontWeight:600, fontSize:11, color:"#444", background:"#fafafa"
                        }} title={ind.nombre}>
                          {ind.codigo.toUpperCase()}
                          <div style={{fontSize:9,fontWeight:400,color:"#888",whiteSpace:"normal",maxWidth:70,margin:"0 auto"}}>
                            {ind.nombre.length > 22 ? ind.nombre.slice(0,20)+"…" : ind.nombre}
                          </div>
                        </th>
                      );
                    })
                  )}
                </tr>
              </thead>
              <tbody>
                {participantes.map((p, i) => {
                  const locked  = bloqueados[p.id] || false;
                  const isSaving = saving[p.id] || false;
                  const pd = promDim(p.id, dimCfg.dim);
                  const ad = aporteDim(p.id, dimCfg.dim);
                  return (
                    <tr key={p.id} style={{background: locked ? "#fafffe" : undefined}}>
                      <td className="muted">{i+1}</td>
                      <td className="bold">{p.ap_paterno} {p.ap_materno}, {p.nombre}</td>
                      <td className="muted">{p.ci}</td>
                      {dimCfg.secciones.flatMap(sec =>
                        sec.indicadores.map(ind => {
                          const indId = getIndicadorId(dimCfg.dim, ind.codigo, ind.nombre);
                          const nota = getNota(p.id, indId);
                          return (
                            <td key={indId} style={{textAlign:"center", padding:"4px"}}>
                              {locked ? (
                                <div style={{
                                  display:"inline-flex",alignItems:"center",justifyContent:"center",
                                  minWidth:50, padding:"5px 8px",
                                  background:"#f5f5f5", border:"2px solid #e0e0e0",
                                  borderRadius:7, fontWeight:700,
                                  fontFamily:"'IBM Plex Mono',monospace",
                                  color: nota>=70 ? "#2e7d32" : "#c62828", fontSize:13
                                }}>🔒 {nota}</div>
                              ) : (
                                <input
                                  type="number" min="0" max="100"
                                  className={`nota-input ${nota>=70?"nota-ap":"nota-rp"}`}
                                  style={{width:62}}
                                  value={nota}
                                  onChange={e => setNota(p.id, indId, e.target.value)}
                                />
                              )}
                            </td>
                          );
                        })
                      )}
                      <td style={{textAlign:"center"}}>
                        <strong style={{
                          fontFamily:"'IBM Plex Mono',monospace", fontSize:14,
                          color: pd>=70 ? dimCfg.color : "#c62828"
                        }}>{pd.toFixed(1)}</strong>
                      </td>
                      <td style={{textAlign:"center"}}>
                        <strong style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:dimCfg.color}}>
                          {ad.toFixed(1)}
                        </strong>
                      </td>
                      <td style={{textAlign:"center"}}>
                        {locked ? (
                          <span style={{fontSize:12,color:"#9c27b0",fontWeight:700}}>🔒 Bloqueado</span>
                        ) : (
                          <button
                            className="btn-sm btn-cal"
                            disabled={savingBorrador[p.id]}
                            onClick={() => guardarBorrador(p.id)}
                            style={{whiteSpace:"nowrap", background:"#e3f2fd", color:"#1565c0", border:"1.5px solid #90caf9"}}
                          >
                            {savingBorrador[p.id] ? "⏳..." : "💾 Borrador"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── TABLA RESUMEN ── */}
        {dimActiva === "RESUMEN" && (
          <div className="doc-table-wrap" style={{overflowX:"auto"}}>
            <table className="doc-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Participante</th>
                  <th>CI</th>
                  <th style={{textAlign:"center",background:"#e3f2fd",color:"#1565c0"}}>
                    📘 SABER<br/><span style={{fontSize:10,fontWeight:400}}>/30</span>
                  </th>
                  <th style={{textAlign:"center",background:"#f3e5f5",color:"#6a1b9a"}}>
                    ✋ HACER<br/><span style={{fontSize:10,fontWeight:400}}>/40</span>
                  </th>
                  <th style={{textAlign:"center",background:"#e8f5e9",color:"#2e7d32"}}>
                    🧠 DECIDIR<br/><span style={{fontSize:10,fontWeight:400}}>/20</span>
                  </th>
                  <th style={{textAlign:"center",background:"#fff3e0",color:"#e65100"}}>
                    🎯 Facilitador<br/><span style={{fontSize:10,fontWeight:400}}>/2.5</span>
                  </th>
                  <th style={{textAlign:"center"}}>Total<br/><span style={{fontSize:10,fontWeight:400}}>/92.5</span></th>
                  <th style={{textAlign:"center"}}>Estado</th>
                  <th style={{textAlign:"center"}}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {participantes.map((p, i) => {
                  const locked   = bloqueados[p.id] || false;
                  const isSaving = saving[p.id] || false;
                  const saber    = aporteDim(p.id, "SABER");
                  const hacer    = aporteDim(p.id, "HACER");
                  const decidir  = aporteDim(p.id, "DECIDIR");
                  const cat      = saber + hacer + decidir;
                  const facPon   = getFacPonderaje(p.id);
                  const facPr    = getFacPromedio(p.id);
                  const total    = cat + (facPon ?? 0);
                  const aprobado = cat >= MIN_APRO;
                  return (
                    <tr key={p.id} style={{background: locked ? "#fafffe" : undefined}}>
                      <td className="muted">{i+1}</td>
                      <td className="bold">{p.ap_paterno} {p.ap_materno}, {p.nombre}</td>
                      <td className="muted">{p.ci}</td>
                      <td style={{textAlign:"center"}}>
                        <strong style={{fontFamily:"'IBM Plex Mono',monospace",color:"#1565c0"}}>{saber.toFixed(1)}</strong>
                      </td>
                      <td style={{textAlign:"center"}}>
                        <strong style={{fontFamily:"'IBM Plex Mono',monospace",color:"#6a1b9a"}}>{hacer.toFixed(1)}</strong>
                      </td>
                      <td style={{textAlign:"center"}}>
                        <strong style={{fontFamily:"'IBM Plex Mono',monospace",color:"#2e7d32"}}>{decidir.toFixed(1)}</strong>
                      </td>
                      <td style={{textAlign:"center"}}>
                        {facPon === null
                          ? <span style={{color:"#9e9e9e",fontSize:12}}>—</span>
                          : <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
                              <strong style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:14,color:"#e65100"}}>{facPon.toFixed(2)}</strong>
                              {facPr !== null && <span style={{fontSize:10,color:"#888"}}>({facPr.toFixed(1)}/10)</span>}
                            </div>
                        }
                      </td>
                      <td style={{textAlign:"center"}}>
                        <strong style={{
                          color: aprobado?"#2e7d32":"#c62828",
                          fontFamily:"'IBM Plex Mono',monospace", fontSize:15
                        }}>{total.toFixed(1)}</strong>
                      </td>
                      <td style={{textAlign:"center"}}>
                        <span className={`badge ${aprobado?"badge-pres":"badge-aus"}`}>
                          {aprobado?"Aprobado":"Reprobado"}
                        </span>
                      </td>
                      <td style={{textAlign:"center"}}>
                        {locked ? (
                          <span style={{fontSize:12,color:"#9c27b0",fontWeight:700,display:"inline-flex",alignItems:"center",gap:4}}>
                            🔒 Bloqueado
                          </span>
                        ) : (
                          <div style={{display:"flex",flexDirection:"column",gap:5,alignItems:"center"}}>
                            <button
                              className="btn-sm btn-cal"
                              disabled={savingBorrador[p.id]}
                              onClick={() => guardarBorrador(p.id)}
                              style={{whiteSpace:"nowrap",background:"#e3f2fd",color:"#1565c0",border:"1.5px solid #90caf9",width:"100%"}}
                            >
                              {savingBorrador[p.id] ? "⏳..." : "💾 Borrador"}
                            </button>
                            <button
                              className="btn-sm btn-cal"
                              disabled={isSaving}
                              onClick={() => setConfirmUid(p.id)}
                              style={{whiteSpace:"nowrap",width:"100%"}}
                            >
                              {isSaving ? "⏳..." : "🔒 Bloquear"}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </>)}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VISOR DE DOCUMENTO WORD (mammoth)
══════════════════════════════════════════════════════════ */
function VisorDocumento({ archivoRuta, archivoNombre, onClose }) {
  const [html,     setHtml]     = useState("");
  const [cargando, setCargando] = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!archivoRuta) return;
    setCargando(true);
    setError(null);
    fetch(`${API}/uploads/tareas/${archivoRuta}`)
      .then(r => {
        if (!r.ok) throw new Error("No se pudo cargar el archivo");
        return r.arrayBuffer();
      })
      .then(buf => mammoth.convertToHtml({ arrayBuffer: buf }))
      .then(result => setHtml(result.value))
      .catch(e => setError(e.message))
      .finally(() => setCargando(false));
  }, [archivoRuta]);

  return (
    <div className="visor-overlay" onClick={onClose}>
      <div className="visor-modal" onClick={e => e.stopPropagation()}>
        <div className="visor-header">
          <div className="visor-titulo">
            <span>📄</span>
            <span>{archivoNombre || "Documento"}</span>
          </div>
          <button className="visor-close" onClick={onClose}>✕</button>
        </div>
        <div className="visor-body">
          {cargando && <div className="visor-loading">Cargando documento...</div>}
          {error   && <div className="visor-error">❌ {error}</div>}
          {!cargando && !error && (
            <div className="visor-content" dangerouslySetInnerHTML={{ __html: html }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VISTA FACILITADOR — El docente evalúa a cada cursante en 4 criterios fijos
   Peso fijo: 2.5% de la nota final
══════════════════════════════════════════════════════════ */
const CRITERIOS_FACILITADOR = [
  { key: "c1", label: "Aporte de información" },
  { key: "c2", label: "Aprecia los hechos objetivamente" },
  { key: "c3", label: "Decide con Acierto" },
  { key: "c4", label: "Sostiene criterios con seguridad" },
];
const OPCIONES_FAC = [1,2,3,4,5,6,7,8,9,10];

function VistaFacilitador({ materia, participantes, showToast }) {
  const session  = getSession();
  const [datos,   setDatos]   = useState({});
  const [saving,  setSaving]  = useState({});
  const [bloqueados, setBloqueados] = useState({});
  const [cargado, setCargado] = useState(false);

  useEffect(() => {
    if (!materia?.id) return;
    fetch(`${API}/eval-facilitador/materia/${materia.id}`)
      .then(r => r.json())
      .then(d => {
        if (!Array.isArray(d)) return;
        const m = {};
        const bl = {};
        d.forEach(ev => {
          m[ev.cursante_id] = { c1: ev.c1, c2: ev.c2, c3: ev.c3, c4: ev.c4 };
          if (ev.bloqueado) bl[ev.cursante_id] = true;
        });
        setDatos(m);
        setBloqueados(bl);
        setCargado(true);
      }).catch(() => setCargado(true));
  }, [materia?.id]);

  const set = (uid, key, val) => {
    if (bloqueados[uid]) return;
    setDatos(prev => ({ ...prev, [uid]: { ...prev[uid], [key]: Number(val) } }));
  };

  const valores = (uid) => {
    const d = datos[uid] || {};
    return CRITERIOS_FACILITADOR.map(c => Number(d[c.key] || 0));
  };

  const completa = (uid) => valores(uid).every(v => v >= 1 && v <= 10);

  // promedio 1-10
  const promCriterios = (uid) => {
    if (!completa(uid)) return null;
    const vals = valores(uid);
    return vals.reduce((a,b)=>a+b,0) / 4;
  };

  // ponderaje = (promedio/10) * 2.5 -> valor 0 a 2.5 sobre la nota final
  const ponderaje = (uid) => {
    const pr = promCriterios(uid);
    return pr === null ? null : (pr / 10 * 2.5).toFixed(2);
  };

  const guardarUsuario = async (uid) => {
    if (!completa(uid)) return showToast("Complete los 4 criterios antes de bloquear", "error");
    setSaving(p => ({ ...p, [uid]: true }));
    try {
      const evaluaciones = [{ cursante_id: uid, ...datos[uid] }];
      const r = await fetch(`${API}/eval-facilitador`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          curso_id: materia.curso_id,
          materia_id: materia.id,
          evaluaciones,
          registrado_por: session?.id,
          bloquear: true,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setBloqueados(p => ({ ...p, [uid]: true }));
      showToast("Evaluacion del facilitador guardada y bloqueada");
    } catch(e) { showToast(`${e.message}`, "error"); }
    finally { setSaving(p => ({ ...p, [uid]: false })); }
  };
  if (!cargado) return <div className="doc-spinner"><div className="spin-ring"/></div>;

  const totalBloq = Object.keys(bloqueados).length;

  return (
    <div>
      {/* Banner info */}
      <div style={{ display:"flex", flexWrap:"wrap", alignItems:"center", justifyContent:"space-between",
        background:"#f0f4ff", borderRadius:10, padding:"10px 16px", marginBottom:16,
        fontSize:13, color:"#003366", gap:8 }}>
        <div>
          <strong>Evaluación del Facilitador — 2.5% de la nota final</strong>
          <div style={{ marginTop:3, color:"#5a6a80", fontSize:12 }}>
            Califica del <strong>1 al 10</strong> en cada criterio. El ponderaje se calcula sobre 2.5 puntos máximos.
          </div>
        </div>
        {totalBloq > 0 && (
          <div style={{ background:"#7b1fa2", color:"#fff", padding:"5px 14px", borderRadius:20, fontSize:12, fontWeight:700 }}>
            🔒 {totalBloq} / {participantes.length} evaluados
          </div>
        )}
      </div>

      {/* Tarjetas por cursante */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(400px, 1fr))", gap:12 }}>
        {participantes.map((p, i) => {
          const d      = datos[p.id] || {};
          const pr     = promCriterios(p.id);
          const pnd    = ponderaje(p.id);
          const locked = bloqueados[p.id] || false;
          const notaColor = pr === null ? "#9e9e9e" : pr >= 7 ? "#2e7d32" : pr >= 5 ? "#e65100" : "#c62828";

          return (
            <div key={p.id} style={{
              border:`2px solid ${locked ? "#ce93d8" : "#c5cae9"}`,
              borderRadius:12, background: locked ? "#fdf6ff" : "#fff",
              overflow:"hidden", display:"flex", flexDirection:"column"
            }}>
              {/* Cabecera */}
              <div style={{
                display:"flex", alignItems:"center", gap:8, flexWrap:"wrap",
                padding:"10px 14px",
                background: locked ? "#f3e5f5" : "#f0f4ff",
                borderBottom:`1.5px solid ${locked ? "#e1bee7" : "#dde5f5"}`
              }}>
                <div style={{
                  width:26, height:26, borderRadius:"50%", flexShrink:0,
                  background: locked ? "#8e24aa" : "#003366",
                  color:"#fff", display:"flex", alignItems:"center", justifyContent:"center",
                  fontWeight:800, fontSize:11
                }}>{i+1}</div>
                <div style={{ flex:1, fontWeight:700, fontSize:13, color:"#1a1a2e", minWidth:0 }}>
                  {p.ap_paterno} {p.ap_materno}, {p.nombre}
                </div>
                {pnd !== null && (
                  <div style={{
                    background: notaColor, color:"#fff",
                    padding:"3px 11px", borderRadius:20, fontSize:12, fontWeight:800, flexShrink:0
                  }}>
                    🎯 {pnd} / 2.5 pts
                  </div>
                )}
                {locked && <span style={{fontSize:16, flexShrink:0}}>🔒</span>}
              </div>

              {/* Criterios en cuadrícula 2x2 */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, padding:"12px 14px", flex:1 }}>
                {CRITERIOS_FACILITADOR.map(c => {
                  const val = Number(d[c.key] || 0);
                  const valColor = val >= 7 ? "#2e7d32" : val >= 5 ? "#e65100" : "#c62828";
                  return (
                    <div key={c.key} style={{
                      background:"#f7f9fc", borderRadius:8, padding:"8px 10px",
                      border:"1.5px solid #eef2f7"
                    }}>
                      <div style={{ fontSize:11, color:"#5a6a80", marginBottom:5, lineHeight:1.3 }}>{c.label}</div>
                      {locked ? (
                        <div style={{ display:"flex", alignItems:"baseline", gap:3 }}>
                          <span style={{
                            fontFamily:"'IBM Plex Mono',monospace", fontSize:22, fontWeight:800,
                            color: val ? valColor : "#bbb"
                          }}>{val || "—"}</span>
                          {val ? <span style={{ fontSize:11, color:"#aaa" }}>/10</span> : null}
                        </div>
                      ) : (
                        <select
                          value={d[c.key] ?? ""}
                          onChange={e => set(p.id, c.key, e.target.value)}
                          style={{
                            width:"100%", padding:"5px 8px", borderRadius:6,
                            border:"1.5px solid #c5cae9", fontSize:13, cursor:"pointer", background:"#fff"
                          }}
                        >
                          <option value="">— seleccionar —</option>
                          {OPCIONES_FAC.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pie: promedio + acción */}
              <div style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"8px 14px 12px", borderTop:"1.5px solid #f0f4ff", gap:8, flexWrap:"wrap"
              }}>
                <div style={{ fontSize:12, color:"#5a6a80" }}>
                  Promedio: <strong style={{ fontFamily:"'IBM Plex Mono',monospace", color: notaColor, fontSize:14 }}>
                    {pr !== null ? `${pr.toFixed(1)} / 10` : "—"}
                  </strong>
                </div>
                {locked ? (
                  <span style={{
                    background:"#f3e5f5", color:"#8e24aa", padding:"5px 14px",
                    borderRadius:20, fontSize:12, fontWeight:700
                  }}>🔒 Evaluación registrada</span>
                ) : (
                  <button
                    className="btn-sm btn-guardar"
                    onClick={() => guardarUsuario(p.id)}
                    disabled={saving[p.id] || !completa(p.id)}
                    style={{ opacity: !completa(p.id) ? 0.45 : 1 }}
                  >
                    {saving[p.id] ? "Guardando..." : "💾 Guardar y bloquear"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   VISTA TAREAS — DOCENTE
══════════════════════════════════════════════════════════ */
function VistaTareas({ materia, participantes, showToast }) {
  const session = getSession();
  const [subVista, setSubVista] = useState("resumen");
  const [resumen,  setResumen]  = useState([]);
  const [tareaAct, setTareaAct] = useState(null);
  const [entregas, setEntregas] = useState([]);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({ titulo: "", descripcion: "", fecha_limite: "" });
  const [calForm,  setCalForm]  = useState({});
  const [calSaving,setCalSaving]= useState({});
  const [visor,         setVisor]         = useState(null);
  const [confirmElim,   setConfirmElim]   = useState(null); // { tarea, entrega }
  const [elimSaving,    setElimSaving]    = useState(false);

  const eliminarDocumento = async () => {
    if (!confirmElim) return;
    setElimSaving(true);
    try {
      const r = await fetch(
        `${API}/tareas/${confirmElim.tarea.id}/entregas/${confirmElim.entrega.usuario_id}/documento`,
        { method: "DELETE" }
      );
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setEntregas(prev => prev.map(e =>
        e.usuario_id === confirmElim.entrega.usuario_id
          ? { ...e, estado: "PENDIENTE", archivo_nombre: null, archivo_ruta: null,
              nota: null, feedback: null }
          : e
      ));
      cargarResumen();
      showToast("🗑️ Documento eliminado. El cursante puede volver a entregar.");
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    finally { setElimSaving(false); setConfirmElim(null); }
  };

  const cargarResumen = useCallback(async () => {
    if (!materia?.id) return;
    try {
      const r = await fetch(`${API}/tareas/materia/${materia.id}/resumen`);
      const d = await r.json();
      if (Array.isArray(d)) setResumen(d);
    } catch {}
  }, [materia?.id]);

  useEffect(() => { cargarResumen(); }, [cargarResumen]);

  const cargarEntregas = async (tarea) => {
    setTareaAct(tarea);
    setSubVista("entregas");
    try {
      const r = await fetch(`${API}/tareas/${tarea.id}/entregas/detalle`);
      const d = await r.json();
      if (Array.isArray(d)) {
        setEntregas(d);
        const init = {};
        d.forEach(e => { init[e.usuario_id] = { nota: e.nota ?? "", feedback: e.feedback ?? "" }; });
        setCalForm(init);
      }
    } catch {}
  };

  const crearTarea = async () => {
    if (!form.titulo.trim()) return showToast("❌ El título es requerido", "error");
    setSaving(true);
    try {
      const r = await fetch(`${API}/tareas`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ curso_id: materia.curso_id, materia_id: materia.id, ...form, creado_por: session?.id })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      showToast(`✅ Tarea publicada — ${d.entregas_generadas} cursantes notificados`);
      setForm({ titulo: "", descripcion: "", fecha_limite: "" });
      setSubVista("resumen");
      cargarResumen();
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    finally { setSaving(false); }
  };

  const calificar = async (entrega) => {
    const uid = entrega.usuario_id;
    const cf  = calForm[uid] || {};
    if (cf.nota === "" || cf.nota === undefined) return showToast("❌ Ingrese una nota (0–100)", "error");
    setCalSaving(p => ({ ...p, [uid]: true }));
    try {
      const r = await fetch(`${API}/tareas/${tareaAct.id}/entregas/${uid}/calificar`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nota: Number(cf.nota), feedback: cf.feedback || "", calificado_por: session?.id })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      showToast(`✅ Nota ${d.nota} guardada para ${entrega.ap_paterno}, ${entrega.nombre}`);
      setEntregas(prev => prev.map(e => e.usuario_id === uid ? { ...e, nota: d.nota, feedback: cf.feedback || "" } : e));
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    finally { setCalSaving(p => ({ ...p, [uid]: false })); }
  };

  const hoy = new Date().toISOString().slice(0,10);

  return (
    <div>
      <div className="vista-tabs">
        <button className={subVista==="resumen" ? "vtab active" : "vtab"} onClick={() => setSubVista("resumen")}>
          📋 Todas las tareas <span className="vtab-count">{resumen.length}</span>
        </button>
        <button className={subVista==="nueva" ? "vtab active" : "vtab"} onClick={() => setSubVista("nueva")}>
          ➕ Nueva tarea
        </button>
        {tareaAct && (
          <button className={subVista==="entregas" ? "vtab active" : "vtab"} onClick={() => setSubVista("entregas")}>
            📬 Entregas: {tareaAct.titulo.slice(0,20)}{tareaAct.titulo.length > 20 ? "…" : ""}
          </button>
        )}
      </div>

      {/* ── RESUMEN ── */}
      {subVista === "resumen" && (
        !resumen.length ? <p className="empty-msg">No hay tareas creadas. Usa "Nueva tarea" para crear una.</p> : (
          <div className="doc-table-wrap">
            <table className="doc-table tareas-tabla">
              <thead>
                <tr>
                  <th>Tarea</th>
                  <th>Fecha límite</th>
                  <th style={{textAlign:"center"}}>Total</th>
                  <th style={{textAlign:"center"}}>✅ Entregadas</th>
                  <th style={{textAlign:"center"}}>⏳ Pendientes</th>
                  <th style={{textAlign:"center"}}>🏅 Calificadas</th>
                  <th style={{textAlign:"center"}}>📝 Sin calificar</th>
                  <th style={{textAlign:"center"}}>Promedio</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {resumen.map(t => {
                  const vencida = t.fecha_limite && t.fecha_limite.slice(0,10) < hoy;
                  return (
                    <tr key={t.id} className={vencida ? "tr-vencida" : ""}>
                      <td>
                        <div className="bold">{t.titulo}</div>
                        {t.descripcion && <div className="muted" style={{fontSize:12,marginTop:2}}>{t.descripcion.slice(0,55)}{t.descripcion.length > 55 ? "…" : ""}</div>}
                      </td>
                      <td>
                        <span className={`badge ${vencida ? "badge-aus" : "badge-pres"}`}>
                          {t.fecha_limite ? fmtFecha(t.fecha_limite) : "Sin límite"}
                        </span>
                      </td>
                      <td className="tc bold">{t.total}</td>
                      <td className="tc"><span className="pill pill-green">{t.entregadas}</span></td>
                      <td className="tc"><span className={`pill ${Number(t.pendientes) > 0 ? "pill-orange" : "pill-gray"}`}>{t.pendientes}</span></td>
                      <td className="tc"><span className="pill pill-blue">{t.calificadas}</span></td>
                      <td className="tc"><span className={`pill ${Number(t.sin_calificar) > 0 ? "pill-red" : "pill-gray"}`}>{t.sin_calificar}</span></td>
                      <td className="tc">
                        {t.promedio_nota
                          ? <strong style={{color:"#003366", fontFamily:"'IBM Plex Mono',monospace"}}>{Number(t.promedio_nota).toFixed(1)}</strong>
                          : <span className="muted">—</span>}
                      </td>
                      <td><button className="btn-sm btn-ver" onClick={() => cargarEntregas(t)}>Ver entregas →</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      )}

      {/* ── NUEVA TAREA ── */}
      {subVista === "nueva" && (
        <div className="doc-form">
          <div className="form-row">
            <div className="form-field">
              <label>Título *</label>
              <input placeholder="Ej: Ensayo sobre derechos fundamentales" value={form.titulo} onChange={e => setForm(p => ({...p, titulo: e.target.value}))}/>
            </div>
            <div className="form-field">
              <label>Fecha límite</label>
              <input type="date" value={form.fecha_limite} onChange={e => setForm(p => ({...p, fecha_limite: e.target.value}))}/>
            </div>
          </div>
          <div className="form-field">
            <label>Consigna / Descripción</label>
            <textarea rows={4} placeholder="Describa qué deben realizar los cursantes..." value={form.descripcion} onChange={e => setForm(p => ({...p, descripcion: e.target.value}))}/>
          </div>
          <div className="vista-footer">
            <button className="btn-primary" onClick={crearTarea} disabled={saving}>{saving ? "Publicando..." : "📤 Publicar tarea"}</button>
            <button className="btn-ghost" onClick={() => setSubVista("resumen")}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── ENTREGAS ── */}
      {subVista === "entregas" && tareaAct && (
        <div>
          <div className="entregas-header">
            <div>
              <div className="entregas-titulo">📬 {tareaAct.titulo}</div>
              {tareaAct.descripcion && <div className="entregas-desc">{tareaAct.descripcion}</div>}
            </div>
            <div className="entregas-pills">
              <span className="pill pill-green">{entregas.filter(e => e.estado === "ENTREGADO").length} entregadas</span>
              <span className="pill pill-orange">{entregas.filter(e => e.estado === "PENDIENTE").length} pendientes</span>
              <span className="pill pill-blue">{entregas.filter(e => e.nota !== null).length} calificadas</span>
            </div>
          </div>

          {!entregas.length ? <p className="empty-msg">No hay entregas aún.</p> : (
            <div className="doc-table-wrap">
              <table className="doc-table">
                <thead>
                  <tr>
                    <th>#</th><th>Cursante</th><th>CI</th><th>Estado</th>
                    <th>Fecha entrega</th><th>Respuesta</th>
                    <th style={{textAlign:"center"}}>Nota</th>
                    <th>Feedback</th><th style={{textAlign:"center"}}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {entregas.map((e, i) => {
                    const entregado = e.estado === "ENTREGADO";
                    const calificado = e.nota !== null && e.nota !== undefined;
                    const cf = calForm[e.usuario_id] || {};
                    return (
                      <tr key={e.usuario_id}>
                        <td className="muted">{i+1}</td>
                        <td className="bold">{e.ap_paterno} {e.ap_materno}, {e.nombre}</td>
                        <td className="muted">{e.ci}</td>
                        <td>
                          <span className={`badge ${entregado ? "badge-pres" : "badge-aus"}`}>
                            {entregado ? "✅ Entregado" : "⏳ Pendiente"}
                          </span>
                        </td>
                        <td className="muted">{fmtFecha(e.entregado_en)}</td>
                        <td>
                          {entregado && e.archivo_nombre
                            ? <div style={{display:"flex",gap:5,alignItems:"center"}}>
                                <button className="btn-sm btn-ver-doc"
                                  onClick={() => setVisor({ ruta: e.archivo_ruta, nombre: e.archivo_nombre })}>
                                  📄 Ver
                                </button>
                                <button
                                  className="btn-sm"
                                  title="Eliminar documento"
                                  onClick={() => setConfirmElim({ tarea: tareaAct, entrega: e })}
                                  style={{background:"#ffebee",color:"#c62828",border:"1.5px solid #ef9a9a"}}
                                >
                                  🗑️
                                </button>
                              </div>
                            : <span className="muted">—</span>}
                        </td>
                        <td style={{textAlign:"center"}}>
                          {entregado ? (
                            <input type="number" min="0" max="100"
                              className={`nota-input ${calificado ? "nota-ap" : ""}`}
                              value={cf.nota !== "" && cf.nota !== undefined ? cf.nota : ""}
                              placeholder="0"
                              onChange={ev => setCalForm(p => ({...p, [e.usuario_id]: {...p[e.usuario_id], nota: ev.target.value}}))}
                              style={{width:66}}
                            />
                          ) : <span className="muted">—</span>}
                        </td>
                        <td>
                          {entregado ? (
                            <input type="text" className="feedback-input" placeholder="Comentario..."
                              value={cf.feedback ?? e.feedback ?? ""}
                              onChange={ev => setCalForm(p => ({...p, [e.usuario_id]: {...p[e.usuario_id], feedback: ev.target.value}}))}
                            />
                          ) : <span className="muted">—</span>}
                        </td>
                        <td style={{textAlign:"center"}}>
                          {entregado ? (
                            <button className={`btn-sm ${calificado ? "btn-edit" : "btn-cal"}`}
                              disabled={calSaving[e.usuario_id]}
                              onClick={() => calificar(e)}>
                              {calSaving[e.usuario_id] ? "..." : calificado ? "✏️ Actualizar" : "🏅 Calificar"}
                            </button>
                          ) : <span className="muted">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {visor && (
        <VisorDocumento
          archivoRuta={visor.ruta}
          archivoNombre={visor.nombre}
          onClose={() => setVisor(null)}
        />
      )}

      {/* ── Modal confirmación eliminar documento ── */}
      {confirmElim && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.6)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:2000, backdropFilter:"blur(4px)"
        }}>
          <div style={{
            background:"#fff", borderRadius:18, padding:"32px 36px",
            maxWidth:420, width:"92%", boxShadow:"0 20px 60px rgba(0,0,0,0.28)",
            display:"flex", flexDirection:"column", alignItems:"center", gap:16, textAlign:"center"
          }}>
            <div style={{fontSize:48}}>🗑️</div>
            <div style={{fontSize:18, fontWeight:800, color:"#c62828"}}>
              ¿Eliminar documento?
            </div>
            <div style={{
              background:"#fff5f5", border:"1.5px solid #ef9a9a",
              borderRadius:10, padding:"12px 16px", fontSize:13, color:"#5a6a80", width:"100%"
            }}>
              <strong style={{color:"#1a2535"}}>
                {confirmElim.entrega.ap_paterno} {confirmElim.entrega.ap_materno},&nbsp;
                {confirmElim.entrega.nombre}
              </strong>
              <br/>
              <span style={{fontSize:12}}>📄 {confirmElim.entrega.archivo_nombre}</span>
            </div>
            <div style={{
              background:"#fff8e1", border:"1.5px solid #ffe082",
              borderRadius:9, padding:"10px 14px", fontSize:12, color:"#b45309",
              lineHeight:1.6, width:"100%"
            }}>
              ⚠️ Se eliminará el archivo del servidor. El cursante podrá volver a subir su tarea.
            </div>
            <div style={{display:"flex", gap:10, width:"100%"}}>
              <button
                onClick={eliminarDocumento}
                disabled={elimSaving}
                style={{
                  flex:1, padding:"12px 0", background:"#c62828", color:"#fff",
                  border:"none", borderRadius:10, fontSize:14, fontWeight:700,
                  cursor:elimSaving?"not-allowed":"pointer", opacity:elimSaving?.65:1,
                  fontFamily:"inherit"
                }}
              >
                {elimSaving ? "⏳ Eliminando..." : "🗑️ Sí, eliminar"}
              </button>
              <button
                onClick={() => setConfirmElim(null)}
                style={{
                  flex:1, padding:"12px 0", background:"transparent", color:"#5a6a80",
                  border:"2px solid #e8ecf2", borderRadius:10, fontSize:13.5,
                  fontWeight:600, cursor:"pointer", fontFamily:"inherit"
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function DashboardDocente() {
  const navigate = useNavigate();
  const session  = getSession();

  const [materias,      setMaterias]      = useState([]);
  const [todosLosCursos, setTodosLosCursos] = useState([]);
  const [materiaId,     setMateriaId]     = useState(null);
  const [participantes, setParticipantes] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [vista,         setVista]         = useState("asistencia");
  const [toast,         setToast]         = useState(null);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [perfilOpen,    setPerfilOpen]    = useState(false);

  const { notifs, noLeidas, loading: loadingNotifs, marcarLeida, marcarTodasLeidas } = useNotificaciones(30);

  const showToast = useCallback((msg, type = "ok") => {
    setToast({ msg, type });
  }, []);

  useEffect(() => {
    if (!session) { navigate("/"); return; }
    fetch(`${API}/cursos`)
      .then(r => r.json())
      .then(async cursos => {
        if (!Array.isArray(cursos)) return;
        setTodosLosCursos(cursos);
        const todas = [];
        for (const c of cursos) {
          const mr = await fetch(`${API}/cursos/${c.id}/materias`);
          const md = await mr.json();
          if (Array.isArray(md))
            md.filter(m => m.docente_id === session.id)
              .forEach(m => todas.push({ ...m, curso_nombre: c.nombre }));
        }
        setMaterias(todas);
        if (todas.length) setMateriaId(todas[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!materiaId) return;
    const m = materias.find(x => x.id === materiaId);
    if (!m) return;
    fetch(`${API}/cursos/${m.curso_id}`)
      .then(r => r.json())
      .then(d => setParticipantes(Array.isArray(d.participantes) ? d.participantes : []))
      .catch(() => setParticipantes([]));
  }, [materiaId]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const materia = materias.find(m => m.id === materiaId);
  const nombre  = session ? `${session.ap_paterno || ""} ${session.nombre || ""}`.trim() : "Docente";

  const VISTAS = [
    { id:"asistencia",     icon:"📋", label:"Asistencia" },
    { id:"calificaciones", icon:"📊", label:"Calificaciones" },
    { id:"facilitador",    icon:"🎯", label:"Facilitador" },
    { id:"tareas",         icon:"📤", label:"Tareas" },
    { id:"calendario",     icon:"📅", label:"Calendario" },
    { id:"notificaciones", icon:"🔔", label:"Notificaciones" },
  ];

  return (
    <div className="doc-page">
      <div className="mobile-topbar">
        <button className="mobile-topbar-btn" onClick={() => setSidebarOpen(o => !o)} aria-label="Menú">☰</button>
        <span className="mobile-topbar-title">EAEN Avaroa</span>
        <button className="mobile-topbar-btn mobile-logout" onClick={() => { localStorage.removeItem("eaen_session"); navigate("/", { replace: true }); }} aria-label="Cerrar sesión">🚪 Cerrar sesión</button>
      </div>
      {sidebarOpen && (
        <div className="sidebar-overlay open" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`doc-sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="sidebar-brand">
          <div style={{
            width:48, height:48, flexShrink:0,
            backgroundImage:"url('/eaen.png')",
            backgroundSize:"contain",
            backgroundRepeat:"no-repeat",
            backgroundPosition:"center",
            backgroundColor:"#ffffff",
            borderRadius:10,
            padding:4,
            boxShadow:"0 2px 8px rgba(0,0,0,0.35)"
          }}/>
          <div>
            <div className="sidebar-title">EAEN Avaroa</div>
            <div className="sidebar-role">👨‍🏫 Docente</div>
          </div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{nombre[0] || "D"}</div>
          <div>
            <div className="user-name">{nombre}</div>
            <div className="user-ci">CI: {session?.ci}</div>
          </div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">MÓDULOS</div>
          {VISTAS.map(v => (
            <button key={v.id} className={`nav-btn${vista === v.id ? " active" : ""}`} onClick={() => setVista(v.id)}>
              <span>{v.icon}</span>{v.label}
              {v.id === "notificaciones" && noLeidas > 0 && <span className="np-sidebar-badge">{noLeidas}</span>}
            </button>
          ))}
        </nav>
        <div style={{flex:1}}/>
        <button className="nav-btn" onClick={() => { setSidebarOpen(false); setPerfilOpen(true); }}
          style={{marginBottom:4}}>
          👤 Mi Perfil
        </button>
        <button className="nav-btn logout" onClick={() => { localStorage.removeItem("eaen_session"); navigate("/", { replace: true }); }}>
          🚪 Cerrar sesión
        </button>
      </aside>
      {perfilOpen && <PerfilUsuario session={session} onClose={() => setPerfilOpen(false)} />}

      {/* Main */}
      <main className="doc-main">
        <header className="doc-header">
          <div>
            <h1>Panel del Docente</h1>
            <p>Gestione asistencia, calificaciones y tareas de sus materias asignadas.</p>
          </div>
          <div style={{display:"flex", alignItems:"center", gap:14}}>
            <NotifBell noLeidas={noLeidas} onClick={() => setVista("notificaciones")}/>
            <div className="header-date">
              {new Date().toLocaleDateString("es-BO", { weekday:"long", day:"numeric", month:"long" })}
            </div>
          </div>
        </header>

        {loading ? <Spinner/> : (<>
          <div className="doc-stats">
            <div className="doc-stat-card color-blue">
              <div className="stat-icon">📚</div>
              <div className="stat-body"><div className="stat-value">{materias.length}</div><div className="stat-label">Materias asignadas</div></div>
            </div>
            <div className="doc-stat-card color-orange">
              <div className="stat-icon">👥</div>
              <div className="stat-body"><div className="stat-value">{participantes.length}</div><div className="stat-label">Participantes</div></div>
            </div>
            <div className={`doc-stat-card ${noLeidas > 0 ? "color-red" : "color-green"}`} style={{cursor:"pointer"}} onClick={() => setVista("notificaciones")}>
              <div className="stat-icon">🔔</div>
              <div className="stat-body"><div className="stat-value">{noLeidas}</div><div className="stat-label">Notificaciones</div></div>
            </div>
          </div>

          {/* Notificaciones */}
          {vista === "notificaciones" && (
            <div className="doc-panel">
              <div className="panel-header" style={{flexDirection:"column", alignItems:"flex-start", gap:4}}>
                <h2 style={{fontSize:16, fontWeight:700, color:"#003366"}}>🔔 Notificaciones institucionales</h2>
                <p style={{fontSize:13, color:"#8898aa"}}>Expande cada notificación y haz clic en "Marcar como leída" para quitarla.</p>
              </div>
              <div className="panel-body">
                <NotificacionesPanel notifs={notifs} loading={loadingNotifs} marcarLeida={marcarLeida} marcarTodasLeidas={marcarTodasLeidas}/>
              </div>
            </div>
          )}

          {/* Módulos académicos */}
          {vista !== "notificaciones" && (
            !materias.length
              ? <div className="doc-empty"><span>📭</span><p>No tiene materias asignadas. Contacte al Jefe de Estudios.</p></div>
              : <div className="doc-panel">
                  <div className="panel-header">
                    <div className="materia-selector">
                      <label>Materia activa</label>
                      <select value={materiaId || ""} onChange={e => setMateriaId(Number(e.target.value))}>
                        {materias.map(m => <option key={m.id} value={m.id}>{m.nombre} — {m.curso_nombre}</option>)}
                      </select>
                    </div>
                    <div className="panel-tabs">
                      {VISTAS.filter(v => v.id !== "notificaciones").map(v => (
                        <button key={v.id} className={`ptab${vista === v.id ? " active" : ""}`} onClick={() => setVista(v.id)}>
                          {v.icon} {v.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="panel-body">
                    {materia && vista === "asistencia"     && <VistaAsistencia     materia={materia} participantes={participantes} showToast={showToast}/>}
                    {materia && vista === "calificaciones" && <VistaCalificaciones materia={materia} participantes={participantes} showToast={showToast}/>}
                    {materia && vista === "facilitador"    && <VistaFacilitador    materia={materia} participantes={participantes} showToast={showToast}/>}
                    {materia && vista === "tareas"         && <VistaTareas         materia={materia} participantes={participantes} showToast={showToast}/>}
                    {vista === "calendario" && (
                      <VistaCalendario
                        cursos={todosLosCursos}
                        titulo="Calendario de Clases — Todos los Cursos"
                        modoDocente={true}
                      />
                    )}
                  </div>
                </div>
          )}
        </>)}
      </main>

      {/* Toast global */}
      {toast && (
        <div className={`doc-toast ${toast.type === "error" ? "toast-error" : ""}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
