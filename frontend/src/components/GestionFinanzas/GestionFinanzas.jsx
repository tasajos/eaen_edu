import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./GestionFinanzas.css";
import SidebarJefe from "../Shared/SidebarJefe";
import PerfilUsuario from "../Shared/PerfilUsuario";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";
const getSession = () => { try{ return JSON.parse(localStorage.getItem("eaen_session")||"null"); }catch{ return null; } };

const MESES_ES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio",
                  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const TIPO_COLOR = {
  MATRICULA:  {bg:"#e3f2fd",border:"#1565c0",text:"#1565c0",icon:"🎓"},
  GUIA:       {bg:"#f3e5f5",border:"#6a1b9a",text:"#6a1b9a",icon:"📖"},
  MENSUALIDAD:{bg:"#e8f5e9",border:"#2e7d32",text:"#2e7d32",icon:"📅"},
  OTRO:       {bg:"#fff3e0",border:"#e65100",text:"#e65100",icon:"💳"},
};
const ESTADO_STYLE = {
  PENDIENTE:  {bg:"#fff8e1",color:"#f57f17",label:"⏳ Pendiente"},
  PAGADO:     {bg:"#e8f5e9",color:"#2e7d32",label:"✅ Pagado"},
  EXONERADO:  {bg:"#e3f2fd",color:"#1565c0",label:"🔵 Exonerado"},
  MORA:       {bg:"#ffebee",color:"#c62828",label:"🔴 Mora"},
};

function Spinner(){ return <div className="gfin-spinner"><div className="gfin-ring"/></div>; }
function fmtFecha(f){
  if(!f || String(f).trim()==="") return "—";
  // Manejar tanto string "YYYY-MM-DD" como objetos Date de MySQL
  let d;
  if(f instanceof Date) {
    d = f;
  } else {
    const s = String(f).slice(0,10); // tomar solo YYYY-MM-DD
    d = new Date(s + "T12:00:00");
  }
  if(isNaN(d)) return "—";
  return d.toLocaleDateString("es-BO",{day:"2-digit",month:"2-digit",year:"numeric"});
}

