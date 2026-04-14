import { useState, useEffect, useCallback } from "react";
import "./Modulodisciplina.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const MESES = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
function fmtFecha(f){
  if(!f) return "—";
  const d = f instanceof Date ? f : new Date(String(f).slice(0,10)+"T12:00:00");
  if(isNaN(d)) return "—";
  return d.toLocaleDateString("es-BO",{day:"2-digit",month:"2-digit",year:"numeric"});
}

// ── Helpers visuales ────────────────────────────────────────
const TIPO_STYLE = {
  MERITO:   { bg:"#e8f5e9", border:"#2e7d32", text:"#2e7d32", icon:"⭐", label:"Mérito"   },
  DEMERITO: { bg:"#ffebee", border:"#c62828", text:"#c62828", icon:"⚠️", label:"Demérito" },
};

function Spinner(){ return <div className="disc-spinner"><div className="disc-ring"/></div>; }

// ── Modal: registrar mérito/demérito ───────────────────────
function ModalRegistro({ cursoId, participantes, catalogo, session, onClose, onGuardado }){
  const [form, setForm] = useState({
    usuario_id:"", tipo:"DEMERITO", catalogo_id:"",
    descripcion:"", puntos:"1", fecha: new Date().toISOString().slice(0,10),
    observacion:""
  });
  const [saving, setSaving]  = useState(false);
  const [error,  setError]   = useState("");

  const catFiltrado = catalogo.filter(c => c.tipo === form.tipo);

  // Al elegir catálogo, autocompletar descripción y puntos
  const onCatChange = (id) => {
    const cat = catalogo.find(c => String(c.id) === String(id));
    setForm(p => ({
      ...p,
      catalogo_id: id,
      descripcion: cat ? cat.nombre : p.descripcion,
      puntos:      cat ? String(cat.puntos) : p.puntos,
    }));
  };

  const guardar = async () => {
    if(!form.usuario_id) return setError("Selecciona un participante");
    if(!form.descripcion.trim()) return setError("La descripción es requerida");
    setSaving(true); setError("");
    try {
      const r = await fetch(`${API}/api/disciplina/registros`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          curso_id:      cursoId,
          usuario_id:    Number(form.usuario_id),
          catalogo_id:   form.catalogo_id || null,
          tipo:          form.tipo,
          descripcion:   form.descripcion.trim(),
          puntos:        Number(form.puntos)||1,
          fecha:         form.fecha,
          registrado_por:session.id,
          observacion:   form.observacion||null,
        })
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.message);
      onGuardado();
    } catch(e){ setError(e.message); } finally{ setSaving(false); }
  };

  return (
    <div className="disc-overlay" onClick={onClose}>
      <div className="disc-modal" onClick={e=>e.stopPropagation()}>
        <div className="disc-modal-header">
          <div className="disc-modal-title">📝 Registrar Mérito / Demérito</div>
          <button className="disc-close" onClick={onClose}>✕</button>
        </div>
        <div className="disc-modal-body">

          {/* Tipo selector */}
          <div className="disc-tipo-selector">
            {["MERITO","DEMERITO"].map(t => {
              const st = TIPO_STYLE[t];
              return (
                <div key={t}
                  className={`disc-tipo-card ${form.tipo===t?"selected":""}`}
                  style={form.tipo===t?{borderColor:st.border,background:st.bg}:{}}
                  onClick={()=>setForm(p=>({...p,tipo:t,catalogo_id:"",descripcion:"",puntos:"1"}))}>
                  <span style={{fontSize:28}}>{st.icon}</span>
                  <span style={{fontSize:14,fontWeight:700,color:form.tipo===t?st.text:"#5a6a80"}}>{st.label}</span>
                </div>
              );
            })}
          </div>

          <div className="disc-form-row">
            <div className="disc-form-group" style={{flex:2}}>
              <label>Participante *</label>
              <select value={form.usuario_id} onChange={e=>setForm(p=>({...p,usuario_id:e.target.value}))}>
                <option value="">— Seleccionar —</option>
                {participantes.map(p=>(
                  <option key={p.id} value={p.id}>
                    {p.ap_paterno} {p.ap_materno}, {p.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="disc-form-group" style={{flex:1}}>
              <label>Fecha</label>
              <input type="date" value={form.fecha}
                onChange={e=>setForm(p=>({...p,fecha:e.target.value}))}/>
            </div>
          </div>

          {/* Catálogo */}
          <div className="disc-form-group">
            <label>Tipo de {form.tipo==="MERITO"?"Mérito":"Demérito"} (catálogo)</label>
            <select value={form.catalogo_id} onChange={e=>onCatChange(e.target.value)}>
              <option value="">— Personalizado —</option>
              {catFiltrado.map(c=>(
                <option key={c.id} value={c.id}>
                  {c.codigo ? `[${c.codigo}] ` : ""}{c.nombre} ({c.puntos} pts)
                </option>
              ))}
            </select>
          </div>

          <div className="disc-form-row">
            <div className="disc-form-group" style={{flex:3}}>
              <label>Descripción del hecho *</label>
              <input type="text"
                placeholder={form.tipo==="MERITO"?"Ej: Presentación sobresaliente en clase":"Ej: Tardanza injustificada el día..."}
                value={form.descripcion}
                onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))}/>
            </div>
            <div className="disc-form-group" style={{flex:1}}>
              <label>Puntos</label>
              <input type="number" min="0.5" max="10" step="0.5"
                value={form.puntos}
                onChange={e=>setForm(p=>({...p,puntos:e.target.value}))}/>
            </div>
          </div>

          <div className="disc-form-group">
            <label>Observación adicional</label>
            <input type="text" placeholder="Notas adicionales..."
              value={form.observacion}
              onChange={e=>setForm(p=>({...p,observacion:e.target.value}))}/>
          </div>

          {error && <div className="disc-error">⚠️ {error}</div>}
        </div>
        <div className="disc-modal-footer">
          <button className="disc-btn-primary" onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : `${TIPO_STYLE[form.tipo].icon} Registrar ${TIPO_STYLE[form.tipo].label}`}
          </button>
          <button className="disc-btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ── Modal: historial de un participante ────────────────────
function ModalHistorial({ participante, cursoId, onClose, onEliminar }){
  const [registros, setRegistros] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(()=>{
    fetch(`${API}/api/disciplina/registros?curso_id=${cursoId}&usuario_id=${participante.id}`)
      .then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setRegistros(d); })
      .finally(()=>setLoading(false));
  },[cursoId, participante.id]);

  const eliminar = async (id) => {
    if(!confirm("¿Eliminar este registro?")) return;
    await fetch(`${API}/api/disciplina/registros/${id}`,{method:"DELETE"});
    setRegistros(prev=>prev.filter(r=>r.id!==id));
    onEliminar();
  };

  const meritos   = registros.filter(r=>r.tipo==="MERITO");
  const demeritos = registros.filter(r=>r.tipo==="DEMERITO");
  const saldo     = meritos.reduce((s,r)=>s+Number(r.puntos),0)
                  - demeritos.reduce((s,r)=>s+Number(r.puntos),0);

  return (
    <div className="disc-overlay" onClick={onClose}>
      <div className="disc-modal disc-modal-lg" onClick={e=>e.stopPropagation()}>
        <div className="disc-modal-header">
          <div>
            <div className="disc-modal-title">
              📋 Historial — {participante.ap_paterno} {participante.ap_materno}, {participante.nombre}
            </div>
            <div style={{fontSize:12,color:"#6b7a90",marginTop:2}}>CI: {participante.ci}</div>
          </div>
          <button className="disc-close" onClick={onClose}>✕</button>
        </div>

        {/* Resumen rápido */}
        <div className="disc-hist-resumen">
          <div className="disc-hist-stat" style={{background:"#e8f5e9",border:"1.5px solid #a5d6a7"}}>
            <span style={{fontSize:22}}>⭐</span>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#2e7d32"}}>{meritos.reduce((s,r)=>s+Number(r.puntos),0)}</div>
              <div style={{fontSize:11,color:"#5a6a80"}}>pts méritos ({meritos.length})</div>
            </div>
          </div>
          <div className="disc-hist-stat" style={{background:"#ffebee",border:"1.5px solid #ef9a9a"}}>
            <span style={{fontSize:22}}>⚠️</span>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:"#c62828"}}>{demeritos.reduce((s,r)=>s+Number(r.puntos),0)}</div>
              <div style={{fontSize:11,color:"#5a6a80"}}>pts deméritos ({demeritos.length})</div>
            </div>
          </div>
          <div className="disc-hist-stat" style={{
            background: saldo>=0?"#f0f4ff":"#fff3e0",
            border:`1.5px solid ${saldo>=0?"#c5cae9":"#ffcc80"}`
          }}>
            <span style={{fontSize:22}}>{saldo>=0?"✅":"📉"}</span>
            <div>
              <div style={{fontSize:22,fontWeight:900,color:saldo>=0?"#003366":"#e65100"}}>
                {saldo>=0?"+":""}{saldo}
              </div>
              <div style={{fontSize:11,color:"#5a6a80"}}>saldo neto</div>
            </div>
          </div>
        </div>

        {/* Lista registros */}
        <div className="disc-modal-body" style={{maxHeight:380,overflowY:"auto"}}>
          {loading ? <Spinner/> : !registros.length ? (
            <div className="disc-empty"><span>📋</span><p>Sin registros de disciplina.</p></div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {registros.map(r => {
                const st = TIPO_STYLE[r.tipo];
                return (
                  <div key={r.id} className="disc-reg-row"
                    style={{borderLeft:`4px solid ${st.border}`, background:st.bg}}>
                    <div style={{flexShrink:0,fontSize:20}}>{st.icon}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13.5,fontWeight:700,color:"#1a2535"}}>{r.descripcion}</div>
                      <div style={{fontSize:11.5,color:"#6b7a90",marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
                        {r.catalogo_nombre && <span>📂 {r.catalogo_nombre}</span>}
                        <span>📆 {fmtFecha(r.fecha)}</span>
                        <span>👤 {r.registrador_ap} {r.registrador_nombre}</span>
                        {r.observacion && <span>💬 {r.observacion}</span>}
                      </div>
                    </div>
                    <div style={{
                      flexShrink:0, fontWeight:900, fontSize:16,
                      color:st.text, fontFamily:"'IBM Plex Mono',monospace",
                      background:"rgba(255,255,255,.7)", padding:"4px 10px",
                      borderRadius:8, border:`1.5px solid ${st.border}`
                    }}>
                      {st.icon} {Number(r.puntos).toFixed(1)} pts
                    </div>
                    <button onClick={()=>eliminar(r.id)} style={{
                      flexShrink:0, background:"#ffebee", color:"#c62828",
                      border:"none", borderRadius:7, padding:"5px 10px",
                      cursor:"pointer", fontSize:12, fontWeight:700
                    }}>🗑</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className="disc-modal-footer">
          <button className="disc-btn-ghost" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL — JEFE DE CURSO
// ══════════════════════════════════════════════════════════
export default function ModuloDisciplina({ cursoId, cursoDetalle, session }) {
  const [resumen,        setResumen]        = useState([]);
  const [catalogo,       setCatalogo]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [modalRegistro,  setModalRegistro]  = useState(false);
  const [modalHistorial, setModalHistorial] = useState(null); // participante obj
  const [toast,          setToast]          = useState(null);
  const [busqueda,       setBusqueda]       = useState("");
  const [filtroTipo,     setFiltroTipo]     = useState("TODOS");

  const showToast = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3000); };

  const participantes = cursoDetalle?.participantes || [];

  const cargar = useCallback(async () => {
    if(!cursoId) return;
    setLoading(true);
    try {
      const [res, cat] = await Promise.all([
        fetch(`${API}/api/disciplina/resumen/${cursoId}`).then(r=>r.json()),
        fetch(`${API}/api/disciplina/catalogo`).then(r=>r.json()),
      ]);
      if(Array.isArray(res)) setResumen(res);
      if(Array.isArray(cat)) setCatalogo(cat);
    } catch{}
    setLoading(false);
  },[cursoId]);

  useEffect(()=>{ cargar(); },[cargar]);

  // Stats globales
  const totalMeritos   = resumen.reduce((s,p)=>s+Number(p.meritos),0);
  const totalDemeritos = resumen.reduce((s,p)=>s+Number(p.demeritos),0);
  const conMeritos     = resumen.filter(p=>p.cant_meritos>0).length;
  const conDemeritos   = resumen.filter(p=>p.cant_demeritos>0).length;

  const resumenFiltrado = resumen.filter(p => {
    const nom = `${p.ap_paterno} ${p.ap_materno} ${p.nombre} ${p.ci}`.toLowerCase();
    if(busqueda && !nom.includes(busqueda.toLowerCase())) return false;
    if(filtroTipo==="MERITOS"   && p.cant_meritos===0)   return false;
    if(filtroTipo==="DEMERITOS" && p.cant_demeritos===0) return false;
    if(filtroTipo==="LIMPIO"    && (p.cant_meritos>0||p.cant_demeritos>0)) return false;
    return true;
  });

  return (
    <div className="disc-wrap">
      {/* Header con acción */}
      <div className="disc-topbar">
        <div>
          <h2 className="disc-title">⚖️ Módulo de Disciplina</h2>
          <p className="disc-subtitle">Registro de méritos y deméritos por participante</p>
        </div>
        <button className="disc-btn-primary" onClick={()=>setModalRegistro(true)}>
          ➕ Registrar mérito / demérito
        </button>
      </div>

      {/* Stats */}
      <div className="disc-stats">
        <div className="disc-stat disc-green">
          <span className="disc-stat-icon">⭐</span>
          <div>
            <div className="disc-stat-val">{totalMeritos.toFixed(0)}</div>
            <div className="disc-stat-lbl">Puntos méritos</div>
            <div className="disc-stat-sub">{conMeritos} participantes</div>
          </div>
        </div>
        <div className="disc-stat disc-red">
          <span className="disc-stat-icon">⚠️</span>
          <div>
            <div className="disc-stat-val">{totalDemeritos.toFixed(0)}</div>
            <div className="disc-stat-lbl">Puntos deméritos</div>
            <div className="disc-stat-sub">{conDemeritos} participantes</div>
          </div>
        </div>
        <div className="disc-stat disc-blue">
          <span className="disc-stat-icon">👥</span>
          <div>
            <div className="disc-stat-val">{resumen.length}</div>
            <div className="disc-stat-lbl">Participantes</div>
            <div className="disc-stat-sub">{resumen.filter(p=>p.saldo===0&&p.cant_meritos===0).length} sin registros</div>
          </div>
        </div>
        <div className="disc-stat disc-orange">
          <span className="disc-stat-icon">📊</span>
          <div>
            <div className="disc-stat-val">{(totalMeritos - totalDemeritos).toFixed(0)}</div>
            <div className="disc-stat-lbl">Saldo neto del curso</div>
            <div className="disc-stat-sub">{totalMeritos-totalDemeritos>=0?"✅ Favorable":"📉 Desfavorable"}</div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="disc-filtros">
        <input type="text" className="disc-search"
          placeholder="🔍 Buscar participante..."
          value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {[
            ["TODOS","Todos"],
            ["MERITOS","⭐ Con méritos"],
            ["DEMERITOS","⚠️ Con deméritos"],
            ["LIMPIO","✅ Sin registros"],
          ].map(([v,l])=>(
            <button key={v}
              className={`disc-filter-btn ${filtroTipo===v?"active":""}`}
              onClick={()=>setFiltroTipo(v)}>{l}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      {loading ? <Spinner/> : !resumenFiltrado.length ? (
        <div className="disc-empty">
          <span>⚖️</span>
          <p>No hay registros de disciplina para este filtro.</p>
        </div>
      ) : (
        <div className="disc-tabla-wrap">
          <table className="disc-tabla">
            <thead>
              <tr>
                <th>#</th>
                <th>Participante</th>
                <th>CI</th>
                <th style={{textAlign:"center"}}>⭐ Méritos</th>
                <th style={{textAlign:"center"}}>⚠️ Deméritos</th>
                <th style={{textAlign:"center"}}>Saldo</th>
                <th style={{textAlign:"center"}}>Estado</th>
                <th style={{textAlign:"center"}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {resumenFiltrado.map((p,i) => {
                const saldo = p.saldo;
                const saldoColor = saldo>0?"#2e7d32":saldo<0?"#c62828":"#5a6a80";
                return (
                  <tr key={p.id} className={p.cant_demeritos>0?"tr-demerito":p.cant_meritos>0?"tr-merito":""}>
                    <td className="disc-muted">{i+1}</td>
                    <td>
                      <div className="disc-nombre">{p.ap_paterno} {p.ap_materno}, {p.nombre}</div>
                      {p.grado && <div className="disc-grado">{p.grado}</div>}
                    </td>
                    <td className="disc-muted">{p.ci}</td>
                    <td style={{textAlign:"center"}}>
                      {p.cant_meritos>0 ? (
                        <span className="disc-badge-merito">
                          ⭐ {Number(p.meritos).toFixed(1)} pts ({p.cant_meritos})
                        </span>
                      ) : <span className="disc-muted">—</span>}
                    </td>
                    <td style={{textAlign:"center"}}>
                      {p.cant_demeritos>0 ? (
                        <span className="disc-badge-demerito">
                          ⚠️ {Number(p.demeritos).toFixed(1)} pts ({p.cant_demeritos})
                        </span>
                      ) : <span className="disc-muted">—</span>}
                    </td>
                    <td style={{textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",
                      fontWeight:900,color:saldoColor,fontSize:15}}>
                      {saldo>0?"+":""}{saldo}
                    </td>
                    <td style={{textAlign:"center"}}>
                      {p.cant_meritos===0 && p.cant_demeritos===0
                        ? <span className="disc-badge-limpio">✅ Sin registros</span>
                        : saldo>=0
                          ? <span className="disc-badge-ok">👍 Favorable</span>
                          : <span className="disc-badge-mal">👎 Desfavorable</span>
                      }
                    </td>
                    <td style={{textAlign:"center"}}>
                      <button className="disc-btn-ver"
                        onClick={()=>setModalHistorial(p)}>
                        📋 Ver historial
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal registro */}
      {modalRegistro && (
        <ModalRegistro
          cursoId={cursoId}
          participantes={participantes}
          catalogo={catalogo}
          session={session}
          onClose={()=>setModalRegistro(false)}
          onGuardado={()=>{
            setModalRegistro(false);
            showToast("✅ Registro guardado");
            cargar();
          }}
        />
      )}

      {/* Modal historial */}
      {modalHistorial && (
        <ModalHistorial
          participante={modalHistorial}
          cursoId={cursoId}
          onClose={()=>setModalHistorial(null)}
          onEliminar={cargar}
        />
      )}

      {toast && (
        <div className={`disc-toast ${toast.type==="error"?"disc-toast-error":""}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}