import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  banAdminUser,
  deleteAdminUser,
  fetchAdminPaymentProofs,
  fetchAdminSellerProfile,
  fetchAdminClaims,
  fetchAdminStats,
  fetchAdminUsers,
  reactivateAdminUser,
  updateAdminClaim,
} from "../api/admin";
import { logoutRequest } from "../api/auth";
import { clearAuthSession } from "../utils/authStorage";

const adminSections = [
  { id: "resumen", label: "Resumen" },
  { id: "usuarios", label: "Usuarios" },
  { id: "movimientos", label: "Compras y ventas" },
  { id: "reclamos", label: "Reclamos" },
];

const profileTabs = [
  { id: "resumen", label: "Resumen" },
  { id: "prendas", label: "Prendas publicadas" },
  { id: "ventas", label: "Ventas" },
  { id: "compras", label: "Compras" },
];

function formatAdminMoney(value) {
  return `S/ ${Number(value || 0).toFixed(2)}`;
}

function AdminDashboardPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("resumen");
  const [stats, setStats] = useState([]);
  const [statsTable, setStatsTable] = useState([]);
  const [claims, setClaims] = useState([]);
  const [paymentProofs, setPaymentProofs] = useState([]);
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [claimResponses, setClaimResponses] = useState({});
  const [selectedSellerProfile, setSelectedSellerProfile] = useState(null);
  const [selectedProfileTab, setSelectedProfileTab] = useState("resumen");
  const [status, setStatus] = useState({ type: "", message: "" });

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      try {
        const [data, claimsData, proofsData] = await Promise.all([
          fetchAdminStats(),
          fetchAdminClaims(),
          fetchAdminPaymentProofs(),
        ]);

        if (!isMounted) return;

        setStats([
          { label: "Usuarios totales", value: String(data.usuariosTotales) },
          { label: "Usuarios activos", value: String(data.usuariosActivos) },
          { label: "Cuentas pausadas", value: String(data.usuariosBaneados) },
          { label: "Prendas publicadas", value: String(data.prendasPublicadas) },
          { label: "Vendidas", value: String(data.prendasVendidas) },
          { label: "Compras comprobadas", value: String(data.comprasComprobadas ?? proofsData.length) },
          { label: "Reclamos pendientes", value: String(data.reclamosPendientes ?? 0) },
          { label: "CO2 estimado", value: `${data.impactoAmbientalEstimadoKgCo2 ?? 0} kg` },
        ]);
        setStatsTable([
          {
            concepto: "Prendas vendidas",
            cantidad: data.prendasVendidas,
            monto: data.montoVendidas,
            detalle: "Marcadas como vendidas por vendedores",
          },
          {
            concepto: "Compras comprobadas",
            cantidad: data.comprasComprobadas ?? proofsData.length,
            monto: data.montoComprobantes,
            detalle: "Comprobantes subidos por compradores",
          },
          {
            concepto: "Prendas intercambiadas",
            cantidad: data.prendasIntercambiadas,
            monto: data.montoIntercambiadas,
            detalle: "Marcadas como intercambio",
          },
          {
            concepto: "Ticket promedio",
            cantidad: data.comprasComprobadas ?? proofsData.length,
            monto: data.ticketPromedio,
            detalle: "Promedio de comprobantes recibidos",
          },
          {
            concepto: "Reclamos resueltos",
            cantidad: data.reclamosResueltos,
            monto: 0,
            detalle: "Casos cerrados por administracion",
          },
        ]);
        setClaims(claimsData);
        setPaymentProofs(proofsData);
      } catch (error) {
        if (!isMounted) return;
        setStats([]);
        setStatsTable([]);
        setClaims([]);
        setPaymentProofs([]);
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
    logoutRequest()
      .catch(() => null)
      .finally(() => {
        clearAuthSession();
        navigate("/login", { replace: true });
      });
  }

  async function handleUserAction(id, action) {
    if (action === "eliminar") {
      const confirmed = window.confirm(
        "¿Estás seguro de eliminar este usuario? Esta acción borrará también sus prendas y datos relacionados.",
      );

      if (!confirmed) {
        return;
      }
    }

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
      setStatus({
        type: "success",
        message:
          action === "eliminar"
            ? "Usuario eliminado junto con sus prendas y datos relacionados."
            : "Usuario actualizado.",
      });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleViewSellerProfile(id) {
    try {
      const data = await fetchAdminSellerProfile(id);
      setSelectedSellerProfile(data);
      setSelectedProfileTab("resumen");
      setStatus({ type: "", message: "" });
    } catch (error) {
      setSelectedSellerProfile(null);
      setStatus({ type: "error", message: error.message });
    }
  }

  async function handleClaimState(id, estado) {
    try {
      const updated = await updateAdminClaim(id, {
        estado,
        respuestaAdmin: claimResponses[id] || `Estado actualizado a ${estado}`,
      });

      setClaims((current) => current.map((claim) => (claim.id === id ? updated : claim)));
      setStatus({ type: "success", message: "Reclamo actualizado." });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
  }

  const selectedProducts = selectedSellerProfile?.prendas || [];
  const selectedPublishedProducts = selectedProducts.filter(
    (item) => item.estadoPublicacion === "PUBLICADA",
  );
  const selectedSoldProducts = selectedProducts.filter(
    (item) => item.estadoPublicacion === "VENDIDA",
  );
  const selectedOtherProducts = selectedProducts.filter(
    (item) => !["PUBLICADA", "VENDIDA"].includes(item.estadoPublicacion),
  );
  const selectedSales = selectedSellerProfile?.comprobantes || [];
  const selectedPurchases = selectedSellerProfile?.compras || [];

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
          <span>Cerrar sesión</span>
          <svg
            className="logout-icon"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path d="M10 4H5.75A1.75 1.75 0 0 0 4 5.75v12.5C4 19.22 4.78 20 5.75 20H10" />
            <path d="M15 8l4 4-4 4" />
            <path d="M8.5 12H19" />
          </svg>
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

            <div className="admin-metrics-table">
              <div className="admin-table-row admin-table-head">
                <span>Indicador</span>
                <span>Cantidad</span>
                <span>Monto real</span>
                <span>Detalle</span>
              </div>
              {statsTable.map((row) => (
                <div key={row.concepto} className="admin-table-row">
                  <strong>{row.concepto}</strong>
                  <span>{row.cantidad ?? 0}</span>
                  <span>{formatAdminMoney(row.monto)}</span>
                  <span>{row.detalle}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {activeSection === "usuarios" ? (
          <section className="dashboard-panel admin-section-panel">
            <div className="panel-head">
              <h2>Moderacion de usuarios</h2>
              <span>Buscar, pausar, reactivar, eliminar y revisar actividad</span>
            </div>

            <form className="module-form admin-search-form">
              <label>
                Buscar usuario
                <input
                  value={userSearch}
                  onChange={(event) => setUserSearch(event.target.value)}
                  placeholder="Nombre, email o teléfono"
                />
              </label>
            </form>

            <div className="mini-list">
              {users.map((user) => (
                <article key={user.id} className="mini-item mini-item-stack">
                  <div>
                    <strong>{user.nombre}</strong>
                    <p>
                      {user.email} - {user.estadoUsuario || "ACTIVO"}
                    </p>
                  </div>
                  <div className="mini-actions">
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => handleViewSellerProfile(user.id)}
                    >
                      Ver perfil
                    </button>
                    <button
                      type="button"
                      className="mini-action"
                      onClick={() => handleUserAction(user.id, "banear")}
                    >
                      Pausar cuenta
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

            {selectedSellerProfile ? (
              <section className="admin-seller-profile">
                <div className="panel-head">
                  <h2>Perfil del usuario</h2>
                  <span>{selectedSellerProfile.usuario.nombre}</span>
                </div>

                <nav className="admin-profile-tabs" aria-label="Detalle del usuario">
                  {profileTabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      className={
                        selectedProfileTab === tab.id
                          ? "admin-profile-tab admin-profile-tab-active"
                          : "admin-profile-tab"
                      }
                      onClick={() => setSelectedProfileTab(tab.id)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>

                <div className="admin-seller-grid">
                  <article className="user-summary-card">
                    <strong>Email</strong>
                    <p>{selectedSellerProfile.usuario.email || "No registrado"}</p>
                  </article>
                  <article className="user-summary-card">
                    <strong>Telefono</strong>
                    <p>{selectedSellerProfile.usuario.telefono || "No registrado"}</p>
                  </article>
                  <article className="user-summary-card">
                    <strong>Prendas</strong>
                    <p>{selectedProducts.length}</p>
                  </article>
                  <article className="user-summary-card">
                    <strong>Publicadas</strong>
                    <p>{selectedPublishedProducts.length}</p>
                  </article>
                  <article className="user-summary-card">
                    <strong>Vendidas</strong>
                    <p>{selectedSoldProducts.length}</p>
                  </article>
                  <article className="user-summary-card">
                    <strong>Ventas recibidas</strong>
                    <p>{selectedSales.length}</p>
                  </article>
                  <article className="user-summary-card">
                    <strong>Compras</strong>
                    <p>{selectedPurchases.length}</p>
                  </article>
                </div>

                {selectedProfileTab === "resumen" ? (
                  <div className="admin-profile-summary">
                    <article>
                      <strong>Estado de cuenta</strong>
                      <p>{selectedSellerProfile.usuario.estadoUsuario || "ACTIVO"}</p>
                    </article>
                    <article>
                      <strong>Rol</strong>
                      <p>{selectedSellerProfile.usuario.rol || "ROLE_USER"}</p>
                    </article>
                    <article>
                      <strong>Metodos de pago</strong>
                      <p>{selectedSellerProfile.metodosPago.length}</p>
                    </article>
                    <article>
                      <strong>Otras prendas</strong>
                      <p>{selectedOtherProducts.length}</p>
                    </article>
                  </div>
                ) : null}

                {selectedProfileTab === "prendas" ? (
                  <div className="admin-profile-list">
                    {selectedProducts.length ? (
                      selectedProducts.map((product) => (
                        <article key={product.id} className="admin-profile-row">
                          <div>
                            <strong>{product.nombre || "Prenda sin nombre"}</strong>
                            <p>
                              {product.categoria || "Categoria"} - {product.talla || "Sin talla"} - {product.estadoPublicacion || "Sin estado"}
                            </p>
                          </div>
                          <span>{formatAdminMoney(product.precio)}</span>
                        </article>
                      ))
                    ) : (
                      <article className="mini-item">
                        <div>
                          <strong>Sin prendas registradas</strong>
                          <p>Este usuario aun no publico prendas.</p>
                        </div>
                        <span>0</span>
                      </article>
                    )}
                  </div>
                ) : null}

                {selectedProfileTab === "ventas" ? (
                  <div className="admin-proof-list">
                    {selectedSales.length ? (
                      selectedSales.map((proof) => (
                        <article key={proof.id} className="admin-proof-card">
                          <div>
                            <strong>{proof.prendaNombre || "Prenda sin nombre"}</strong>
                            <p>Comprador: {proof.compradorNombre || proof.compradorEmail || "No registrado"}</p>
                            <p>Monto: {formatAdminMoney(proof.monto)} - {proof.estado}</p>
                            <p>{proof.creadoEn ? new Date(proof.creadoEn).toLocaleString("es-PE") : ""}</p>
                          </div>
                          {proof.comprobanteUrl ? (
                            <a href={proof.comprobanteUrl} target="_blank" rel="noreferrer">
                              <img src={proof.comprobanteUrl} alt="Comprobante de pago" />
                            </a>
                          ) : null}
                        </article>
                      ))
                    ) : (
                      <article className="mini-item">
                        <div>
                          <strong>Sin ventas recibidas</strong>
                          <p>Cuando reciba comprobantes por sus prendas, apareceran aqui.</p>
                        </div>
                        <span>0</span>
                      </article>
                    )}
                  </div>
                ) : null}

                {selectedProfileTab === "compras" ? (
                  <div className="admin-proof-list">
                    {selectedPurchases.length ? (
                      selectedPurchases.map((proof) => (
                        <article key={proof.id} className="admin-proof-card">
                          <div>
                            <strong>{proof.prendaNombre || "Prenda sin nombre"}</strong>
                            <p>Vendedor: {proof.vendedorNombre || proof.vendedorId || "No registrado"}</p>
                            <p>Monto: {formatAdminMoney(proof.monto)} - {proof.estado}</p>
                            <p>{proof.creadoEn ? new Date(proof.creadoEn).toLocaleString("es-PE") : ""}</p>
                          </div>
                          {proof.comprobanteUrl ? (
                            <a href={proof.comprobanteUrl} target="_blank" rel="noreferrer">
                              <img src={proof.comprobanteUrl} alt="Comprobante de compra" />
                            </a>
                          ) : null}
                        </article>
                      ))
                    ) : (
                      <article className="mini-item">
                        <div>
                          <strong>Sin compras registradas</strong>
                          <p>Este usuario aun no envio comprobantes como comprador.</p>
                        </div>
                        <span>0</span>
                      </article>
                    )}
                  </div>
                ) : null}
              </section>
            ) : null}
          </section>
        ) : null}

        {activeSection === "movimientos" ? (
          <section className="dashboard-panel admin-section-panel">
            <div className="panel-head">
              <h2>Compras y ventas</h2>
              <span>Todos los comprobantes subidos por compradores</span>
            </div>

            <div className="admin-proof-list">
              {paymentProofs.length ? (
                paymentProofs.map((proof) => (
                  <article key={proof.id} className="admin-proof-card">
                    <div>
                      <strong>{proof.prendaNombre || "Prenda sin nombre"}</strong>
                      <p>Comprador: {proof.compradorNombre || proof.compradorEmail || proof.compradorId}</p>
                      <p>Vendedor: {proof.vendedorNombre || proof.vendedorId}</p>
                      <p>Monto: S/ {Number(proof.monto || 0).toFixed(2)} - {proof.estado}</p>
                      <p>{proof.creadoEn ? new Date(proof.creadoEn).toLocaleString("es-PE") : ""}</p>
                    </div>
                    {proof.comprobanteUrl ? (
                      <a href={proof.comprobanteUrl} target="_blank" rel="noreferrer">
                        <img src={proof.comprobanteUrl} alt="Comprobante de compra" />
                      </a>
                    ) : null}
                  </article>
                ))
              ) : (
                <article className="mini-item">
                  <div>
                    <strong>Sin comprobantes registrados</strong>
                    <p>Cuando un comprador suba un comprobante, aparecera aqui.</p>
                  </div>
                  <span>0</span>
                </article>
              )}
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
                    {claim.comprobanteId ? <p>Comprobante: {claim.comprobanteId}</p> : null}
                  </div>
                  <div className="mini-actions">
                    <textarea
                      rows="2"
                      value={claimResponses[claim.id] ?? claim.respuestaAdmin ?? ""}
                      placeholder="Escribe la solucion o respuesta"
                      onChange={(event) =>
                        setClaimResponses((current) => ({
                          ...current,
                          [claim.id]: event.target.value,
                        }))
                      }
                    />
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
