import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  banAdminUser,
  deleteAdminUser,
  fetchAdminClaims,
  fetchAdminStats,
  fetchAdminUsers,
  reactivateAdminUser,
  updateAdminClaim,
} from "../api/admin";
import { clearAuthSession } from "../utils/authStorage";

const adminSections = [
  { id: "resumen", label: "Resumen" },
  { id: "usuarios", label: "Usuarios" },
  { id: "reclamos", label: "Reclamos" },
];

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("resumen");
  const [stats, setStats] = useState([]);
  const [claims, setClaims] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [data, claimsData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminClaims(),
        ]);

        if (!isMounted) return;

        setStats([
          { label: "Usuarios totales", value: String(data.usuariosTotales) },
          { label: "Usuarios activos", value: String(data.usuariosActivos) },
          { label: "Usuarios baneados", value: String(data.usuariosBaneados) },
          { label: "Prendas publicadas", value: String(data.prendasPublicadas) },
          { label: "Vendidas", value: String(data.prendasVendidas) },
          { label: "Intercambiadas", value: String(data.prendasIntercambiadas) },
          { label: "Reutilizadas", value: String(data.prendasReutilizadas) },
          { label: "CO2 estimado", value: `${data.impactoAmbientalEstimadoKgCo2 ?? 0} kg` },
        ]);
        setClaims(claimsData);
      } catch (error) {
        if (!isMounted) return;
        setStats([]);
        setClaims([]);
        setStatus({ type: "error", message: error.message });
      }
    }

    loadDashboard();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadUsers() {
      try {
        const data = await fetchAdminUsers(userSearch);
        if (isMounted) {
          setUsers(data);
        }
      } catch (error) {
        if (!isMounted) return;
        setUsers([]);
        setStatus({ type: "error", message: error.message });
      }
    }

    loadUsers();
    return () => {
      isMounted = false;
    };
  }, [userSearch]);

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  async function handleUserAction(id, action) {
    try {
      const updated =
        action === "banear"
          ? await banAdminUser(id)
          : action === "reactivar"
            ? await reactivateAdminUser(id)
            : await deleteAdminUser(id);

      setUsers((current) =>
        action === "eliminar"
          ? current.filter((user) => user.id !== id)
          : current.map((user) => (user.id === id ? updated : user)),
      );
      setStatus({ type: "success", message: "Usuario actualizado." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleClaimState(id, estado) {
    try {
      const updated = await updateAdminClaim(id, {
        estado,
        respuestaAdmin: `Estado actualizado a ${estado}`,
      });

      setClaims((current) => current.map((claim) => (claim.id === id ? updated : claim)));
      setStatus({ type: "success", message: "Reclamo actualizado." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  return (
    <section className="admin-dashboard-shell">
      <aside className="admin-dashboard-sidebar">
        <div className="user-dashboard-brand">
          <h1>Estilo IA</h1>
          <p>Administrador</p>
        </div>

        <nav className="user-dashboard-nav" aria-label="Secciones del dashboard admin">
          {adminSections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={
                section.id === activeSection ? "user-nav-item user-nav-item-active" : "user-nav-item"
              }
              onClick={() => setActiveSection(section.id)}
            >
              {section.label}
            </button>
          ))}
        </nav>

        <button type="button" className="user-logout-button" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </aside>

      <div className="admin-dashboard-main">
        <header className="admin-dashboard-top">
          <div>
            <p className="section-kicker">Panel administrador</p>
            <h1>Gestion y moderacion</h1>
            <span>Usuarios, reclamos y metricas reales del marketplace.</span>
          </div>
        </header>

        {status.message ? (
          <div className={`form-message form-message-${status.type} dashboard-message`}>
            {status.message}
          </div>
        ) : null}

        {activeSection === "resumen" ? (
          <section className="dashboard-panel admin-section-panel">
            <div className="panel-head">
              <h2>Resumen general</h2>
              <span>Indicadores del backend</span>
            </div>

            <div className="dashboard-stats admin-dashboard-stats">
              {stats.map((item) => (
                <article key={item.label} className="stat-card stat-card-admin">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === "usuarios" ? (
          <section className="dashboard-panel admin-section-panel">
            <div className="panel-head">
              <h2>Moderacion de usuarios</h2>
              <span>Buscar, banear, reactivar o eliminar</span>
            </div>

            <form className="module-form admin-search-form">
              <label>
                Buscar usuario
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Nombre, email o telefono"
                />
              </label>
            </form>

            <div className="mini-list">
              {users.map((user) => (
                <article key={user.id} className="mini-item mini-item-stack">
                  <div>
                    <strong>{user.nombre}</strong>
                    <p>
                      {user.email} - {user.estadoUsuario} - {user.rol}
                    </p>
                  </div>
                  <div className="mini-actions">
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => handleUserAction(user.id, "banear")}
                    >
                      Banear
                    </button>
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => handleUserAction(user.id, "reactivar")}
                    >
                      Reactivar
                    </button>
                    <button
                      type="button"
                      className="mini-action mini-action-danger"
                      onClick={() => handleUserAction(user.id, "eliminar")}
                    >
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
              {users.length === 0 ? (
                <article className="mini-item">
                  <div>
                    <strong>Sin usuarios para mostrar</strong>
                    <p>No hay coincidencias o no se pudo cargar la lista.</p>
                  </div>
                  <span>0</span>
                </article>
              ) : null}
            </div>
          </section>
        ) : null}

        {activeSection === "reclamos" ? (
          <section className="dashboard-panel admin-section-panel">
            <div className="panel-head">
              <h2>Reclamos</h2>
              <span>Actualizar estado del caso</span>
            </div>

            <div className="mini-list">
              {claims.map((claim) => (
                <article key={claim.id} className="mini-item mini-item-stack">
                  <div>
                    <strong>#{claim.id} - {claim.motivo}</strong>
                    <p>{claim.nombrePrenda || claim.descripcion}</p>
                    <p>Usuario: {claim.nombreUsuarioCreador}</p>
                  </div>
                  <div className="mini-actions">
                    <select
                      value={claim.estado}
                      onChange={(event) => handleClaimState(claim.id, event.target.value)}
                    >
                      <option value="PENDIENTE">PENDIENTE</option>
                      <option value="EN_REVISION">EN_REVISION</option>
                      <option value="RESUELTO">RESUELTO</option>
                      <option value="RECHAZADO">RECHAZADO</option>
                    </select>
                  </div>
                </article>
              ))}
              {claims.length === 0 ? (
                <article className="mini-item">
                  <div>
                    <strong>Sin reclamos</strong>
                    <p>No hay reclamos registrados o no se pudo cargar la lista.</p>
                  </div>
                  <span>0</span>
                </article>
              ) : null}
            </div>
          </section>
        ) : null}
      </div>
    </section>
  );
}

export default AdminDashboardPage;
