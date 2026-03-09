import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../../hooks/useNotificaciones";
import { NotificacionesPanel, NotifBell } from "../../Shared/NotificacionesPanel";
import "../../Shared/NotificacionesPanel.css";
import "./DashboardCursante.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
function getSession() {
  try { return JSON.parse(localStorage.getItem("eaen_session") || "null"); }
  catch { return null; }
}
function Spinner() { return <div className="cur-spinner"><div className="spin-ring"/></div>; }

export default function DashboardCursante() {
  const navigate = useNavigate();
  const session  = getSession();

  const [cursos,    setCursos]    = useState([]);
  const [cursoId,   setCursoId]   = useState(null);
  const [materias,  setMaterias]  = useState([]);
  const [materiaId, setMateriaId] = useState(null);
  const [notas,     setNotas]     = useState(null);
  const [asist,     setAsist]     = useState([]);
  const [tareas,    setTareas]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [vista,     setVista]     = useState("notas");

  const { notifs, noLeidas, loading: loadingNotifs, marcarLeida, marcarTodasLeidas } = useNotificaciones(30);

  const nombre = session ? `${session.ap_paterno||""} ${session.ap_materno||""}, ${session.nombre||""}`.trim() : "Cursante";

  useEffect(()=>{
    if(!session){navigate("/");return;}
    fetch(`${API}/api/cursos`).then(r=>r.json()).then(async all=>{
      if(!Array.isArray(all))return;
      const mios=[];
      for(const c of all){
        const dr=await fetch(`${API}/api/cursos/${c.id}`); const dd=await dr.json();
        if(Array.isArray(dd.participantes)&&dd.participantes.find(p=>p.id===session.id)) mios.push(c);
      }
      setCursos(mios); if(mios.length)setCursoId(mios[0].id);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(!cursoId)return;
    fetch(`${API}/api/cursos/${cursoId}/materias`).then(r=>r.json())
      .then(d=>{if(Array.isArray(d)){setMaterias(d);setMateriaId(d.length?d[0].id:null);}}).catch(()=>{});
  },[cursoId]);

  useEffect(()=>{
    if(!materiaId||!session)return;
    fetch(`${API}/api/calificaciones/materia/${materiaId}`).then(r=>r.json())
      .then(d=>{ if(d.libro){ const e=d.libro.find(p=>p.usuario_id===session.id); setNotas(e?{...e,evaluaciones:d.evaluaciones}:null); }}).catch(()=>setNotas(null));
    fetch(`${API}/api/asistencia/materia/${materiaId}?usuario_id=${session.id}`).then(r=>r.json())
      .then(d=>setAsist(Array.isArray(d)?d:[])).catch(()=>setAsist([]));
    fetch(`${API}/api/tareas/materia/${materiaId}`).then(r=>r.json())
      .then(d=>setTareas(Array.isArray(d)?d:[])).catch(()=>setTareas([]));
  },[materiaId,session?.id]);

  const curso   = cursos.find(c=>c.id===cursoId);
  const materia = materias.find(m=>m.id===materiaId);
  const pctAsist= asist.length ? Math.round(asist.filter(a=>a.estado==="P"||a.estado==="J").length/asist.length*100) : null;
  const BA={P:"pres",A:"aus",T:"tard",J:"just"}, LA={P:"Presente",A:"Ausente",T:"Tardanza",J:"Justificado"};

  const VISTAS=[
    {id:"notas",         icon:"📊", label:"Mis notas"},
    {id:"asistencia",    icon:"📋", label:"Asistencia"},
    {id:"tareas",        icon:"📤", label:"Tareas"},
    {id:"notificaciones",icon:"🔔", label:"Notificaciones"},
  ];

  return (
    <div className="cur-page">
      <aside className="cur-sidebar">
        <div className="sidebar-brand">
          <img src="/eaen.png" alt="EAEN" className="sidebar-logo"/>
          <div><div className="sidebar-title">EAEN Avaroa</div><div className="sidebar-role">📚 Cursante</div></div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{nombre[0]||"C"}</div>
          <div><div className="user-name" style={{fontSize:12}}>{nombre}</div><div className="user-ci">CI: {session?.ci}</div>{session?.grado&&<div className="user-ci">{session.grado}</div>}</div>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section-label">MÓDULOS</div>
          {VISTAS.map(v=>(
            <button key={v.id} className={`nav-btn${vista===v.id?" active":""}`} onClick={()=>setVista(v.id)}>
              <span>{v.icon}</span>{v.label}
              {v.id==="notificaciones"&&noLeidas>0&&<span className="np-sidebar-badge">{noLeidas}</span>}
            </button>
          ))}
        </nav>
        <div style={{flex:1}}/>
        <button className="nav-btn logout" onClick={()=>{localStorage.removeItem("eaen_session");navigate("/");}}>🚪 Cerrar sesión</button>
      </aside>

      <main className="cur-main">
        <header className="cur-header">
          <div><h1>Mi Panel Académico</h1><p>Consulte sus calificaciones, asistencia y tareas por materia.</p></div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <NotifBell noLeidas={noLeidas} onClick={()=>setVista("notificaciones")}/>
            <div className="header-date">{new Date().toLocaleDateString("es-BO",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
        </header>

        {loading ? <Spinner/> : (<>
          <div className="cur-stats">
            <div className="cur-stat blue"><span>🎓</span><div><div className="st-val">{cursos.length}</div><div className="st-lbl">Cursos inscritos</div></div></div>
            <div className="cur-stat orange"><span>📚</span><div><div className="st-val">{materias.length}</div><div className="st-lbl">Materias</div></div></div>
            <div className="cur-stat green"><span>✅</span><div><div className="st-val">{pctAsist!==null?`${pctAsist}%`:"—"}</div><div className="st-lbl">Asistencia</div></div></div>
            <div className={`cur-stat ${noLeidas>0?"red":"green"}`} style={{cursor:"pointer"}} onClick={()=>setVista("notificaciones")}>
              <span>🔔</span><div><div className="st-val">{noLeidas}</div><div className="st-lbl">Notificaciones</div></div>
            </div>
          </div>

          {/* ── PANEL NOTIFICACIONES ── */}
          {vista==="notificaciones" && (
            <div className="cur-panel">
              <div className="panel-selectors" style={{flexDirection:"column",alignItems:"flex-start",gap:4}}>
                <h2 style={{fontSize:16,fontWeight:700,color:"#1b4332"}}>🔔 Notificaciones institucionales</h2>
                <p style={{fontSize:13,color:"#8898aa"}}>Haz clic en una notificación para expandirla, luego en "Marcar como leída" para que desaparezca.</p>
              </div>
              <div className="panel-body" style={{padding:26}}>
                <NotificacionesPanel notifs={notifs} loading={loadingNotifs} marcarLeida={marcarLeida} marcarTodasLeidas={marcarTodasLeidas}/>
              </div>
            </div>
          )}

          {/* ── OTROS ── */}
          {vista!=="notificaciones" && (!cursos.length
            ? <div className="cur-empty"><span>📭</span><p>No está inscrito en ningún curso activo.</p></div>
            : <div className="cur-panel">
                <div className="panel-selectors">
                  <div className="selector-group">
                    <label>Curso</label>
                    <select value={cursoId||""} onChange={e=>setCursoId(Number(e.target.value))}>
                      {cursos.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  <span style={{color:"#bbb",alignSelf:"flex-end",paddingBottom:4}}>›</span>
                  <div className="selector-group">
                    <label>Materia</label>
                    {materias.length
                      ? <select value={materiaId||""} onChange={e=>setMateriaId(Number(e.target.value))}>
                          {materias.map(m=><option key={m.id} value={m.id}>{m.nombre}{m.docente_nombre?` — ${m.docente_nombre}`:""}</option>)}
                        </select>
                      : <div className="no-materias">Sin materias</div>}
                  </div>
                </div>
                <div className="panel-tabs">
                  {VISTAS.filter(v=>v.id!=="notificaciones").map(v=>(
                    <button key={v.id} className={`ptab${vista===v.id?" active":""}`} onClick={()=>setVista(v.id)}>{v.icon} {v.label}</button>
                  ))}
                </div>
                <div className="panel-body">
                  {/* NOTAS */}
                  {vista==="notas"&&(!notas
                    ?<p className="empty-msg">Aún no hay calificaciones registradas.</p>
                    :<div>
                      <div className="nota-resumen">
                        <div className={`promedio-grande ${Number(notas.promedio)>=70?"ap":"rp"}`}>{notas.promedio}</div>
                        <div><div className="promedio-label">Promedio final</div>
                          <span className={`estado-badge ${notas.estado==="aprobado"?"badge-ap":"badge-rp"}`}>{notas.estado==="aprobado"?"✅ Aprobado":"❌ Reprobado"}</span>
                        </div>
                      </div>
                      <div className="notas-grid">
                        {(notas.evaluaciones||[]).map(ev=>{ const n=notas.notas?.[ev.nombre]??null; const ap=n!==null&&n>=Number(ev.nota_min_apro); return(
                          <div key={ev.nombre} className={`nota-card ${n===null?"sin-nota":ap?"nota-ap":"nota-rp"}`}>
                            <div className="nota-eval-name">{ev.nombre}</div>
                            <div className="nota-valor">{n!==null?n:"—"}</div>
                            <div className="nota-peso">{ev.peso}% del total</div>
                            {n!==null&&<div className="nota-estado">{ap?"✓ Aprobado":"✗ Reprobado"}</div>}
                          </div>); })}
                      </div>
                    </div>
                  )}
                  {/* ASISTENCIA */}
                  {vista==="asistencia"&&(<>
                    {pctAsist!==null&&<div className="asist-resumen">
                      <div className="asist-pct-bar-wrap"><div className="asist-pct-bar" style={{width:`${pctAsist}%`,background:pctAsist>=75?"#2e7d32":pctAsist>=60?"#e65100":"#c62828"}}/></div>
                      <span className={`asist-pct-label ${pctAsist>=75?"ok":"warn"}`}>{pctAsist}% de asistencia efectiva</span>
                      {pctAsist<75&&<span className="asist-warn">⚠️ Por debajo del mínimo requerido (75%)</span>}
                    </div>}
                    {!asist.length?<p className="empty-msg">No hay registros de asistencia.</p>:
                      <div className="cur-table-wrap"><table className="cur-table">
                        <thead><tr><th>Fecha</th><th>Estado</th><th>Observación</th></tr></thead>
                        <tbody>{[...asist].sort((a,b)=>b.fecha.localeCompare(a.fecha)).map(a=>(
                          <tr key={a.id}><td className="bold">{a.fecha}</td>
                          <td><span className={`badge badge-${BA[a.estado]}`}>{LA[a.estado]}</span></td>
                          <td className="muted">{a.observacion||"—"}</td></tr>))}
                        </tbody>
                      </table></div>}
                  </>)}
                  {/* TAREAS */}
                  {vista==="tareas"&&(!tareas.length?<p className="empty-msg">No hay tareas asignadas.</p>:
                    <div className="tareas-grid">{tareas.map(t=>(
                      <div key={t.id} className={`tarea-card ${t.fecha_limite&&new Date(t.fecha_limite)<new Date()?"vencida":""}`}>
                        <div className="tarea-titulo">{t.titulo}</div>
                        {t.descripcion&&<div className="tarea-desc">{t.descripcion}</div>}
                        <div className="tarea-footer">{t.fecha_limite&&<span className={`tarea-limite ${new Date(t.fecha_limite)<new Date()?"expirada":""}`}>📅 {t.fecha_limite}</span>}</div>
                      </div>))}
                    </div>
                  )}
                </div>
              </div>
          )}
        </>)}
      </main>
    </div>
  );
}