import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useNotificaciones } from "../../../hooks/useNotificaciones";
import { NotificacionesPanel, NotifBell } from "../../Shared/NotificacionesPanel";
import "../../Shared/NotificacionesPanel.css";
import "./DashboardJefeCurso.css";
import DisciplinaJefeCurso from "../../Disciplina/DisciplinaJefeCurso";
import "../../Disciplina/DisciplinaJefeCurso.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
function getSession() {
  try { return JSON.parse(localStorage.getItem("eaen_session") || "null"); }
  catch { return null; }
}
function Spinner() { return <div className="jc-spinner"><div className="spin-ring"/></div>; }

export default function DashboardJefeCurso() {
  const navigate = useNavigate();
  const session  = getSession();

  const [cursos,       setCursos]       = useState([]);
  const [cursoId,      setCursoId]      = useState(null);
  const [cursoDetalle, setCursoDetalle] = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [loadingCurso, setLoadingCurso] = useState(false);
  const [vista,        setVista]        = useState("resumen");

  const { notifs, noLeidas, loading: loadingNotifs, marcarLeida, marcarTodasLeidas } = useNotificaciones(30);

  const nombre = session ? `${session.ap_paterno||""} ${session.ap_materno||""}, ${session.nombre||""}`.trim() : "Jefe de Curso";

  useEffect(()=>{
    if(!session){navigate("/");return;}
    fetch(`${API}/api/cursos/jefe/${session.id}`).then(r=>r.json()).then(d=>{
      if(!Array.isArray(d))return;
      setCursos(d);
      if(d.length) setCursoId(d[0].id);
    }).catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  useEffect(()=>{
    if(!cursoId)return;
    setLoadingCurso(true);
    fetch(`${API}/api/cursos/${cursoId}`).then(r=>r.json())
      .then(d=>setCursoDetalle(d)).catch(()=>{}).finally(()=>setLoadingCurso(false));
  },[cursoId]);

  const curso = cursos.find(c=>c.id===cursoId);

  const VISTAS=[
    {id:"resumen",       icon:"📊", label:"Resumen"},
    {id:"participantes", icon:"👥", label:"Participantes"},
    {id:"materias",      icon:"📚", label:"Materias"},
    {id:"disciplina",    icon:"⚖️", label:"Disciplina"},
    {id:"notificaciones",icon:"🔔", label:"Notificaciones"},
  ];

  return (
    <div className="jc-page">
      <aside className="jc-sidebar">
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
          <div><div className="sidebar-title">EAEN Avaroa</div><div className="sidebar-role">🪖 Jefe de Curso</div></div>
        </div>
        <div className="sidebar-user">
          <div className="user-avatar">{nombre[0]||"J"}</div>
          <div><div className="user-name">{nombre}</div><div className="user-ci">CI: {session?.ci}</div></div>
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

      <main className="jc-main">
        <header className="jc-header">
          <div><h1>Panel Jefe de Curso</h1><p>Supervisión de participantes, materias y comunicaciones.</p></div>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <NotifBell noLeidas={noLeidas} onClick={()=>setVista("notificaciones")}/>
            <div className="header-date">{new Date().toLocaleDateString("es-BO",{weekday:"long",day:"numeric",month:"long"})}</div>
          </div>
        </header>

        {loading ? <Spinner/> : (<>
          <div className="jc-stats">
            <div className="jc-stat blue"><span>🎓</span><div><div className="sv">{cursos.length}</div><div className="sl">Cursos a cargo</div></div></div>
            <div className="jc-stat orange"><span>👥</span><div><div className="sv">{cursoDetalle?.participantes?.length??"—"}</div><div className="sl">Participantes</div></div></div>
            <div className="jc-stat green"><span>📚</span><div><div className="sv">{cursoDetalle?.materias?.length??"—"}</div><div className="sl">Materias</div></div></div>
            <div className={`jc-stat ${noLeidas>0?"red":"green"}`} style={{cursor:"pointer"}} onClick={()=>setVista("notificaciones")}>
              <span>🔔</span><div><div className="sv">{noLeidas}</div><div className="sl">Notificaciones</div></div>
            </div>
          </div>

          {/* ── PANEL NOTIFICACIONES ── */}
          {vista==="notificaciones" && (
            <div className="jc-panel">
              <div className="panel-header" style={{flexDirection:"column",alignItems:"flex-start",gap:4}}>
                <h2 style={{fontSize:16,fontWeight:700,color:"#4a0404"}}>🔔 Notificaciones institucionales</h2>
                <p style={{fontSize:13,color:"#8898aa"}}>Haz clic en una notificación para expandirla, luego en "Marcar como leída" para que desaparezca.</p>
              </div>
              <div className="panel-body">
                <NotificacionesPanel notifs={notifs} loading={loadingNotifs} marcarLeida={marcarLeida} marcarTodasLeidas={marcarTodasLeidas}/>
              </div>
            </div>
          )}

          {/* ── OTROS MÓDULOS ── */}
          {vista!=="notificaciones" && (!cursos.length
            ? <div className="jc-empty"><span>📭</span><p>No tiene cursos asignados como Jefe de Curso.</p></div>
            : <div className="jc-panel">
                <div className="panel-header">
                  <div className="selector-group">
                    <label>Curso activo</label>
                    <select value={cursoId||""} onChange={e=>setCursoId(Number(e.target.value))}>
                      {cursos.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
                    </select>
                  </div>
                  {curso&&<div className="curso-meta">
                    {curso.estado&&<span className={`badge ${curso.estado==="ACTIVO"?"badge-activo":"badge-inactivo"}`}>{curso.estado}</span>}
                    {curso.fecha_inicio&&<span className="meta-fecha">📅 {curso.fecha_inicio} → {curso.fecha_fin}</span>}
                  </div>}
                </div>
                <div className="panel-tabs">
                  {VISTAS.filter(v=>v.id!=="notificaciones").map(v=>(
                    <button key={v.id} className={`ptab${vista===v.id?" active":""}`} onClick={()=>setVista(v.id)}>{v.icon} {v.label}</button>
                  ))}
                </div>
                <div className="panel-body">
                  {loadingCurso ? <Spinner/> : (<>

                    {/* RESUMEN */}
                    {vista==="resumen"&&cursoDetalle&&(
                      <div className="resumen-grid">
                        <div className="resumen-card"><h3>📋 Información del curso</h3>
                          <div className="info-rows">
                            <div className="info-row"><span>Nombre:</span><strong>{cursoDetalle.nombre}</strong></div>
                            <div className="info-row"><span>Horas académicas:</span><strong>{cursoDetalle.horas_academicas||"—"}</strong></div>
                            <div className="info-row"><span>Modalidad:</span><strong>{cursoDetalle.modalidad||"—"}</strong></div>
                            <div className="info-row"><span>Inicio:</span><strong>{cursoDetalle.fecha_inicio}</strong></div>
                            <div className="info-row"><span>Fin:</span><strong>{cursoDetalle.fecha_fin}</strong></div>
                            <div className="info-row"><span>Estado:</span><span className={`badge ${cursoDetalle.estado==="ACTIVO"?"badge-activo":"badge-inactivo"}`}>{cursoDetalle.estado}</span></div>
                          </div>
                        </div>
                        <div className="resumen-card"><h3>📊 Estadísticas</h3>
                          <div className="mini-stats">
                            <div className="mini-stat"><div className="ms-val">{cursoDetalle.participantes?.length}</div><div className="ms-lbl">Participantes</div></div>
                            <div className="mini-stat"><div className="ms-val">{cursoDetalle.materias?.length}</div><div className="ms-lbl">Materias</div></div>
                            <div className="mini-stat"><div className="ms-val">{cursoDetalle.materias?.filter(m=>m.docente_id).length}</div><div className="ms-lbl">Con docente</div></div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PARTICIPANTES */}
                    {vista==="participantes"&&(!cursoDetalle?.participantes?.length?<p className="empty-msg">No hay participantes.</p>:
                      <div className="jc-table-wrap"><table className="jc-table">
                        <thead><tr><th>#</th><th>Nombre completo</th><th>CI</th><th>Correo</th><th>Estado</th></tr></thead>
                        <tbody>{cursoDetalle.participantes.map((p,i)=>(
                          <tr key={p.id}><td className="muted">{i+1}</td>
                          <td className="bold">{p.ap_paterno} {p.ap_materno}, {p.nombre}</td>
                          <td className="muted">{p.ci}</td><td className="muted">{p.correo||p.email||"—"}</td>
                          <td><span className={`badge ${p.estado==="ACTIVO"?"badge-activo":"badge-inactivo"}`}>{p.estado}</span></td></tr>))}
                        </tbody>
                      </table></div>
                    )}

                    {/* MATERIAS */}
                    {vista==="materias"&&(!cursoDetalle?.materias?.length?<p className="empty-msg">Sin materias registradas.</p>:
                      <div className="materias-cards">{cursoDetalle.materias.map(m=>(
                        <div key={m.id} className="materia-card">
                          <div className="mc-header"><div className="mc-nombre">{m.nombre}</div>{m.codigo&&<span className="mc-codigo">{m.codigo}</span>}</div>
                          {m.descripcion&&<p className="mc-desc">{m.descripcion}</p>}
                          <div className="mc-footer">
                            {m.horas&&<span className="mc-meta">⏱ {m.horas}h</span>}
                            {m.docente_nombre?<span className="mc-docente">👨‍🏫 {m.docente_ap_paterno} {m.docente_ap_materno}, {m.docente_nombre}</span>
                              :<span className="mc-sin-docente">⚠️ Sin docente asignado</span>}
                          </div>
                        </div>))}
                      </div>
                    )}

                    {/* DISCIPLINA */}
                    {vista==="disciplina" && (
                      <DisciplinaJefeCurso
                        session={session}
                        cursoId={cursoId}
                      />
                    )}

                  </>)}
                </div>
              </div>
          )}
        </>)}
      </main>
    </div>
  );
}