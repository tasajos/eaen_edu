import { useState, useEffect, useCallback, useRef } from "react";
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
   VISTA CALIFICACIONES
══════════════════════════════════════════════════════════ */
function VistaCalificaciones({ materia, participantes, showToast }) {
  const [evals,       setEvals]       = useState([]);
  const [notas,       setNotas]       = useState({});
  const [notasTarea,  setNotasTarea]  = useState({});
  const [bloqueados,  setBloqueados]  = useState({}); // { usuario_id: true }
  const [saving,      setSaving]      = useState({}); // { usuario_id: true }
  const [confirmUid,  setConfirmUid]  = useState(null); // uid del modal abierto

  const esTareaEval = nombre => /trabajo|tarea|practic/i.test(nombre);

  const calcularPromedioTareas = async (materiaId) => {
    try {
      const resumen = await fetch(`${API}/tareas/materia/${materiaId}/resumen`).then(r=>r.json());
      if (!Array.isArray(resumen) || !resumen.length) return {};
      const mapaNotas = {};
      for (const tarea of resumen) {
        const entregas = await fetch(`${API}/tareas/${tarea.id}/entregas/detalle`).then(r=>r.json());
        if (!Array.isArray(entregas)) continue;
        entregas.forEach(e => {
          if (e.nota !== null && e.nota !== undefined) {
            if (!mapaNotas[e.usuario_id]) mapaNotas[e.usuario_id] = [];
            mapaNotas[e.usuario_id].push(Number(e.nota));
          }
        });
      }
      const res = {};
      Object.entries(mapaNotas).forEach(([uid, ns]) => {
        res[Number(uid)] = Math.round(ns.reduce((a,b)=>a+b,0)/ns.length*10)/10;
      });
      return res;
    } catch { return {}; }
  };

  useEffect(() => {
    if (!materia?.id) return;
    fetch(`${API}/eval-config/materia/${materia.id}`)
      .then(r=>r.json()).then(async d => {
        if (!Array.isArray(d)) return;
        setEvals(d);
        if (d.some(ev => esTareaEval(ev.nombre))) {
          const p = await calcularPromedioTareas(materia.id);
          setNotasTarea(p);
        }
      }).catch(()=>{});
    fetch(`${API}/calificaciones/materia/${materia.id}`)
      .then(r=>r.json()).then(d => {
        if (!d.libro) return;
        const m = {}, bl = {};
        d.libro.forEach(p => {
          m[p.usuario_id] = p.notas || {};
          if (p.bloqueado) bl[p.usuario_id] = true;
        });
        setNotas(m);
        setBloqueados(bl);
      }).catch(()=>{});
  }, [materia?.id]);

  useEffect(() => {
    if (participantes.length && evals.length) {
      setNotas(prev => {
        const n = {...prev};
        participantes.forEach(p => {
          if (!n[p.id]) n[p.id] = Object.fromEntries(evals.map(ev=>[ev.nombre,0]));
        });
        return n;
      });
    }
  }, [participantes, evals]);

  const getNotaEval = (uid, evNombre) => {
    if (esTareaEval(evNombre)) return notasTarea[uid] ?? 0;
    return notas[uid]?.[evNombre] ?? 0;
  };

  const prom = uid => {
    if (!evals.length) return 0;
    let sp=0, sn=0;
    evals.forEach(ev => { sn += getNotaEval(uid, ev.nombre)*Number(ev.peso); sp += Number(ev.peso); });
    return sp>0 ? sn/sp : 0;
  };

  // Guardar y bloquear notas de UN cursante
  const guardarUsuario = async (uid) => {
    setSaving(p=>({...p,[uid]:true}));
    try {
      const notasCompletas = {...notas[uid]};
      evals.forEach(ev => {
        if (esTareaEval(ev.nombre)) notasCompletas[ev.nombre] = getNotaEval(uid, ev.nombre);
      });
      const r = await fetch(`${API}/calificaciones/usuario`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          curso_id: materia.curso_id,
          materia_id: materia.id,
          usuario_id: uid,
          notas: notasCompletas,
          bloquear: true
        })
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message);
      setBloqueados(p=>({...p,[uid]:true}));
      showToast("✅ Calificaciones registradas y bloqueadas");
    } catch(e) { showToast(`❌ ${e.message}`, "error"); }
    finally { setSaving(p=>({...p,[uid]:false})); setConfirmUid(null); }
  };

  const min = evals.length ? Number(evals[0].nota_min_apro) : 70;
  const conTareas = Object.values(notasTarea).length;
  const confirmParticipante = participantes.find(p=>p.id===confirmUid);
  const totalBloqueados = Object.keys(bloqueados).length;

  return (
    <div>
      {/* ── Modal confirmación por cursante ── */}
      {confirmUid && confirmParticipante && (
        <div style={{
          position:"fixed", inset:0, background:"rgba(0,0,0,0.6)",
          display:"flex", alignItems:"center", justifyContent:"center",
          zIndex:2000, backdropFilter:"blur(4px)"
        }}>
          <div style={{
            background:"#fff", borderRadius:20, padding:"36px 40px",
            maxWidth:460, width:"92%", boxShadow:"0 24px 80px rgba(0,0,0,0.28)",
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

            {/* Resumen del cursante */}
            <div style={{
              width:"100%", background:"#f7f9fc", borderRadius:12,
              padding:"14px 18px", textAlign:"left", border:"1.5px solid #eef2f7"
            }}>
              {evals.map(ev => {
                const nota = getNotaEval(confirmUid, ev.nombre);
                const esAuto = esTareaEval(ev.nombre);
                return (
                  <div key={ev.nombre} style={{
                    display:"flex", justifyContent:"space-between",
                    padding:"5px 0", borderBottom:"1px solid #f0f4f8", fontSize:13
                  }}>
                    <span style={{color:"#5a6a80"}}>
                      {ev.nombre} <span style={{fontSize:11, color:"#aaa"}}>({ev.peso}%)</span>
                      {esAuto && <span style={{marginLeft:4}}>🔄</span>}
                    </span>
                    <span style={{
                      fontFamily:"'IBM Plex Mono',monospace", fontWeight:800,
                      color: nota >= min ? "#2e7d32" : "#c62828"
                    }}>{nota.toFixed(1)}</span>
                  </div>
                );
              })}
              <div style={{
                display:"flex", justifyContent:"space-between",
                paddingTop:10, marginTop:4, fontSize:14, fontWeight:700
              }}>
                <span style={{color:"#003366"}}>Promedio final</span>
                <span style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:18,
                  color: prom(confirmUid) >= min ? "#2e7d32" : "#c62828"
                }}>{prom(confirmUid).toFixed(1)}</span>
              </div>
            </div>

            {/* Advertencia */}
            <div style={{
              background:"#fff8e1", border:"2px solid #ffe082", borderRadius:10,
              padding:"12px 16px", fontSize:13, color:"#b45309",
              lineHeight:1.6, width:"100%", textAlign:"left"
            }}>
              ⚠️ <strong>Esta acción es permanente.</strong> Las notas quedarán
              bloqueadas en el sistema. Para modificarlas deberá contactar al Jefe de Estudios.
            </div>

            <div style={{display:"flex", gap:10, width:"100%"}}>
              <button onClick={()=>guardarUsuario(confirmUid)} disabled={saving[confirmUid]} style={{
                flex:1, padding:"12px 0", background:"#003366", color:"#fff",
                border:"none", borderRadius:10, fontSize:14, fontWeight:700,
                cursor:saving[confirmUid]?"not-allowed":"pointer",
                opacity:saving[confirmUid]?.65:1, fontFamily:"inherit"
              }}>
                {saving[confirmUid] ? "⏳ Guardando..." : "✅ Confirmar y bloquear"}
              </button>
              <button onClick={()=>setConfirmUid(null)} style={{
                flex:1, padding:"12px 0", background:"transparent", color:"#5a6a80",
                border:"2px solid #e8ecf2", borderRadius:10, fontSize:13.5,
                fontWeight:600, cursor:"pointer", fontFamily:"inherit"
              }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {!evals.length ? (
        <div className="empty-msg">
          <p>No hay evaluaciones configuradas para esta materia.</p>
          <p style={{fontSize:12,marginTop:6}}>Configure las evaluaciones en Gestión Educativa → Calificaciones.</p>
        </div>
      ) : (<>
        {/* Info tareas automáticas */}
        {evals.some(ev => esTareaEval(ev.nombre)) && (
          <div style={{
            display:"flex", alignItems:"center", gap:10,
            background:"#e3f2fd", border:"1.5px solid #90caf9",
            borderRadius:10, padding:"10px 16px", marginBottom:14,
            fontSize:13, color:"#1565c0"
          }}>
            <span style={{fontSize:18}}>📊</span>
            <span>
              Las columnas <strong>Trabajo / Tarea / Práctica</strong> se calculan automáticamente
              como promedio de tareas calificadas
              ({conTareas>0 ? `${conTareas} cursante${conTareas>1?"s":""} con tareas calificadas` : "sin tareas calificadas aún"}).
            </span>
          </div>
        )}

        {/* Resumen bloqueados */}
        {totalBloqueados > 0 && (
          <div style={{
            display:"flex", alignItems:"center", gap:8,
            background:"#f3e5f5", border:"1.5px solid #ce93d8",
            borderRadius:10, padding:"9px 16px", marginBottom:14,
            fontSize:13, color:"#6a1b9a"
          }}>
            🔒 <strong>{totalBloqueados}</strong> de {participantes.length} cursantes con calificaciones bloqueadas.
          </div>
        )}

        <div className="doc-table-wrap" style={{overflowX:"auto"}}>
          <table className="doc-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Participante</th>
                <th>CI</th>
                {evals.map(ev => (
                  <th key={ev.nombre} style={{textAlign:"center"}}>
                    {ev.nombre}
                    {esTareaEval(ev.nombre) && <span title="Auto" style={{marginLeft:3}}>🔄</span>}
                    <br/>
                    <span style={{fontSize:10,color:"#aaa",fontWeight:400}}>{ev.peso}%</span>
                  </th>
                ))}
                <th style={{textAlign:"center"}}>Promedio</th>
                <th style={{textAlign:"center"}}>Estado</th>
                <th style={{textAlign:"center"}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {participantes.map((p, i) => {
                const pr      = prom(p.id);
                const ap      = pr >= min;
                const locked  = bloqueados[p.id] || false;
                const isSaving = saving[p.id] || false;
                return (
                  <tr key={p.id} style={{background: locked ? "#fafffe" : undefined}}>
                    <td className="muted">{i+1}</td>
                    <td className="bold">{p.ap_paterno} {p.ap_materno}, {p.nombre}</td>
                    <td className="muted">{p.ci}</td>
                    {evals.map(ev => {
                      const nota   = getNotaEval(p.id, ev.nombre);
                      const esAuto = esTareaEval(ev.nombre);
                      return (
                        <td key={ev.nombre} style={{textAlign:"center"}}>
                          {esAuto ? (
                            <div style={{
                              display:"inline-flex", alignItems:"center", justifyContent:"center",
                              minWidth:60, padding:"6px 10px",
                              background: nota>=min ? "#e8f5e9" : "#fff3e0",
                              border:`2px solid ${nota>=min ? "#a5d6a7" : "#ffcc80"}`,
                              borderRadius:8, fontWeight:700,
                              fontFamily:"'IBM Plex Mono',monospace",
                              color: nota>=min ? "#2e7d32" : "#e65100",
                              fontSize:14
                            }}>🔄 {nota.toFixed(1)}</div>
                          ) : locked ? (
                            <div style={{
                              display:"inline-flex", alignItems:"center", justifyContent:"center",
                              minWidth:60, padding:"6px 10px",
                              background:"#f5f5f5", border:"2px solid #e0e0e0",
                              borderRadius:8, fontWeight:700,
                              fontFamily:"'IBM Plex Mono',monospace",
                              color: nota>=min ? "#2e7d32" : "#c62828",
                              fontSize:14
                            }}>🔒 {nota.toFixed(1)}</div>
                          ) : (
                            <input
                              type="number" min="0" max="100"
                              className={`nota-input ${nota>=min?"nota-ap":"nota-rp"}`}
                              value={nota}
                              onChange={e => setNotas(prev=>({
                                ...prev,
                                [p.id]:{...prev[p.id],[ev.nombre]:Math.min(100,Math.max(0,Number(e.target.value)||0))}
                              }))}
                            />
                          )}
                        </td>
                      );
                    })}
                    <td style={{textAlign:"center"}}>
                      <strong style={{
                        color: ap?"#2e7d32":"#c62828",
                        fontFamily:"'IBM Plex Mono',monospace", fontSize:15
                      }}>{pr.toFixed(1)}</strong>
                    </td>
                    <td style={{textAlign:"center"}}>
                      <span className={`badge ${ap?"badge-pres":"badge-aus"}`}>
                        {ap?"Aprobado":"Reprobado"}
                      </span>
                    </td>
                    <td style={{textAlign:"center"}}>
                      {locked ? (
                        <span style={{
                          fontSize:12, color:"#9c27b0", fontWeight:700,
                          display:"inline-flex", alignItems:"center", gap:4
                        }}>🔒 Bloqueado</span>
                      ) : (
                        <button
                          className="btn-sm btn-cal"
                          disabled={isSaving}
                          onClick={() => setConfirmUid(p.id)}
                          style={{whiteSpace:"nowrap"}}
                        >
                          {isSaving ? "⏳..." : "💾 Guardar"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
  const [visor,    setVisor]    = useState(null);

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
                            ? <button className="btn-sm btn-ver-doc"
                                onClick={() => setVisor({ ruta: e.archivo_ruta, nombre: e.archivo_nombre })}>
                                📄 Ver documento
                              </button>
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
        setTodosLosCursos(cursos);  // guardar todos para el calendario
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
    { id:"tareas",         icon:"📤", label:"Tareas" },
    { id:"calendario",     icon:"📅", label:"Calendario" },
    { id:"notificaciones", icon:"🔔", label:"Notificaciones" },
  ];

  return (
    <div className="doc-page">
      {/* Sidebar */}
      <aside className="doc-sidebar">
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
        <button className="nav-btn logout" onClick={() => { localStorage.removeItem("eaen_session"); navigate("/"); }}>
          🚪 Cerrar sesión
        </button>
      </aside>

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
