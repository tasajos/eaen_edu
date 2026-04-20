import { useEffect, useMemo, useState } from "react";
import "./ListUsers.css";

const API_BASE = import.meta.env.VITE_API_URL;

const USER_TYPES = [
  "Cursante",
  "Administrador",
  "Tecnico",
  "Jefe de Carrera",
  "Jefe de Unidad o Director",
  "Personal de Apoyo",
  "Docente",
];

export default function ListUsers({ onBack }) {
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("ALL");

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errMsg, setErrMsg] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setErrMsg("");

      const resp = await fetch(`${API_BASE}/usuarios`);
      const data = await resp.json().catch(() => []);

      if (!resp.ok) {
        setErrMsg(data?.message || "No se pudo cargar el listado.");
        setUsers([]);
        return;
      }

      // data viene sin password (por backend)
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setErrMsg("Sin conexión con el servidor. Verifica que el backend esté corriendo.");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();

    return users.filter((u) => {
      const tipoUsuario = String(u.tipo_usuario ?? "").trim();
      const matchTipo = tipo === "ALL" ? true : tipoUsuario === tipo;
      if (!matchTipo) return false;

      if (!query) return true;

      const blob = [
        u.ci,
        u.nombre,
        u.apellido,
        u.ap_paterno,
        u.ap_materno,
        u.correo,
        u.email,
        u.grado,
        u.filial,
        u.fuerza,
        u.turno,
        u.telefono,
        u.ex,
        u.tipo_usuario,
        u.lugar_trabajo,
        u.rol,
        u.estado,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return blob.includes(query);
    });
  }, [q, tipo, users]);

  const clearFilters = () => {
    setQ("");
    setTipo("ALL");
  };

  return (
    <section className="eaen-list-wrap">
      <div className="eaen-list-head">
        <div>
          <h2 className="eaen-list-title">Listar Usuarios</h2>
          <p className="eaen-list-subtitle">
            Tabla institucional de usuarios.
          </p>
        </div>

        <div className="eaen-list-actions">
          <button className="eaen-secondary-btn" type="button" onClick={onBack}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="eaen-list-card">
        <div className="eaen-filters">
          <div className="eaen-filter-group">
            <label className="eaen-filter-label">Buscar</label>
            <input
              className="eaen-filter-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="CI, nombre, apellidos, correo, filial..."
            />
          </div>

          <div className="eaen-filter-group">
            <label className="eaen-filter-label">Tipo de Usuario</label>
            <select
              className="eaen-filter-select"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
            >
              <option value="ALL">Todos</option>
              {USER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="eaen-filter-buttons" style={{ gap: 10 }}>
            <button className="eaen-primary-btn" type="button" onClick={clearFilters}>
              Limpiar
            </button>

            <button className="eaen-secondary-btn" type="button" onClick={fetchUsers}>
              Recargar
            </button>
          </div>
        </div>

        {errMsg && (
          <div className="eaen-alert" style={{ marginBottom: 12 }}>
            {errMsg}
          </div>
        )}

        <div className="eaen-table-wrap" role="region" aria-label="Tabla de usuarios">
          <table className="eaen-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Rol</th>
                <th>Estado</th>

                <th>Grado/Profesión</th>
                <th>Ap. Paterno</th>
                <th>Ap. Materno</th>
                <th>Apellido</th>
                <th>Nombre</th>

                <th>CI</th>
                <th>EX</th>
                <th>Filial</th>
                <th>Fuerza</th>
                <th>Turno</th>

                <th>Teléfono</th>
                <th>F. Inscripción</th>
                <th>Lugar de Trabajo</th>

                <th>Correo</th>
                <th>Email</th>

                <th>F. Nacimiento</th>
                <th>Creado</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td className="eaen-empty" colSpan={20}>
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="eaen-empty" colSpan={20}>
                    No hay resultados para los filtros actuales.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id ?? u.ci}>
                    <td>
                      <span className={`eaen-badge eaen-badge-${badgeKey(u.tipo_usuario || "")}`}>
                        {u.tipo_usuario || "-"}
                      </span>
                    </td>

                    <td className="mono">{u.rol ?? "-"}</td>
                    <td className="mono">{u.estado ?? "-"}</td>

                    <td>{u.grado ?? "-"}</td>
                    <td>{u.ap_paterno ?? "-"}</td>
                    <td>{u.ap_materno ?? "-"}</td>
                    <td>{u.apellido ?? "-"}</td>
                    <td>{u.nombre ?? "-"}</td>

                    <td className="mono">{u.ci ?? "-"}</td>
                    <td className="mono">{u.ex ?? "-"}</td>
                    <td>{u.filial ?? "-"}</td>
                    <td>{u.fuerza ?? "-"}</td>
                    <td>{u.turno ?? "-"}</td>

                    <td className="mono">{u.telefono ?? "-"}</td>
                    <td className="mono">{fmtDate(u.fecha_inscripcion)}</td>
                    <td>{u.lugar_trabajo ?? "-"}</td>

                    <td>{u.correo ?? "-"}</td>
                    <td>{u.email ?? "-"}</td>

                    <td className="mono">{fmtDate(u.fecha_nacimiento)}</td>
                    <td className="mono">{fmtDateTime(u.creado_en)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="eaen-list-footer">
          <span>
            Mostrando <b>{filtered.length}</b> de <b>{users.length}</b> usuarios
          </span>

          <span className="eaen-small">
            * Listado conectado a Node + MySQL (sin password).
          </span>
        </div>
      </div>
    </section>
  );
}

function badgeKey(tipo) {
  return String(tipo || "")
    .toLowerCase()
    .replaceAll(" ", "-")
    .replaceAll("ó", "o")
    .replaceAll("é", "e")
    .replaceAll("í", "i")
    .replaceAll("á", "a")
    .replaceAll("ú", "u");
}

function fmtDate(v) {
  if (!v) return "-";
  // MySQL puede devolver Date o string
  const s = String(v);
  // si viene "YYYY-MM-DDT..." o "YYYY-MM-DD"
  return s.slice(0, 10);
}

function fmtDateTime(v) {
  if (!v) return "-";
  const s = String(v).replace("T", " ");
  return s.slice(0, 19);
}

