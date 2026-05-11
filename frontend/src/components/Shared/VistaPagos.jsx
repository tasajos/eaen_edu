import { useState, useEffect, useRef } from "react";
import "./VistaPagos.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:5000";

const TIPO_INFO = {
  MATRICULA:   { icon:"🎓", label:"Matrícula",   color:"#1565c0", bg:"#e3f2fd" },
  GUIA:        { icon:"📖", label:"Guía",         color:"#6a1b9a", bg:"#f3e5f5" },
  MENSUALIDAD: { icon:"📅", label:"Mensualidad",  color:"#2e7d32", bg:"#e8f5e9" },
  OTRO:        { icon:"💳", label:"Otro cobro",   color:"#e65100", bg:"#fff3e0" },
};
const ESTADO_INFO = {
  PAGADO:    { label:"✅ Pagado",    color:"#2e7d32", bg:"#e8f5e9" },
  PENDIENTE: { label:"⏳ Pendiente", color:"#f57f17", bg:"#fff8e1" },
  MORA:      { label:"🔴 Mora",      color:"#c62828", bg:"#ffebee" },
  EXONERADO: { label:"🔵 Exonerado", color:"#1565c0", bg:"#e3f2fd" },
};
const MESES = ["","Enero","Febrero","Marzo","Abril","Mayo","Junio",
               "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function fmtFecha(f) {
  if (!f || String(f).trim() === "") return "—";
  const d = f instanceof Date ? f : new Date(String(f).slice(0,10) + "T12:00:00");
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("es-BO", {day:"2-digit", month:"2-digit", year:"numeric"});
}

