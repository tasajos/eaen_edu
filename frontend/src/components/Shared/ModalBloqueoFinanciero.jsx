import { useEffect } from "react";

export default function ModalBloqueoFinanciero({ deudas = [], totalDeuda = 0 }) {
  // Prevenir scroll del body
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div style={{
      position:"fixed",inset:0,background:"rgba(0,0,0,.75)",
      display:"flex",alignItems:"center",justifyContent:"center",
      zIndex:9999,padding:20,backdropFilter:"blur(6px)"
    }}>
      <div style={{
        background:"#fff",borderRadius:20,padding:"36px 40px",
        maxWidth:480,width:"100%",textAlign:"center",
        boxShadow:"0 24px 80px rgba(0,0,0,.35)",
        animation:"bfin-in .4s cubic-bezier(.34,1.2,.64,1)"
      }}>
        <style>{`@keyframes bfin-in{from{opacity:0;transform:scale(.85)}to{opacity:1;transform:none}}`}</style>

        {/* Ícono */}
        <div style={{
          width:80,height:80,borderRadius:"50%",
          background:"linear-gradient(135deg,#b71c1c,#e53935)",
          margin:"0 auto 20px",display:"flex",alignItems:"center",
          justifyContent:"center",fontSize:36,
          boxShadow:"0 8px 24px rgba(183,28,28,.35)"
        }}>🔒</div>

        <h2 style={{fontSize:22,fontWeight:800,color:"#b71c1c",marginBottom:8}}>
          Acceso restringido
        </h2>
        <p style={{fontSize:14,color:"#5a6a80",lineHeight:1.6,marginBottom:20}}>
          Su cuenta tiene pagos pendientes que impiden el acceso al sistema.
          Por favor comuníquese con el <strong>Departamento de Finanzas</strong> para regularizar su situación.
        </p>

        {/* Deudas */}
        {deudas.length > 0 && (
          <div style={{
            background:"#fff8f8",border:"2px solid #ffcdd2",
            borderRadius:12,padding:"14px 16px",marginBottom:20,textAlign:"left"
          }}>
            <div style={{fontSize:11.5,fontWeight:700,color:"#c62828",
              textTransform:"uppercase",letterSpacing:".5px",marginBottom:10}}>
              Concepto(s) pendiente(s):
            </div>
            {deudas.map((d,i)=>{
              const TIPO_ICON = {
                MATRICULA:   "🎓",
                GUIA:        "📖",
                MENSUALIDAD: "📅",
              };
              const TIPO_LABEL = {
                MATRICULA:   "Matrícula",
                GUIA:        "Guía",
                MENSUALIDAD: "Mensualidad",
              };
              const MESES = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
              const icon  = TIPO_ICON[d.tipo]  || "💳";
              const label = TIPO_LABEL[d.tipo] || d.tipo || "Cobro";
              const detalle = d.descripcion || `${label}${d.mes ? " " + MESES[d.mes] : ""}${d.anio ? " " + d.anio : ""}`;
              return (
                <div key={i} style={{
                  display:"flex",justifyContent:"space-between",alignItems:"center",
                  padding:"6px 0",borderBottom:i<deudas.length-1?"1px solid #ffcdd2":"none",
                  fontSize:13
                }}>
                  <span style={{color:"#3e2723"}}>
                    {icon} {detalle}
                  </span>
                  <span style={{fontWeight:700,color:"#c62828",fontFamily:"monospace"}}>
                    Bs. {Number(d.monto).toFixed(2)}
                  </span>
                </div>
              );
            })}
            <div style={{
              display:"flex",justifyContent:"space-between",
              marginTop:10,paddingTop:8,borderTop:"2px solid #ef9a9a",
              fontSize:14,fontWeight:800
            }}>
              <span style={{color:"#1a2535"}}>Total adeudado:</span>
              <span style={{color:"#c62828",fontFamily:"monospace"}}>Bs. {Number(totalDeuda).toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Contacto */}
        <div style={{
          background:"#e8f5e9",border:"2px solid #a5d6a7",
          borderRadius:12,padding:"14px 16px",marginBottom:20
        }}>
          <div style={{fontSize:13,fontWeight:700,color:"#1b5e20",marginBottom:6}}>
            📞 Departamento de Finanzas — EAEN Avaroa
          </div>
          <div style={{fontSize:13,color:"#2e7d32",lineHeight:1.6}}>
            Diríjase a ventanilla de finanzas o comuníquese con el administrador del sistema para regularizar su pago y recuperar el acceso.
          </div>
        </div>

        <div style={{fontSize:12,color:"#9e9e9e",fontStyle:"italic"}}>
          Una vez regularizado el pago, su acceso será reactivado automáticamente.
        </div>
      </div>
    </div>
  );
}