/* ── Generador de voucher para el admin ──────────────────── */
function generarVoucherAdmin(pago, usuario) {
  const tc = TIPO_COLOR[pago.tipo] || TIPO_COLOR.OTRO;
  const concepto = pago.descripcion
    || `${tc.icon} ${pago.tipo}${pago.mes ? " " + MESES_ES[pago.mes] : ""}${pago.anio ? " " + pago.anio : ""}`;
  const nombre = `${usuario.ap_paterno || ""} ${usuario.ap_materno || ""}, ${usuario.nombre || ""}`.trim();

  const html = `<!DOCTYPE html>
<html lang="es"><head>
<meta charset="UTF-8"/><title>Voucher — ${nombre}</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Segoe UI',Arial,sans-serif;background:#f0f4f8;display:flex;justify-content:center;padding:32px 16px}
  .v{background:#fff;border-radius:16px;width:480px;box-shadow:0 8px 40px rgba(0,0,0,.15);overflow:hidden}
  .vh{background:#003366;color:#fff;padding:22px 28px;display:flex;align-items:center;gap:14}
  .vl{width:48px;height:48px;background:rgba(255,255,255,.15);border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:24px}
  .vi h1{font-size:15px;font-weight:800}.vi p{font-size:11px;opacity:.7;margin-top:2px}
  .vbadge{background:#ff6600;color:#fff;padding:5px 13px;border-radius:20px;font-size:11px;font-weight:700;margin-left:auto}
  .vb{padding:22px 28px}.vt{font-size:18px;font-weight:800;color:#003366;margin-bottom:16px}
  .vm{text-align:center;background:#f0f4ff;border-radius:12px;padding:16px;margin-bottom:18px;border:2px solid #c5cae9}
  .vm label{font-size:10px;color:#5a6a80;text-transform:uppercase;letter-spacing:.5px}
  .vm .mv{font-size:34px;font-weight:900;color:#003366;font-family:'Courier New',monospace;margin-top:3px}
  .vs{margin-bottom:16px}.vs h3{font-size:10px;font-weight:700;color:#8898aa;text-transform:uppercase;letter-spacing:.8px;margin-bottom:8px;padding-bottom:5px;border-bottom:1.5px solid #f0f4f8}
  .vr{display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f8fafc;font-size:13px}
  .vr:last-child{border:none}.vr span:first-child{color:#6b7a90}.vr span:last-child{font-weight:600;color:#1a2535}
  .vf{background:#f7f9fc;border-top:2px solid #f0f4f8;padding:14px 28px;text-align:center}
  .vf p{font-size:11px;color:#8898aa;line-height:1.5}.vf strong{color:#003366}
  .vnum{font-size:10px;color:#bbb;margin-top:6px;font-family:monospace}
  @media print{body{background:white;padding:0}.v{box-shadow:none;border-radius:0;width:100%}}
</style></head><body>
<div class="v">
  <div class="vh">
    <div class="vl"><img src="/eaen.png" style="width:40px;height:40px;object-fit:contain" alt="EAEN"/></div>
    <div class="vi"><h1>EAEN Avaroa</h1><p>Escuela de Altos Estudios Nacionales</p></div>
    <div class="vbadge">VOUCHER</div>
  </div>
  <div class="vb">
    <div class="vt">🧾 Comprobante de Pago</div>
    <div class="vm">
      <label>Monto pagado</label>
      <div class="mv">Bs. ${Number(pago.monto_pagado||pago.monto).toFixed(2)}</div>
    </div>
    <div class="vs"><h3>Concepto</h3>
      <div class="vr"><span>Descripción</span><span>${concepto}</span></div>
      <div class="vr"><span>Monto original</span><span>Bs. ${Number(pago.monto).toFixed(2)}</span></div>
      ${pago.fecha_venc?`<div class="vr"><span>Vencimiento</span><span>${fmtFecha(pago.fecha_venc)}</span></div>`:""}
    </div>
    <div class="vs"><h3>Datos del pago</h3>
      <div class="vr"><span>Fecha de pago</span><span>${fmtFecha(pago.fecha_pago)}</span></div>
      ${pago.comprobante?`<div class="vr"><span>N° Comprobante</span><span>${pago.comprobante}</span></div>`:""}
      ${pago.observacion?`<div class="vr"><span>Observación</span><span>${pago.observacion}</span></div>`:""}
    </div>
    <div class="vs"><h3>Cursante</h3>
      <div class="vr"><span>Nombre</span><span>${nombre}</span></div>
      <div class="vr"><span>CI</span><span>${usuario.ci||"—"}</span></div>
    </div>
  </div>
  <div class="vf">
    <p><strong>EAEN Avaroa — Departamento de Finanzas</strong><br/>Comprobante oficial de pago.</p>
    <div class="vnum">Generado: ${new Date().toLocaleString("es-BO")} · ID: ${pago.id||"—"}</div>
  </div>
</div>
<div style="text-align:center;padding:20px;background:#f7f9fc;border-top:2px solid #f0f4f8">
  <button onclick="window.print()" style="padding:11px 28px;background:#003366;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer">🖨️ Imprimir / Guardar PDF</button>
</div>
</body></html>`;
  const win = window.open("", "_blank", "width=560,height=800");
  if(win){ win.document.write(html); win.document.close(); }
}