/* ── Generador de voucher (HTML → Print) ──────────────────── */
function generarVoucher(pago, session) {
  const tipo  = TIPO_INFO[pago.tipo]  || TIPO_INFO.OTRO;
  const concepto = pago.descripcion
    || `${tipo.label}${pago.mes ? " " + MESES[pago.mes] : ""}${pago.anio ? " " + pago.anio : ""}`;

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <title>Voucher de Pago — EAEN Avaroa</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f0f4f8; display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; padding: 32px 16px; }
    .voucher { background: #fff; border-radius: 16px; width: 480px; box-shadow: 0 8px 40px rgba(0,0,0,.15); overflow: hidden; }
    .vch-header { background: #003366; color: #fff; padding: 24px 28px; display: flex; align-items: center; gap: 16px; }
    .vch-logo { width: 52px; height: 52px; background: rgba(255,255,255,.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 26px; flex-shrink: 0; }
    .vch-inst { flex: 1; }
    .vch-inst h1 { font-size: 15px; font-weight: 800; letter-spacing: -.3px; }
    .vch-inst p  { font-size: 11px; opacity: .7; margin-top: 2px; }
    .vch-badge   { background: #ff6600; color: #fff; padding: 6px 14px; border-radius: 20px; font-size: 11px; font-weight: 700; white-space: nowrap; }
    .vch-body { padding: 24px 28px; }
    .vch-title { font-size: 20px; font-weight: 800; color: #003366; margin-bottom: 4px; }
    .vch-subtitle { font-size: 12px; color: #8898aa; margin-bottom: 20px; }
    .vch-monto { text-align: center; background: #f0f4ff; border-radius: 12px; padding: 18px; margin-bottom: 20px; border: 2px solid #c5cae9; }
    .vch-monto-label { font-size: 11px; color: #5a6a80; text-transform: uppercase; letter-spacing: .5px; }
    .vch-monto-val   { font-size: 36px; font-weight: 900; color: #003366; font-family: 'Courier New', monospace; margin-top: 4px; }
    .vch-section { margin-bottom: 18px; }
    .vch-section-title { font-size: 10.5px; font-weight: 700; color: #8898aa; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 10px; padding-bottom: 6px; border-bottom: 1.5px solid #f0f4f8; }
    .vch-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #f8fafc; font-size: 13px; }
    .vch-row:last-child { border-bottom: none; }
    .vch-row-key { color: #6b7a90; }
    .vch-row-val { font-weight: 600; color: #1a2535; text-align: right; }
    .vch-estado { display: inline-flex; align-items: center; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 700; background: #e8f5e9; color: #2e7d32; }
    .vch-footer { background: #f7f9fc; border-top: 2px solid #f0f4f8; padding: 16px 28px; text-align: center; }
    .vch-footer p { font-size: 11px; color: #8898aa; line-height: 1.5; }
    .vch-footer strong { color: #003366; }
    .vch-num { font-size: 11px; color: #bbb; margin-top: 8px; font-family: monospace; }
    @media print {
      body { background: white; padding: 0; }
      .voucher { box-shadow: none; border-radius: 0; width: 100%; }
    }
  </style>
</head>
<body>
  <div class="voucher">
    <div class="vch-header">
      <div class="vch-logo" style="background:white;padding:4px;"><img src="/eaen.png" style="width:44px;height:44px;object-fit:contain;" alt="EAEN"/></div>
      <div class="vch-inst">
        <h1>EAEN Avaroa</h1>
        <p>Escuela de Altos Estudios Nacionales</p>
      </div>
      <div class="vch-badge">VOUCHER</div>
    </div>

    <div class="vch-body">
      <div class="vch-title">${tipo.icon} Comprobante de Pago</div>
      <div class="vch-subtitle">Conserve este documento como respaldo de su pago</div>

      <div class="vch-monto">
        <div class="vch-monto-label">Monto pagado</div>
        <div class="vch-monto-val">Bs. ${Number(pago.monto_pagado || pago.monto).toFixed(2)}</div>
      </div>

      <div class="vch-section">
        <div class="vch-section-title">Detalle del concepto</div>
        <div class="vch-row"><span class="vch-row-key">Concepto</span><span class="vch-row-val">${concepto}</span></div>
        <div class="vch-row"><span class="vch-row-key">Tipo</span><span class="vch-row-val">${tipo.icon} ${tipo.label}</span></div>
        <div class="vch-row"><span class="vch-row-key">Monto original</span><span class="vch-row-val">Bs. ${Number(pago.monto).toFixed(2)}</span></div>
        ${pago.fecha_venc ? `<div class="vch-row"><span class="vch-row-key">Fecha vencimiento</span><span class="vch-row-val">${fmtFecha(pago.fecha_venc)}</span></div>` : ""}
        <div class="vch-row"><span class="vch-row-key">Estado</span><span class="vch-row-val"><span class="vch-estado">✅ Pagado</span></span></div>
      </div>

      <div class="vch-section">
        <div class="vch-section-title">Datos del pago</div>
        <div class="vch-row"><span class="vch-row-key">Fecha de pago</span><span class="vch-row-val">${fmtFecha(pago.fecha_pago)}</span></div>
        ${pago.comprobante ? `<div class="vch-row"><span class="vch-row-key">N° Comprobante</span><span class="vch-row-val">${pago.comprobante}</span></div>` : ""}
        ${pago.observacion ? `<div class="vch-row"><span class="vch-row-key">Observación</span><span class="vch-row-val">${pago.observacion}</span></div>` : ""}
      </div>

      <div class="vch-section">
        <div class="vch-section-title">Datos del cursante</div>
        <div class="vch-row"><span class="vch-row-key">Nombre</span><span class="vch-row-val">${session?.ap_paterno || ""} ${session?.ap_materno || ""}, ${session?.nombre || ""}</span></div>
        <div class="vch-row"><span class="vch-row-key">CI</span><span class="vch-row-val">${session?.ci || "—"}</span></div>
        <div class="vch-row"><span class="vch-row-key">Curso</span><span class="vch-row-val">${pago.curso_nombre || "—"}</span></div>
      </div>
    </div>

    <div class="vch-footer">
      <p><strong>EAEN Avaroa — Departamento de Finanzas</strong><br/>
      Este voucher es válido como comprobante oficial de pago.</p>
      <div class="vch-num">Generado: ${new Date().toLocaleString("es-BO")} · ID: ${pago.id || "—"}</div>
    </div>
  </div>
  <div style="text-align:center;padding:24px 28px 32px;background:#f7f9fc;border-top:2px solid #f0f4f8;">
    <button onclick="window.print()" style="
      padding:12px 32px;background:#003366;color:#fff;border:none;
      border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;
      font-family:inherit;letter-spacing:.3px;
      box-shadow:0 4px 14px rgba(0,51,102,.3);
    ">🖨️ Imprimir / Guardar PDF</button>
    <p style="margin-top:10px;font-size:11px;color:#aaa;">
      Para guardar como PDF selecciona "Guardar como PDF" en el diálogo de impresión
    </p>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank", "width=560,height=780");
  if (win) { win.document.write(html); win.document.close(); }
}

/* ── Modal Registrar Pago ─────────────────────────────────── */
function generarNroComprobante() {
  const now = new Date();
  const ymd = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}`;
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `PAG-${ymd}-${rand}`;
}

function ModalPagar({ pago, session, onClose, onSuccess }) {
  const tipo = TIPO_INFO[pago.tipo] || TIPO_INFO.OTRO;
  const concepto = pago.descripcion
    || `${tipo.label}${pago.mes ? " " + MESES[pago.mes] : ""}${pago.anio ? " " + pago.anio : ""}`;

  const [nroComprobante] = useState(generarNroComprobante);
  const [observacion, setObservacion] = useState("");
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState("");

  const registrar = async () => {
    setSaving(true); setError("");
    try {
      const fechaPago = new Date().toISOString().slice(0, 10);
      const r = await fetch(`${API}/finanzas/pagos/${pago.concepto_id}/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          estado:         "PAGADO",
          monto_pagado:   pago.monto,
          fecha_pago:     fechaPago,
          comprobante:    nroComprobante,
          observacion:    observacion.trim() || null,
          registrado_por: session.id,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Error al registrar");
      onSuccess({
        ...pago,
        estado: "PAGADO",
        monto_pagado: pago.monto,
        fecha_pago:   fechaPago,
        comprobante:  nroComprobante,
        observacion:  observacion.trim() || null,
      });
    } catch(e) { setError(e.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,0.55)",
      display:"flex", alignItems:"center", justifyContent:"center",
      zIndex:3000, backdropFilter:"blur(4px)", padding:16
    }}>
      <div style={{
        background:"#fff", borderRadius:18, padding:"28px 28px 24px",
        maxWidth:420, width:"100%", boxShadow:"0 20px 60px rgba(0,0,0,0.25)",
        display:"flex", flexDirection:"column", gap:16
      }}>
        {/* Header */}
        <div style={{display:"flex", alignItems:"center", gap:12}}>
          <div style={{
            width:44, height:44, borderRadius:12,
            background: tipo.bg, color: tipo.color,
            display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, flexShrink:0
          }}>{tipo.icon}</div>
          <div>
            <div style={{fontWeight:800, fontSize:16, color:"#1a2535"}}>Registrar pago</div>
            <div style={{fontSize:13, color:"#6b7a90", marginTop:2}}>{concepto}</div>
          </div>
        </div>

        {/* Monto */}
        <div style={{
          background:"#f0f4ff", borderRadius:12, padding:"14px 18px",
          border:"2px solid #c5cae9", textAlign:"center"
        }}>
          <div style={{fontSize:11, color:"#5a6a80", textTransform:"uppercase", letterSpacing:.5}}>Monto a pagar</div>
          <div style={{fontSize:32, fontWeight:900, color:"#003366", fontFamily:"'IBM Plex Mono',monospace", marginTop:4}}>
            Bs. {Number(pago.monto).toFixed(2)}
          </div>
        </div>

        {/* Comprobante auto-generado */}
        <div style={{
          background:"#f0faf0", border:"1.5px solid #a5d6a7",
          borderRadius:10, padding:"10px 16px",
          display:"flex", justifyContent:"space-between", alignItems:"center"
        }}>
          <span style={{fontSize:12, color:"#2e7d32", fontWeight:700}}>🧾 N° Comprobante</span>
          <span style={{fontFamily:"'IBM Plex Mono',monospace", fontWeight:800, color:"#003366", fontSize:14}}>
            {nroComprobante}
          </span>
        </div>

        {/* Observación opcional */}
        <div>
          <label style={{fontSize:12, fontWeight:700, color:"#5a6a80", display:"block", marginBottom:5}}>
            Observación <span style={{color:"#aaa", fontWeight:400}}>(opcional)</span>
          </label>
          <textarea
            rows={2}
            placeholder="Ej: Pago en efectivo en caja..."
            value={observacion}
            onChange={e => setObservacion(e.target.value)}
            style={{
              width:"100%", padding:"9px 13px", border:"2px solid #e8ecf2",
              borderRadius:9, fontSize:13, fontFamily:"inherit", resize:"vertical", outline:"none",
            }}
            onFocus={e => e.target.style.borderColor = "#003366"}
            onBlur={e => e.target.style.borderColor = "#e8ecf2"}
          />
        </div>

        {error && (
          <div style={{
            background:"#ffebee", border:"1.5px solid #ef9a9a",
            borderRadius:9, padding:"10px 14px", fontSize:13, color:"#c62828"
          }}>⚠️ {error}</div>
        )}

        {/* Botones */}
        <div style={{display:"flex", gap:10}}>
          <button onClick={registrar} disabled={saving} style={{
            flex:1, padding:"12px 0", background:"#003366", color:"#fff",
            border:"none", borderRadius:10, fontSize:14, fontWeight:700,
            cursor:saving?"not-allowed":"pointer", opacity:saving?.65:1, fontFamily:"inherit"
          }}>
            {saving ? "⏳ Registrando..." : "💳 Confirmar pago"}
          </button>
          <button onClick={onClose} style={{
            flex:1, padding:"12px 0", background:"transparent", color:"#5a6a80",
            border:"2px solid #e8ecf2", borderRadius:10, fontSize:13.5,
            fontWeight:600, cursor:"pointer", fontFamily:"inherit"
          }}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   COMPONENTE PRINCIPAL
══════════════════════════════════════════════════════════ */
export default function VistaPagos({ session }) {
  const [pagos,      setPagos]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filtro,     setFiltro]     = useState("TODOS");
  const [pagoModal,  setPagoModal]  = useState(null); // pago a registrar

  useEffect(() => {
    if (!session?.id) return;
    fetch(`${API}/finanzas/resumen/${session.id}`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setPagos(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.id]);

  const pagados   = pagos.filter(p => p.estado === "PAGADO");
  const pendientes= pagos.filter(p => p.estado === "PENDIENTE");
  const mora      = pagos.filter(p => p.estado === "MORA");
  const exonerados= pagos.filter(p => p.estado === "EXONERADO");

  const totalPagado  = pagados.reduce((s,p)=>s+Number(p.monto_pagado||p.monto||0),0);
  const totalPendiente=pagos.filter(p=>["PENDIENTE","MORA"].includes(p.estado))
                            .reduce((s,p)=>s+Number(p.monto||0),0);

  const pagosFiltrados = filtro === "TODOS" ? pagos
    : pagos.filter(p => p.estado === filtro);

  if (loading) return (
    <div className="vpag-loading"><div className="vpag-ring"/><p>Cargando estado de pagos...</p></div>
  );

  return (
    <div className="vpag-wrap">
      {/* Resumen */}
      <div className="vpag-stats">
        <div className="vpag-stat vpag-green">
          <div className="vpag-stat-icon">✅</div>
          <div>
            <div className="vpag-stat-val">{pagados.length}</div>
            <div className="vpag-stat-lbl">Pagos realizados</div>
            <div className="vpag-stat-monto">Bs. {totalPagado.toFixed(2)}</div>
          </div>
        </div>
        <div className="vpag-stat vpag-orange">
          <div className="vpag-stat-icon">⏳</div>
          <div>
            <div className="vpag-stat-val">{pendientes.length}</div>
            <div className="vpag-stat-lbl">Pendientes</div>
            <div className="vpag-stat-monto">Bs. {totalPendiente.toFixed(2)}</div>
          </div>
        </div>
        {mora.length > 0 && (
          <div className="vpag-stat vpag-red">
            <div className="vpag-stat-icon">🔴</div>
            <div>
              <div className="vpag-stat-val">{mora.length}</div>
              <div className="vpag-stat-lbl">En mora</div>
            </div>
          </div>
        )}
        {exonerados.length > 0 && (
          <div className="vpag-stat vpag-blue">
            <div className="vpag-stat-icon">🔵</div>
            <div>
              <div className="vpag-stat-val">{exonerados.length}</div>
              <div className="vpag-stat-lbl">Exonerados</div>
            </div>
          </div>
        )}
      </div>

      {/* Filtros */}
      <div className="vpag-filtros">
        {[
          ["TODOS",    `Todos (${pagos.length})`],
          ["PAGADO",   `✅ Pagados (${pagados.length})`],
          ["PENDIENTE",`⏳ Pendientes (${pendientes.length})`],
          ...(mora.length ? [["MORA", `🔴 Mora (${mora.length})`]] : []),
          ...(exonerados.length ? [["EXONERADO",`🔵 Exonerados (${exonerados.length})`]] : []),
        ].map(([val, lbl]) => (
          <button key={val}
            className={`vpag-filtro-btn ${filtro===val?"active":""}`}
            onClick={() => setFiltro(val)}>
            {lbl}
          </button>
        ))}
      </div>

      {/* Lista */}
      {!pagosFiltrados.length ? (
        <div className="vpag-empty">
          <div>💰</div>
          <p>No hay pagos en esta categoría.</p>
        </div>
      ) : (
        <div className="vpag-lista">
          {/* Header secciones */}
          {filtro === "TODOS" && pagados.length > 0 && (
            <div className="vpag-seccion-header vpag-sec-green">✅ Pagos realizados</div>
          )}
          {pagosFiltrados.map((pago, i) => {
            const tipo  = TIPO_INFO[pago.tipo]  || TIPO_INFO.OTRO;
            const estado= ESTADO_INFO[pago.estado] || ESTADO_INFO.PENDIENTE;
            const concepto = pago.descripcion
              || `${tipo.label}${pago.mes ? " " + MESES[pago.mes] : ""}${pago.anio ? " " + pago.anio : ""}`;

            // Separador entre pagados y pendientes en vista TODOS
            const prevPago = pagosFiltrados[i-1];
            const showPendHeader = filtro === "TODOS" && i > 0
              && pago.estado !== "PAGADO" && pago.estado !== "EXONERADO"
              && (prevPago?.estado === "PAGADO" || prevPago?.estado === "EXONERADO");

            return (
              <div key={i}>
                {showPendHeader && (
                  <div className="vpag-seccion-header vpag-sec-orange">📋 Próximos pagos</div>
                )}
                <div className={`vpag-pago-card ${pago.estado === "MORA" ? "mora" : pago.estado === "PAGADO" ? "pagado" : ""}`}>
                  {/* Lado izquierdo */}
                  <div className="vpag-tipo-badge" style={{background:tipo.bg, color:tipo.color}}>
                    <span style={{fontSize:22}}>{tipo.icon}</span>
                    <span style={{fontSize:11,fontWeight:700}}>{tipo.label}</span>
                  </div>

                  {/* Info */}
                  <div className="vpag-info">
                    <div className="vpag-concepto">{concepto}</div>
                    <div className="vpag-meta">
                      {pago.fecha_venc && (
                        <span className={`vpag-meta-item ${pago.estado==="MORA"?"vpag-meta-red":""}`}>
                          📆 Vence: {fmtFecha(pago.fecha_venc)}
                        </span>
                      )}
                      {pago.fecha_pago && pago.estado === "PAGADO" && (
                        <span className="vpag-meta-item">
                          ✅ Pagado: {fmtFecha(pago.fecha_pago)}
                        </span>
                      )}
                      {pago.comprobante && (
                        <span className="vpag-meta-item">
                          🧾 {pago.comprobante}
                        </span>
                      )}
                      {pago.curso_nombre && (
                        <span className="vpag-meta-item">📚 {pago.curso_nombre}</span>
                      )}
                    </div>
                  </div>

                  {/* Monto + estado */}
                  <div className="vpag-derecha">
                    <div className="vpag-monto">
                      Bs. {Number(pago.monto_pagado || pago.monto).toFixed(2)}
                    </div>
                    <div className="vpag-estado-badge"
                      style={{background:estado.bg, color:estado.color}}>
                      {estado.label}
                    </div>
                    {pago.estado === "PAGADO" && (
                      <button
                        className="vpag-voucher-btn"
                        onClick={() => generarVoucher(pago, session)}
                        title="Descargar voucher"
                      >
                        🖨️ Voucher
                      </button>
                    )}
                    {(pago.estado === "PENDIENTE" || pago.estado === "MORA") && (
                      <button
                        className="vpag-pagar-btn"
                        onClick={() => setPagoModal(pago)}
                      >
                        💳 Pagar
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {pagos.length === 0 && !loading && (
        <div className="vpag-empty">
          <div>💰</div>
          <p>No tienes conceptos de pago registrados aún.</p>
        </div>
      )}

      {/* Modal registrar pago */}
      {pagoModal && (
        <ModalPagar
          pago={pagoModal}
          session={session}
          onClose={() => setPagoModal(null)}
          onSuccess={(pagoActualizado) => {
            setPagos(prev => prev.map(p =>
              p.concepto_id === pagoActualizado.concepto_id ? { ...p, ...pagoActualizado } : p
            ));
            setPagoModal(null);
            generarVoucher(pagoActualizado, session);
          }}
        />
      )}
    </div>
  );
}