/* ── Modal: historial de pagos de un cursante ─────────────── */
function ModalHistorial({ usuario, conceptos, onClose, onEditar }) {
  const MESES = MESES_ES;
  return (
    <div className="gfin-overlay" onClick={onClose}>
      <div className="gfin-modal" style={{maxWidth:620}} onClick={e=>e.stopPropagation()}>
        <div className="gfin-modal-header">
          <div style={{display:"flex",flexDirection:"column"}}>
            <div className="gfin-modal-title">📋 Historial de pagos</div>
            <div style={{fontSize:13,color:"rgba(255,255,255,.7)",marginTop:2}}>
              {usuario.ap_paterno} {usuario.ap_materno}, {usuario.nombre} — CI: {usuario.ci}
            </div>
          </div>
          <button className="gfin-close" onClick={onClose}>✕</button>
        </div>
        <div className="gfin-modal-body" style={{maxHeight:"65vh",overflowY:"auto"}}>
          {usuario.pagos.length === 0 ? (
            <p style={{textAlign:"center",color:"#888",padding:24}}>Sin pagos registrados.</p>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:10}}>
              {usuario.pagos.map((pg, i) => {
                const tc  = TIPO_COLOR[pg.tipo] || TIPO_COLOR.OTRO;
                const est = ESTADO_STYLE[pg.estado] || ESTADO_STYLE.PENDIENTE;
                const concepto = pg.descripcion
                  || `${tc.icon} ${pg.tipo}${pg.mes?" "+MESES[pg.mes]:""}${pg.anio?" "+pg.anio:""}`;
                return (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"12px 14px", borderRadius:12,
                    border:`1.5px solid ${tc.border}20`,
                    background: pg.estado==="PAGADO" ? "#f8fff8" : pg.estado==="MORA" ? "#fff8f8" : "#fffdf0"
                  }}>
                    {/* Tipo badge */}
                    <div style={{
                      width:44,height:44,borderRadius:10,flexShrink:0,
                      background:tc.bg,color:tc.color,
                      display:"flex",alignItems:"center",justifyContent:"center",fontSize:22
                    }}>{tc.icon}</div>

                    {/* Info */}
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:700,fontSize:14,color:"#1a2535"}}>{concepto}</div>
                      <div style={{fontSize:12,color:"#6b7a90",marginTop:3,display:"flex",gap:10,flexWrap:"wrap"}}>
                        <span>Bs. {Number(pg.monto).toFixed(2)}</span>
                        {pg.fecha_pago && <span>📅 Pagado: {fmtFecha(pg.fecha_pago)}</span>}
                        {pg.comprobante && <span>🧾 {pg.comprobante}</span>}
                        {pg.fecha_venc && pg.estado !== "PAGADO" && (
                          <span style={{color: pg.estado==="MORA"?"#c62828":"#f57f17"}}>
                            ⏰ Vence: {fmtFecha(pg.fecha_venc)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Estado + acciones */}
                    <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,flexShrink:0}}>
                      <span style={{
                        padding:"4px 10px",borderRadius:20,fontSize:11,fontWeight:700,
                        background:est.bg,color:est.color,whiteSpace:"nowrap"
                      }}>{est.label}</span>
                      <div style={{display:"flex",gap:6}}>
                        {pg.estado==="PAGADO" && (
                          <button
                            onClick={()=>generarVoucherAdmin(pg, usuario)}
                            style={{
                              padding:"5px 10px",borderRadius:7,border:"none",
                              background:"#003366",color:"#fff",
                              fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"
                            }}
                          >🖨️ Voucher</button>
                        )}
                        <button
                          onClick={()=>onEditar(pg)}
                          style={{
                            padding:"5px 10px",borderRadius:7,border:"1.5px solid #e8ecf2",
                            background:"#fff",color:"#5a6a80",
                            fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"
                          }}
                        >✏️ Editar</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Modal: registrar pago ─────────────────────────────── */
function ModalPago({ pago, usuario, onClose, onGuardado, registrado_por }){
  const [form, setForm] = useState({
    estado: pago.estado || "PAGADO",
    monto_pagado: pago.monto_pagado || pago.monto || "",
    fecha_pago: pago.fecha_pago?.slice(0,10) || new Date().toISOString().slice(0,10),
    comprobante: pago.comprobante || "",
    observacion: pago.observacion || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const guardar = async () => {
    setSaving(true); setError("");
    try {
      const r = await fetch(`${API}/finanzas/pagos/${pago.concepto_id}/${usuario.id}`,{
        method:"PATCH", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({...form, registrado_por})
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.message);
      onGuardado();
    } catch(e){ setError(e.message); } finally{ setSaving(false); }
  };

  const tc = TIPO_COLOR[pago.tipo] || TIPO_COLOR.MENSUALIDAD;

  return (
    <div className="gfin-overlay" onClick={onClose}>
      <div className="gfin-modal" onClick={e=>e.stopPropagation()}>
        <div className="gfin-modal-header">
          <div className="gfin-modal-title">💳 Registrar pago</div>
          <button className="gfin-close" onClick={onClose}>✕</button>
        </div>
        <div className="gfin-modal-body">
          {/* Info cursante */}
          <div style={{
            background:"#f7f9fc",borderRadius:10,padding:"12px 16px",marginBottom:16,
            display:"flex",alignItems:"center",gap:12,border:"1.5px solid #eef2f7"
          }}>
            <div style={{
              width:40,height:40,borderRadius:"50%",background:"#003366",color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:16,fontWeight:700,flexShrink:0
            }}>{usuario.ap_paterno?.[0]||"?"}</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:"#1a2535"}}>
                {usuario.ap_paterno} {usuario.ap_materno}, {usuario.nombre}
              </div>
              <div style={{fontSize:12,color:"#6b7a90"}}>CI: {usuario.ci}</div>
            </div>
            <div style={{
              marginLeft:"auto",background:tc.bg,color:tc.text,
              padding:"5px 14px",borderRadius:20,fontSize:12,fontWeight:700,
              border:`1.5px solid ${tc.border}`
            }}>
              {tc.icon} {pago.descripcion || `${pago.tipo} ${pago.mes?MESES_ES[pago.mes]:""} ${pago.anio||""}`}
            </div>
          </div>

          {/* Monto */}
          <div style={{
            textAlign:"center",padding:"14px",background:"#f0f4ff",
            borderRadius:10,marginBottom:16,border:"1.5px solid #c5cae9"
          }}>
            <div style={{fontSize:11,color:"#5a6a80",textTransform:"uppercase",letterSpacing:".5px"}}>Monto a cobrar</div>
            <div style={{fontSize:28,fontWeight:900,color:"#003366",fontFamily:"'IBM Plex Mono',monospace"}}>
              Bs. {Number(pago.monto).toFixed(2)}
            </div>
            {pago.fecha_venc && <div style={{fontSize:11,color:"#8898aa",marginTop:2}}>Vence: {fmtFecha(pago.fecha_venc)}</div>}
          </div>

          <div className="gfin-form-row">
            <div className="gfin-form-group">
              <label>Estado *</label>
              <select value={form.estado} onChange={e=>setForm(p=>({...p,estado:e.target.value}))}>
                <option value="PENDIENTE">⏳ Pendiente</option>
                <option value="PAGADO">✅ Pagado</option>
                <option value="EXONERADO">🔵 Exonerado</option>
                <option value="MORA">🔴 Mora</option>
              </select>
            </div>
            <div className="gfin-form-group">
              <label>Monto pagado (Bs.)</label>
              <input type="number" min="0" step="0.01"
                value={form.monto_pagado}
                onChange={e=>setForm(p=>({...p,monto_pagado:e.target.value}))}
                disabled={["EXONERADO","MORA","PENDIENTE"].includes(form.estado)}
              />
            </div>
          </div>
          <div className="gfin-form-row">
            <div className="gfin-form-group">
              <label>Fecha de pago</label>
              <input type="date" value={form.fecha_pago}
                onChange={e=>setForm(p=>({...p,fecha_pago:e.target.value}))}
                disabled={["EXONERADO","MORA","PENDIENTE"].includes(form.estado)}
              />
            </div>
            <div className="gfin-form-group">
              <label>N° Comprobante / Recibo</label>
              <input type="text" placeholder="Ej: REC-2026-001"
                value={form.comprobante}
                onChange={e=>setForm(p=>({...p,comprobante:e.target.value}))}
              />
            </div>
          </div>
          <div className="gfin-form-group">
            <label>Observación</label>
            <input type="text" placeholder="Notas adicionales..."
              value={form.observacion}
              onChange={e=>setForm(p=>({...p,observacion:e.target.value}))}
            />
          </div>
          {error && <div className="gfin-error">⚠️ {error}</div>}
        </div>
        <div className="gfin-modal-footer">
          <button className="gfin-btn-primary" onClick={guardar} disabled={saving}>
            {saving ? "Guardando..." : "💾 Guardar pago"}
          </button>
          <button className="gfin-btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ── Modal: crear concepto ─────────────────────────────── */
function ModalConcepto({ cursoId, onClose, onCreado, creado_por }){
  const anioActual = new Date().getFullYear();
  const [form, setForm] = useState({
    tipo:"MENSUALIDAD", descripcion:"", monto:"",
    fecha_venc:"", mes: String(new Date().getMonth()+1), anio: String(anioActual)
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState("");

  const crear = async () => {
    if(!form.monto || Number(form.monto)<=0) return setError("El monto debe ser mayor a 0");
    setSaving(true); setError("");
    try {
      const r = await fetch(`${API}/finanzas/conceptos`,{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({...form, curso_id:cursoId,
          monto:Number(form.monto), mes:form.mes?Number(form.mes):null,
          anio:form.anio?Number(form.anio):null, creado_por})
      });
      const d = await r.json();
      if(!r.ok) throw new Error(d.message);
      onCreado(d);
    } catch(e){ setError(e.message); } finally{ setSaving(false); }
  };

  return (
    <div className="gfin-overlay" onClick={onClose}>
      <div className="gfin-modal" onClick={e=>e.stopPropagation()}>
        <div className="gfin-modal-header">
          <div className="gfin-modal-title">➕ Nuevo concepto de cobro</div>
          <button className="gfin-close" onClick={onClose}>✕</button>
        </div>
        <div className="gfin-modal-body">
          {/* Tipo selector visual */}
          <div className="gfin-tipo-grid" style={{gridTemplateColumns:"repeat(4,1fr)"}}>
            {Object.entries(TIPO_COLOR).map(([tipo,col])=>(
              <div key={tipo}
                className={`gfin-tipo-card ${form.tipo===tipo?"selected":""}`}
                style={form.tipo===tipo?{borderColor:col.border,background:col.bg}:{}}
                onClick={()=>setForm(p=>({...p,tipo}))}>
                <div style={{fontSize:26}}>{col.icon}</div>
                <div style={{fontSize:13,fontWeight:700,color:form.tipo===tipo?col.text:"#5a6a80"}}>
                  {tipo.charAt(0)+tipo.slice(1).toLowerCase()}
                </div>
              </div>
            ))}
          </div>

          <div className="gfin-form-row">
            <div className="gfin-form-group">
              <label>Monto (Bs.) *</label>
              <input type="number" min="0" step="0.01" placeholder="0.00"
                value={form.monto} onChange={e=>setForm(p=>({...p,monto:e.target.value}))}/>
            </div>
            <div className="gfin-form-group">
              <label>Fecha vencimiento</label>
              <input type="date" value={form.fecha_venc}
                onChange={e=>setForm(p=>({...p,fecha_venc:e.target.value}))}/>
            </div>
          </div>

          {form.tipo === "MENSUALIDAD" && (
            <div className="gfin-form-row">
              <div className="gfin-form-group">
                <label>Mes</label>
                <select value={form.mes} onChange={e=>setForm(p=>({...p,mes:e.target.value}))}>
                  {MESES_ES.slice(1).map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
                </select>
              </div>
              <div className="gfin-form-group">
                <label>Año</label>
                <select value={form.anio} onChange={e=>setForm(p=>({...p,anio:e.target.value}))}>
                  {[anioActual-1,anioActual,anioActual+1].map(a=><option key={a} value={a}>{a}</option>)}
                </select>
              </div>
            </div>
          )}

          <div className="gfin-form-group">
            <label>Descripción (opcional)</label>
            <input type="text" placeholder={`Ej: ${form.tipo==="MENSUALIDAD"?`Mensualidad ${MESES_ES[Number(form.mes)]} ${form.anio}`:form.tipo==="MATRICULA"?"Matrícula 2026":"Guía académica"}`}
              value={form.descripcion} onChange={e=>setForm(p=>({...p,descripcion:e.target.value}))}/>
          </div>

          {error && <div className="gfin-error">⚠️ {error}</div>}
        </div>
        <div className="gfin-modal-footer">
          <button className="gfin-btn-primary" onClick={crear} disabled={saving}>
            {saving ? "Creando..." : "✅ Crear concepto"}
          </button>
          <button className="gfin-btn-ghost" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function GestionFinanzas(){
  const navigate  = useNavigate();
  const session   = getSession();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cursos,      setCursos]      = useState([]);
  const [cursoId,     setCursoId]     = useState(null);
  const [conceptos,   setConceptos]   = useState([]);
  const [partics,     setPartics]     = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [toast,       setToast]       = useState(null);
  const [modalPago,      setModalPago]      = useState(null); // {pago, usuario}
  const [modalConc,      setModalConc]      = useState(false);
  const [historialModal, setHistorialModal] = useState(null); // usuario
  const [filtroTipo,  setFiltroTipo]  = useState("TODOS");
  const [filtroEst,   setFiltroEst]   = useState("TODOS");
  const [busqueda,    setBusqueda]    = useState("");

  const showToast = (msg,type="ok") => { setToast({msg,type}); setTimeout(()=>setToast(null),3500); };

  // Cargar cursos
  useEffect(()=>{
    if(!session){ navigate("/"); return; }
    fetch(`${API}/cursos`).then(r=>r.json()).then(d=>{ if(Array.isArray(d)){ setCursos(d); if(d.length) setCursoId(d[0].id); }}).catch(()=>{});
  },[]);

  const cargar = useCallback(async()=>{
    if(!cursoId) return;
    setLoading(true);
    try {
      const r = await fetch(`${API}/finanzas/pagos?curso_id=${cursoId}`);
      const d = await r.json();
      if(d.conceptos) setConceptos(d.conceptos);
      if(d.participantes) setPartics(d.participantes);
    } catch{}
    finally{ setLoading(false); }
  },[cursoId]);

  useEffect(()=>{ cargar(); },[cargar]);

  // Stats
  const totalPagos  = partics.reduce((s,p)=>s+p.pagos.filter(x=>x.estado==="PAGADO").length,0);
  const totalMora   = partics.reduce((s,p)=>s+p.pagos.filter(x=>x.estado==="MORA").length,0);
  const totalPend   = partics.reduce((s,p)=>s+p.pagos.filter(x=>x.estado==="PENDIENTE").length,0);
  const totalRecaud = partics.reduce((s,p)=>s+p.pagos.filter(x=>x.estado==="PAGADO").reduce((a,x)=>a+Number(x.monto_pagado||0),0),0);

  // Filtros
  const partisFiltrados = partics.filter(p => {
    const nom = `${p.ap_paterno} ${p.ap_materno} ${p.nombre} ${p.ci}`.toLowerCase();
    if(busqueda && !nom.includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const conceptosFiltrados = conceptos.filter(c =>
    filtroTipo === "TODOS" || c.tipo === filtroTipo
  );

  const eliminarConcepto = async (id) => {
    if(!confirm("¿Eliminar este concepto y todos sus pagos asociados?")) return;
    try {
      const r = await fetch(`${API}/finanzas/conceptos/${id}`,{method:"DELETE"});
      const d = await r.json();
      if(!r.ok) throw new Error(d.message);
      showToast("🗑 Concepto eliminado");
      cargar();
    } catch(e){ showToast(`❌ ${e.message}`,"error"); }
  };

  const esAdminFinanzas = session?.rol === "ADMIN_FINANZAS";
  const [perfilOpen, setPerfilOpen] = useState(false);

  return (
    <div className="sjefe-page">
      {/* Solo el Jefe de Estudios ve el sidebar completo */}
      {!esAdminFinanzas && <SidebarJefe open={sidebarOpen} />}
      {!esAdminFinanzas && (
        <button className="sjefe-toggle" onClick={()=>setSidebarOpen(v=>!v)}>☰</button>
      )}
      <div className="sjefe-main">
      <div className="gfin-page" style={{minHeight:"unset",flex:1}}>
      {/* Header */}
      <header className="gfin-header">
        {session?.rol !== "ADMIN_FINANZAS" && (
          <button className="gfin-back" onClick={()=>navigate("/dashboard-jefe")}>← Dashboard</button>
        )}
        <div style={{flex:1}}>
          <h1>💰 Gestión de Finanzas</h1>
          <p>Control de matrícula, guía y mensualidades por participante.</p>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10,flexShrink:0,flexWrap:"wrap"}}>
          <div style={{
            display:"flex",alignItems:"center",gap:8,
            background:"rgba(255,255,255,.12)",
            border:"1.5px solid rgba(255,255,255,.25)",
            borderRadius:10,padding:"7px 12px"
          }}>
            <div style={{
              width:28,height:28,borderRadius:"50%",
              background:"#ff6600",color:"#fff",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontWeight:700,fontSize:12,flexShrink:0
            }}>
              {session?.ap_paterno?.[0] || "U"}
            </div>
            <div style={{lineHeight:1.3}}>
              <div style={{fontSize:12,fontWeight:700,color:"#fff"}}>
                {session?.ap_paterno} {session?.nombre}
              </div>
              <div style={{fontSize:10,color:"rgba(255,255,255,.6)"}}>
                💰 Admin Finanzas
              </div>
            </div>
          </div>
          <button
            onClick={() => setPerfilOpen(true)}
            style={{
              padding:"8px 14px",borderRadius:9,
              background:"rgba(255,255,255,.15)",
              border:"1.5px solid rgba(255,255,255,.25)",
              color:"#fff",fontSize:12,fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",transition:"all .2s",
              whiteSpace:"nowrap"
            }}
          >
            👤 Mi Perfil
          </button>
          <button
            onClick={()=>{ localStorage.removeItem("eaen_session"); navigate("/", { replace: true }); }}
            style={{
              padding:"8px 14px",borderRadius:9,
              background:"rgba(220,38,38,.25)",
              border:"1.5px solid rgba(220,38,38,.5)",
              color:"#fca5a5",fontSize:12,fontWeight:700,
              cursor:"pointer",fontFamily:"inherit",transition:"all .2s",
              whiteSpace:"nowrap"
            }}
          >
            🚪 Cerrar sesión
          </button>
        </div>
      </header>

      <main className="gfin-main">
        {/* Selector de curso */}
        <div className="gfin-curso-bar">
          <div className="gfin-form-group" style={{marginBottom:0,maxWidth:340}}>
            <label>Curso</label>
            <select value={cursoId||""} onChange={e=>setCursoId(Number(e.target.value))}>
              {cursos.map(c=><option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <button className="gfin-btn-primary" onClick={()=>setModalConc(true)}>
            ➕ Nuevo concepto de cobro
          </button>
        </div>

        {/* Stats */}
        <div className="gfin-stats">
          <div className="gfin-stat s-green">
            <div className="gfin-stat-icon">✅</div>
            <div><div className="gfin-stat-val">{totalPagos}</div><div className="gfin-stat-lbl">Pagos recibidos</div></div>
          </div>
          <div className="gfin-stat s-red">
            <div className="gfin-stat-icon">🔴</div>
            <div><div className="gfin-stat-val">{totalMora}</div><div className="gfin-stat-lbl">En mora</div></div>
          </div>
          <div className="gfin-stat s-orange">
            <div className="gfin-stat-icon">⏳</div>
            <div><div className="gfin-stat-val">{totalPend}</div><div className="gfin-stat-lbl">Pendientes</div></div>
          </div>
          <div className="gfin-stat s-blue">
            <div className="gfin-stat-icon">💵</div>
            <div>
              <div className="gfin-stat-val" style={{fontSize:18}}>Bs. {totalRecaud.toFixed(0)}</div>
              <div className="gfin-stat-lbl">Recaudado</div>
            </div>
          </div>
        </div>

        {/* Conceptos configurados */}
        {conceptos.length > 0 && (
          <div className="gfin-card" style={{marginBottom:20}}>
            <div className="gfin-card-header">
              <h2>Conceptos de cobro</h2>
              <div style={{display:"flex",gap:6}}>
                {["TODOS","MATRICULA","GUIA","MENSUALIDAD"].map(t=>(
                  <button key={t}
                    className={`gfin-filter-btn ${filtroTipo===t?"active":""}`}
                    onClick={()=>setFiltroTipo(t)}>
                    {t==="TODOS"?"Todos":TIPO_COLOR[t]?.icon+" "+t.charAt(0)+t.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="gfin-conceptos-list">
              {conceptosFiltrados.map(c=>{
                const col = TIPO_COLOR[c.tipo];
                const pagados = partics.filter(p=>p.pagos.find(x=>x.concepto_id===c.id&&x.estado==="PAGADO")).length;
                const mora    = partics.filter(p=>p.pagos.find(x=>x.concepto_id===c.id&&x.estado==="MORA")).length;
                return (
                  <div key={c.id} className="gfin-concepto-row"
                    style={{borderLeft:`4px solid ${col.border}`,background:col.bg}}>
                    <div style={{fontSize:20}}>{col.icon}</div>
                    <div style={{flex:1}}>
                      <div style={{fontSize:14,fontWeight:700,color:"#1a2535"}}>
                        {c.descripcion || `${c.tipo} ${c.mes?MESES_ES[c.mes]:""} ${c.anio||""}`}
                      </div>
                      <div style={{fontSize:12,color:"#5a6a80",marginTop:2}}>
                        Bs. {Number(c.monto).toFixed(2)}
                        {c.fecha_venc && ` · Vence: ${fmtFecha(c.fecha_venc)}`}
                      </div>
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <span style={{fontSize:12,color:"#2e7d32",fontWeight:700}}>{pagados} ✅</span>
                      {mora>0 && <span style={{fontSize:12,color:"#c62828",fontWeight:700}}>{mora} 🔴</span>}
                    </div>
                    <button onClick={()=>eliminarConcepto(c.id)} style={{
                      background:"#ffebee",color:"#c62828",border:"none",
                      borderRadius:7,padding:"4px 10px",cursor:"pointer",fontSize:12
                    }}>🗑</button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tabla de participantes */}
        <div className="gfin-card">
          <div className="gfin-card-header">
            <h2>Estado financiero por participante</h2>
            <input type="text" className="gfin-search"
              placeholder="🔍 Buscar participante..."
              value={busqueda} onChange={e=>setBusqueda(e.target.value)}/>
          </div>

          {loading ? <Spinner/> : !partics.length ? (
            <div className="gfin-empty">
              <div>💰</div>
              <p>No hay participantes o conceptos configurados para este curso.</p>
            </div>
          ) : (
            <div className="gfin-tabla-wrap">
              <table className="gfin-tabla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Participante</th>
                    <th>CI</th>
                    {conceptos.map(c=>(
                      <th key={c.id} style={{textAlign:"center",minWidth:100}}>
                        <div>{TIPO_COLOR[c.tipo]?.icon}</div>
                        <div style={{fontSize:10,fontWeight:400,color:"#aaa",marginTop:2}}>
                          {c.descripcion?.slice(0,14) || `${c.mes?MESES_ES[c.mes].slice(0,3):""}${c.anio?` ${c.anio}`:""}`}
                        </div>
                      </th>
                    ))}
                    <th style={{textAlign:"center"}}>Total debe</th>
                    <th style={{textAlign:"center"}}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {partisFiltrados.map((p,i)=>{
                    const tieneMora  = p.pagos.some(x=>x.estado==="MORA");
                    const totalDeuda = p.pagos
                      .filter(x=>["PENDIENTE","MORA"].includes(x.estado))
                      .reduce((s,x)=>s+Number(x.monto||0),0);
                    return (
                      <tr key={p.id} className={tieneMora?"tr-mora":""}>
                        <td className="gfin-muted">{i+1}</td>
                        <td className="gfin-bold">{p.ap_paterno} {p.ap_materno}, {p.nombre}</td>
                        <td className="gfin-muted">{p.ci}</td>
                        {p.pagos.map(pg=>{
                          const est = ESTADO_STYLE[pg.estado] || ESTADO_STYLE.PENDIENTE;
                          return (
                            <td key={pg.concepto_id} style={{textAlign:"center"}}>
                              <button
                                className="gfin-pago-btn"
                                style={{background:est.bg,color:est.color}}
                                onClick={()=>setModalPago({pago:pg,usuario:p})}
                                title={`${est.label} — Clic para editar`}
                              >
                                {est.label}
                              </button>
                            </td>
                          );
                        })}
                        <td style={{textAlign:"center",fontFamily:"'IBM Plex Mono',monospace",fontWeight:700,
                          color:totalDeuda>0?"#c62828":"#2e7d32"}}>
                          {totalDeuda>0 ? `Bs. ${totalDeuda.toFixed(0)}` : "—"}
                        </td>
                        <td style={{textAlign:"center"}}>
                          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5}}>
                            {tieneMora ? (
                              <span className="gfin-badge mora">🔴 Mora</span>
                            ) : p.pagos.every(x=>x.estado==="PAGADO"||x.estado==="EXONERADO") ? (
                              <span className="gfin-badge ok">✅ Al día</span>
                            ) : (
                              <span className="gfin-badge pend">⏳ Pendiente</span>
                            )}
                            <button
                              onClick={()=>setHistorialModal(p)}
                              style={{
                                padding:"3px 10px",borderRadius:6,
                                background:"#e3f2fd",color:"#1565c0",
                                border:"none",fontSize:11,fontWeight:700,
                                cursor:"pointer",whiteSpace:"nowrap"
                              }}
                            >📋 Historial</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {modalConc && (
        <ModalConcepto cursoId={cursoId} creado_por={session?.id}
          onClose={()=>setModalConc(false)}
          onCreado={d=>{ setModalConc(false); showToast(`✅ Concepto creado — ${d.pagos_generados} pagos generados`); cargar(); }}
        />
      )}
      {perfilOpen && <PerfilUsuario session={session} onClose={() => setPerfilOpen(false)} />}
      {historialModal && (
        <ModalHistorial
          usuario={historialModal}
          conceptos={conceptos}
          onClose={()=>setHistorialModal(null)}
          onEditar={(pg)=>{
            setHistorialModal(null);
            setModalPago({ pago: pg, usuario: historialModal });
          }}
        />
      )}
      {modalPago && (
        <ModalPago pago={modalPago.pago} usuario={modalPago.usuario}
          registrado_por={session?.id}
          onClose={()=>setModalPago(null)}
          onGuardado={()=>{ setModalPago(null); showToast("✅ Pago actualizado"); cargar(); }}
        />
      )}
      {toast && (
        <div className={`gfin-toast ${toast.type==="error"?"gfin-toast-error":""}`}>{toast.msg}</div>
      )}
      </div>
      </div>
    </div>
  );
}
