import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { recommendOutfit } from "../api/ia";
import {
  createPaymentMethod,
  deletePaymentMethod,
  fetchOwnPaymentMethods,
  togglePaymentMethod,
} from "../api/metodosPago";
import {
  createProduct,
  createProductWithImage,
  deleteProduct,
  fetchCatalog,
  fetchOwnProducts,
  updateProduct,
  updateProductImage,
  updateProductStatus,
} from "../api/prendas";
import { createClaim, fetchOwnClaims } from "../api/reclamos";
import { fetchOwnProfile } from "../api/usuarios";
import ProductCard from "../components/ProductCard";
import { garmentOptions } from "../data/staticData";
import { clearAuthSession } from "../utils/authStorage";
import { keepDecimal, keepDigits, keepLettersAndSpaces } from "../utils/inputSanitizers";
import { resolveBackendMedia } from "../utils/media";
import { adaptProduct, adaptProducts } from "../utils/productAdapter";

const sidebarItems = [
  { id: "inicio", label: "Inicio" },
  { id: "perfil", label: "Mi perfil" },
  { id: "armario", label: "Mi armario" },
  { id: "agregar", label: "Agregar prenda" },
  { id: "ia", label: "Recomendacion IA" },
];

const iaOptions = {
  estilos: ["CASUAL", "FORMAL", "URBANO", "DEPORTIVO", "ELEGANTE"],
  ocasiones: ["CLASES", "TRABAJO", "SALIDA", "EVENTO"],
  climas: ["CALOR", "FRIO", "TEMPLADO"],
  contexturas: [
    { value: "DELGADA", label: "Delgado/a" },
    { value: "NORMAL", label: "Normal" },
    { value: "CONTEXTURA_GRUESA", label: "Ancho/a" },
  ],
};

function UserDashboardPage() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("inicio");
  const [profile, setProfile] = useState(null);
  const [ownProducts, setOwnProducts] = useState([]);
  const [ownMethods, setOwnMethods] = useState([]);
  const [ownClaims, setOwnClaims] = useState([]);
  const [publicCatalog, setPublicCatalog] = useState([]);
  const [catalogTargets, setCatalogTargets] = useState([]);
  const [dashboardError, setDashboardError] = useState("");
  const [catalogFilters, setCatalogFilters] = useState({
    texto: "",
    categoria: "",
    precioMinimo: "",
    precioMaximo: "",
  });
  const [activeCatalogFilters, setActiveCatalogFilters] = useState({});
  const [productStatus, setProductStatus] = useState({ type: "", message: "" });
  const [paymentStatus, setPaymentStatus] = useState({ type: "", message: "" });
  const [claimStatus, setClaimStatus] = useState({ type: "", message: "" });
  const [aiStatus, setAiStatus] = useState({ type: "", message: "" });
  const [aiResult, setAiResult] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProductForm, setEditProductForm] = useState(null);
  const [productForm, setProductForm] = useState({
    nombre: "",
    descripcion: "",
    marca: "",
    color: "",
    talla: "M",
    categoria: "POLO",
    estadoFisico: "BUEN_ESTADO",
    precio: "",
    tipoPublicacion: "VENTA",
    contacto: "",
    imagen: null,
  });
  const [paymentForm, setPaymentForm] = useState({
    tipoMetodoPago: "YAPE",
    numero: "",
    titular: "",
    instrucciones: "",
  });
  const [claimForm, setClaimForm] = useState({
    usuarioReportadoId: "",
    prendaId: "",
    motivo: "NO_ENTREGA",
    descripcion: "",
  });
  const [outfitForm, setOutfitForm] = useState({
    estilo: "CASUAL",
    ocasion: "SALIDA",
    clima: "TEMPLADO",
    estaturaCm: "170",
    contextura: "NORMAL",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadOwnProfile() {
      try {
        const data = await fetchOwnProfile();
        if (isMounted) {
          setProfile(data);
        }
      } catch (error) {
        if (isMounted) {
          setProfile(null);
          setDashboardError(error.message);
        }
      }
    }

    loadOwnProfile();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadPublicCatalog() {
      try {
        const catalog = await fetchCatalog(activeCatalogFilters);
        if (!isMounted) return;

        setPublicCatalog(
          adaptProducts(catalog).sort((left, right) => {
            const leftDate = left.fechaPublicacion ? new Date(left.fechaPublicacion).getTime() : 0;
            const rightDate = right.fechaPublicacion ? new Date(right.fechaPublicacion).getTime() : 0;
            return rightDate - leftDate;
          }),
        );
      } catch (error) {
        if (!isMounted) return;
        setDashboardError(error.message);
        setPublicCatalog([]);
      }
    }

    loadPublicCatalog();
    return () => {
      isMounted = false;
    };
  }, [activeCatalogFilters]);

  useEffect(() => {
    let isMounted = true;

    async function hydrateUserModules() {
      try {
        const [products, methods, claims, catalog] = await Promise.all([
          fetchOwnProducts(),
          fetchOwnPaymentMethods(),
          fetchOwnClaims(),
          fetchCatalog(),
        ]);

        if (!isMounted) return;

        setOwnProducts(adaptProducts(products));
        setOwnMethods(methods);
        setOwnClaims(claims);
        setCatalogTargets(
          catalog
            .filter((item) => item.usuarioId !== profile?.usuario?.id)
            .map((item) => ({
              id: item.id,
              nombre: item.nombre,
              usuarioId: item.usuarioId,
              nombreVendedor: item.nombreVendedor,
            })),
        );
      } catch (error) {
        if (!isMounted) return;
        setDashboardError(error.message);
        setOwnProducts([]);
        setOwnMethods([]);
        setOwnClaims([]);
        setCatalogTargets([]);
      }
    }

    hydrateUserModules();
    return () => {
      isMounted = false;
    };
  }, [profile?.usuario?.id]);

  const stats = profile?.estadisticas
    ? [
        { label: "Prendas publicadas", value: String(profile.estadisticas.totalPrendas) },
        { label: "Publicadas activas", value: String(profile.estadisticas.prendasPublicadas) },
        { label: "Vendidas", value: String(profile.estadisticas.prendasVendidas) },
        { label: "Intercambiadas", value: String(profile.estadisticas.prendasIntercambiadas) },
      ]
    : [
        { label: "Prendas publicadas", value: String(ownProducts.length) },
        { label: "Metodos de pago", value: String(ownMethods.length) },
        { label: "Reclamos", value: String(ownClaims.length) },
        { label: "Catalogo visible", value: String(catalogTargets.length) },
      ];

  const displayName = profile?.usuario?.nombre || "Mi cuenta";
  const avatarLabel = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();

  function handleLogout() {
    clearAuthSession();
    navigate("/login", { replace: true });
  }

  function handleCatalogSearch(event) {
    event.preventDefault();
    const min = catalogFilters.precioMinimo ? Number(catalogFilters.precioMinimo) : null;
    const max = catalogFilters.precioMaximo ? Number(catalogFilters.precioMaximo) : null;

    if ((min !== null && min < 1) || (max !== null && max < 1)) {
      setDashboardError("El precio minimo y maximo deben ser al menos S/ 1.");
      return;
    }

    if (min !== null && max !== null && min > max) {
      setDashboardError("El precio minimo no puede ser mayor que el precio maximo.");
      return;
    }

    setDashboardError("");
    setActiveCatalogFilters({
      texto: catalogFilters.texto.trim(),
      categoria: catalogFilters.categoria,
      precioMinimo: catalogFilters.precioMinimo,
      precioMaximo: catalogFilters.precioMaximo,
    });
  }

  function handleClearCatalogSearch() {
    const emptyFilters = {
      texto: "",
      categoria: "",
      precioMinimo: "",
      precioMaximo: "",
    };
    setCatalogFilters(emptyFilters);
    setActiveCatalogFilters({});
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setProductStatus({ type: "", message: "" });

    try {
      const productPayload = {
        nombre: productForm.nombre,
        descripcion: productForm.descripcion,
        marca: productForm.marca,
        color: productForm.color,
        talla: productForm.talla,
        categoria: productForm.categoria,
        estadoFisico: productForm.estadoFisico,
        precio: Number(productForm.precio || 0),
        tipoPublicacion: productForm.tipoPublicacion,
        contacto: productForm.contacto,
      };
      const created = productForm.imagen
        ? await createProductWithImage(productPayload, productForm.imagen)
        : await createProduct(productPayload);

      setOwnProducts((current) => [adaptProduct(created), ...current]);
      setProductForm({
        nombre: "",
        descripcion: "",
        marca: "",
        color: "",
        talla: "M",
        categoria: "POLO",
        estadoFisico: "BUEN_ESTADO",
        precio: "",
        tipoPublicacion: "VENTA",
        contacto: "",
        imagen: null,
      });
      setProductStatus({ type: "success", message: "Prenda creada correctamente." });
      setActiveSection("armario");
    } catch (error) {
      setProductStatus({ type: "error", message: error.message });
    }
  }

  async function handleCreatePaymentMethod(event) {
    event.preventDefault();
    setPaymentStatus({ type: "", message: "" });

    try {
      const created = await createPaymentMethod(paymentForm);
      setOwnMethods((current) => [created, ...current]);
      setPaymentForm({
        tipoMetodoPago: "YAPE",
        numero: "",
        titular: "",
        instrucciones: "",
      });
      setPaymentStatus({ type: "success", message: "Metodo de pago agregado." });
    } catch (error) {
      setPaymentStatus({ type: "error", message: error.message });
    }
  }

  async function handleToggleMethod(id, active) {
    if (!id) return;
    try {
      const updated = await togglePaymentMethod(id, !active);
      setOwnMethods((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
    } catch (error) {
      setPaymentStatus({ type: "error", message: error.message });
    }
  }

  async function handleDeleteMethod(id) {
    if (!id) return;
    try {
      await deletePaymentMethod(id);
      setOwnMethods((current) => current.filter((item) => item.id !== id));
      setPaymentStatus({ type: "success", message: "Metodo eliminado correctamente." });
    } catch (error) {
      setPaymentStatus({ type: "error", message: error.message });
    }
  }

  async function handleProductAction(id, action, message) {
    try {
      const updated = await updateProductStatus(id, action);
      setOwnProducts((current) =>
        current.map((item) => (item.id === id ? adaptProduct(updated) : item)),
      );
      setProductStatus({ type: "success", message });
    } catch (error) {
      setProductStatus({ type: "error", message: error.message });
    }
  }

  async function handleDeleteProduct(id) {
    try {
      await deleteProduct(id);
      setOwnProducts((current) => current.filter((item) => item.id !== id));
      setProductStatus({ type: "success", message: "Prenda eliminada correctamente." });
    } catch (error) {
      setProductStatus({ type: "error", message: error.message });
    }
  }

  function handleStartEditProduct(product) {
    setEditingProductId(product.id);
    setEditProductForm({
      nombre: product.nombre || product.name || "",
      descripcion: product.descripcion || "",
      marca: product.marca || product.brand || "",
      color: product.color || "",
      talla: product.talla || product.size || "M",
      categoria: product.categoria || product.category || "POLO",
      estadoFisico: product.estadoFisico || "BUEN_ESTADO",
      precio: product.precio !== undefined && product.precio !== null ? String(product.precio) : "",
      tipoPublicacion: product.tipoPublicacion || "VENTA",
      contacto: product.contacto || "",
      imagen: null,
      imagenUrl: product.imagenUrl || "",
    });
    setProductStatus({ type: "", message: "" });
  }

  function handleCancelEditProduct() {
    setEditingProductId(null);
    setEditProductForm(null);
  }

  async function handleUpdateProduct(event) {
    event.preventDefault();
    if (!editingProductId || !editProductForm) return;

    setProductStatus({ type: "", message: "" });

    try {
      const payload = {
        nombre: editProductForm.nombre,
        descripcion: editProductForm.descripcion,
        marca: editProductForm.marca,
        color: editProductForm.color,
        talla: editProductForm.talla,
        categoria: editProductForm.categoria,
        estadoFisico: editProductForm.estadoFisico,
        precio: Number(editProductForm.precio || 0),
        tipoPublicacion: editProductForm.tipoPublicacion,
        contacto: editProductForm.contacto,
        imagenUrl: editProductForm.imagenUrl,
      };

      const updatedProduct = await updateProduct(editingProductId, payload);
      const finalProduct = editProductForm.imagen
        ? await updateProductImage(editingProductId, editProductForm.imagen)
        : updatedProduct;

      setOwnProducts((current) =>
        current.map((item) =>
          item.id === editingProductId ? adaptProduct(finalProduct) : item,
        ),
      );
      setProductStatus({ type: "success", message: "Prenda actualizada correctamente." });
      handleCancelEditProduct();
    } catch (error) {
      setProductStatus({ type: "error", message: error.message });
    }
  }

  async function handleCreateClaim(event) {
    event.preventDefault();
    setClaimStatus({ type: "", message: "" });

    try {
      const created = await createClaim({
        usuarioReportadoId: claimForm.usuarioReportadoId
          ? Number(claimForm.usuarioReportadoId)
          : null,
        prendaId: claimForm.prendaId ? Number(claimForm.prendaId) : null,
        motivo: claimForm.motivo,
        descripcion: claimForm.descripcion,
      });
      setOwnClaims((current) => [created, ...current]);
      setClaimForm({
        usuarioReportadoId: "",
        prendaId: "",
        motivo: "NO_ENTREGA",
        descripcion: "",
      });
      setClaimStatus({ type: "success", message: "Reclamo enviado correctamente." });
    } catch (error) {
      setClaimStatus({ type: "error", message: error.message });
    }
  }

  function handleSelectClaimProduct(selectedId) {
    const selected = catalogTargets.find((item) => String(item.id) === selectedId);
    setClaimForm((current) => ({
      ...current,
      prendaId: selectedId,
      usuarioReportadoId: selected ? String(selected.usuarioId) : "",
    }));
  }

  function validateIaProfile() {
    const estaturaCm = Number(outfitForm.estaturaCm);

    if (Number.isNaN(estaturaCm) || estaturaCm < 140 || estaturaCm > 205) {
      return "La estatura debe estar entre 140 y 205 cm.";
    }

    if (!["DELGADA", "NORMAL", "CONTEXTURA_GRUESA"].includes(outfitForm.contextura)) {
      return "Debes seleccionar una contextura valida.";
    }

    return "";
  }

  async function handleRecommendOutfit(event) {
    event.preventDefault();
    setAiStatus({ type: "", message: "" });

    const validationMessage = validateIaProfile();
    if (validationMessage) {
      setAiStatus({ type: "error", message: validationMessage });
      return;
    }

    try {
      const data = await recommendOutfit({
        ...outfitForm,
        estaturaCm: Number(outfitForm.estaturaCm),
      });
      setAiResult(data);
      setAiStatus({ type: "success", message: "Recomendacion generada." });
    } catch (error) {
      setAiStatus({ type: "error", message: error.message });
    }
  }

  function renderStatusMessage(status) {
    return status.message ? (
      <div className={`form-message form-message-${status.type}`}>
        {status.message}
      </div>
    ) : null;
  }

  const recommendedProducts = adaptProducts(aiResult?.referenciasCatalogo || []);
  const recommendationReasons = aiResult?.razones || [];
  const suggestedGarments = aiResult?.prendasSugeridas || [];

  return (
    <section className="user-dashboard-shell">
      <aside className="user-dashboard-sidebar">
        <div className="user-dashboard-brand">
          <h1>Estilo IA</h1>
          <p>Moda sostenible</p>
        </div>

        <nav className="user-dashboard-nav" aria-label="Secciones del dashboard">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={item.id === activeSection ? "user-nav-item user-nav-item-active" : "user-nav-item"}
              onClick={() => setActiveSection(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <button type="button" className="user-logout-button" onClick={handleLogout}>
          <span>Cerrar sesion</span>
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

      <div className="user-dashboard-main">
        <header className="user-dashboard-top">
          <div>
            <p className="section-kicker">Panel de usuario</p>
            <h2>{displayName}</h2>
            <span>Gestiona tu perfil, armario y recomendaciones IA desde un solo lugar.</span>
          </div>
          <div className="user-dashboard-avatar">{avatarLabel || "U"}</div>
        </header>

        {dashboardError ? (
          <div className="form-message form-message-error dashboard-message">
            {dashboardError}
          </div>
        ) : null}

        {activeSection === "inicio" ? (
          <div className="user-section-stack">
            <section className="dashboard-panel user-section-panel">
              <div className="panel-head">
                <h2>Prendas disponibles</h2>
                <span>Publicaciones activas de los usuarios</span>
              </div>

              <form className="catalog-filter-form" onSubmit={handleCatalogSearch}>
                <label>
                  Buscar
                  <input
                    type="text"
                    placeholder="Nombre, marca o descripcion"
                    value={catalogFilters.texto}
                    onChange={(event) =>
                      setCatalogFilters((current) => ({
                        ...current,
                        texto: keepLettersAndSpaces(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Categoria
                  <select
                    value={catalogFilters.categoria}
                    onChange={(event) =>
                      setCatalogFilters((current) => ({ ...current, categoria: event.target.value }))
                    }
                  >
                    <option value="">Todas</option>
                    {garmentOptions.categorias.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Precio minimo
                  <input
                    type="text"
                    inputMode="decimal"
                    value={catalogFilters.precioMinimo}
                    onChange={(event) =>
                      setCatalogFilters((current) => ({
                        ...current,
                        precioMinimo: keepDecimal(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Precio maximo
                  <input
                    type="text"
                    inputMode="decimal"
                    value={catalogFilters.precioMaximo}
                    onChange={(event) =>
                      setCatalogFilters((current) => ({
                        ...current,
                        precioMaximo: keepDecimal(event.target.value),
                      }))
                    }
                  />
                </label>
                <div className="catalog-filter-actions">
                  <button type="submit" className="button-primary">
                    Buscar
                  </button>
                  <button type="button" className="button-secondary" onClick={handleClearCatalogSearch}>
                    Limpiar
                  </button>
                </div>
              </form>

              {publicCatalog.length ? (
                <div className="product-grid user-dashboard-products">
                  {publicCatalog.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>No hay prendas publicadas por ahora.</strong>
                  <p>Cuando existan publicaciones activas o coincidencias con tu busqueda, apareceran aqui.</p>
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeSection === "perfil" ? (
          <div className="user-section-stack">
            <section className="dashboard-panel user-section-panel">
              <div className="panel-head">
                <h2>Mi perfil</h2>
                <span>Informacion, pagos y reclamos</span>
              </div>

              <div className="user-summary-grid">
                <article className="user-summary-card">
                  <strong>Nombre</strong>
                  <p>{profile?.usuario?.nombre || "No disponible"}</p>
                </article>
                <article className="user-summary-card">
                  <strong>Email</strong>
                  <p>{profile?.usuario?.email || "No disponible"}</p>
                </article>
                <article className="user-summary-card">
                  <strong>Telefono</strong>
                  <p>{profile?.usuario?.telefono || "No registrado"}</p>
                </article>
                <article className="user-summary-card">
                  <strong>Calificacion</strong>
                  <p>{profile?.promedioCalificacion ?? "Sin datos"}</p>
                </article>
              </div>
            </section>

            <section className="dashboard-panel user-section-panel">
              <div className="panel-head">
                <h2>Mis prendas publicadas</h2>
                <span>Publicaciones vinculadas a tu cuenta</span>
              </div>

              <div className="mini-list">
                {ownProducts.length === 0 ? (
                  <article className="mini-item">
                    <div>
                      <strong>Aun no tienes prendas</strong>
                      <p>Cuando publiques una prenda, aparecera tambien en esta seccion.</p>
                    </div>
                    <span>0</span>
                  </article>
                ) : (
                  ownProducts.map((product) => (
                    <article key={product.id} className="mini-item">
                      <div>
                        <strong>{product.name || product.nombre}</strong>
                        <p>
                          {product.category} - {product.size} - {product.status}
                        </p>
                      </div>
                      <span>{product.price}</span>
                    </article>
                  ))
                )}
              </div>
            </section>

            <div className="dashboard-split user-dashboard-split">
              <section className="dashboard-panel user-section-panel">
                <div className="panel-head">
                  <h2>Metodos de pago</h2>
                  <span>Activa o registra tus metodos</span>
                </div>

                <div className="mini-list">
                  {ownMethods.map((method) => (
                    <article key={method.id || method.tipoMetodoPago} className="mini-item mini-item-stack">
                      <div>
                        <strong>{method.tipoMetodoPago}</strong>
                        <p>{method.numero || method.titular || method.instrucciones || "Sin detalle"}</p>
                      </div>
                      <div className="mini-actions">
                        <button
                          type="button"
                          className="mini-action"
                          onClick={() => handleToggleMethod(method.id, method.activo ?? true)}
                        >
                          {method.activo ?? true ? "Desactivar" : "Activar"}
                        </button>
                        <button
                          type="button"
                          className="mini-action mini-action-danger"
                          onClick={() => handleDeleteMethod(method.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </article>
                  ))}
                  {ownMethods.length === 0 ? (
                    <article className="mini-item">
                      <div>
                        <strong>Sin metodos registrados</strong>
                        <p>Agrega Yape, Plin, transferencia u otro metodo.</p>
                      </div>
                      <span>0</span>
                    </article>
                  ) : null}
                </div>

                <form className="module-form" onSubmit={handleCreatePaymentMethod}>
                  <div className="module-form-grid">
                    <label>
                      Tipo
                      <select
                        value={paymentForm.tipoMetodoPago}
                        onChange={(event) =>
                          setPaymentForm((current) => ({
                            ...current,
                            tipoMetodoPago: event.target.value,
                          }))
                        }
                      >
                        {garmentOptions.tiposPago.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Numero o referencia
                      <input
                        value={paymentForm.numero}
                        onChange={(event) =>
                          setPaymentForm((current) => ({ ...current, numero: event.target.value }))
                        }
                      />
                    </label>
                    <label className="full-span">
                      Titular
                      <input
                        value={paymentForm.titular}
                        onChange={(event) =>
                          setPaymentForm((current) => ({ ...current, titular: event.target.value }))
                        }
                      />
                    </label>
                    <label className="full-span">
                      Instrucciones
                      <textarea
                        rows="3"
                        value={paymentForm.instrucciones}
                        onChange={(event) =>
                          setPaymentForm((current) => ({
                            ...current,
                            instrucciones: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  {renderStatusMessage(paymentStatus)}

                  <button type="submit" className="button-primary module-submit">
                    Guardar metodo
                  </button>
                </form>
              </section>

              <section className="dashboard-panel user-section-panel">
                <div className="panel-head">
                  <h2>Mis reclamos</h2>
                  <span>Seguimiento y nuevo reporte</span>
                </div>

                <div className="mini-list">
                  {ownClaims.length === 0 ? (
                    <article className="mini-item">
                      <div>
                        <strong>Aun no registraste reclamos</strong>
                        <p>Cuando envies uno, aparecera aqui con su estado.</p>
                      </div>
                      <span>Sin casos</span>
                    </article>
                  ) : (
                    ownClaims.map((claim) => (
                      <article key={claim.id} className="mini-item">
                        <div>
                          <strong>#{claim.id} - {claim.motivo}</strong>
                          <p>{claim.descripcion}</p>
                        </div>
                        <span>{claim.estado}</span>
                      </article>
                    ))
                  )}
                </div>

                <form className="module-form" onSubmit={handleCreateClaim}>
                  <div className="module-form-grid">
                    <label>
                      Prenda del catalogo
                      <select
                        value={claimForm.prendaId}
                        onChange={(event) => handleSelectClaimProduct(event.target.value)}
                      >
                        <option value="">Selecciona una prenda</option>
                        {catalogTargets.map((item) => (
                          <option key={item.id} value={item.id}>
                            #{item.id} - {item.nombre} - {item.nombreVendedor}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      Usuario reportado
                      <input
                        value={claimForm.usuarioReportadoId}
                        readOnly
                        placeholder="Se completa automaticamente"
                      />
                    </label>
                    <label className="full-span">
                      Motivo
                      <select
                        value={claimForm.motivo}
                        onChange={(event) =>
                          setClaimForm((current) => ({ ...current, motivo: event.target.value }))
                        }
                      >
                        {garmentOptions.motivosReclamo.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="full-span">
                      Descripcion
                      <textarea
                        rows="4"
                        value={claimForm.descripcion}
                        onChange={(event) =>
                          setClaimForm((current) => ({
                            ...current,
                            descripcion: event.target.value,
                          }))
                        }
                      />
                    </label>
                  </div>

                  {renderStatusMessage(claimStatus)}

                  <button type="submit" className="button-primary module-submit">
                    Enviar reclamo
                  </button>
                </form>
              </section>
            </div>
          </div>
        ) : null}

        {activeSection === "armario" ? (
          <section className="dashboard-panel user-section-panel">
            <div className="panel-head">
              <h2>Mi armario</h2>
              <span>Tus prendas y acciones disponibles</span>
            </div>

            {renderStatusMessage(productStatus)}

            <div className="wardrobe-grid">
              {ownProducts.length === 0 ? (
                <article className="mini-item wardrobe-empty-card">
                  <div>
                    <strong>Aun no tienes prendas</strong>
                    <p>Publica una prenda desde la seccion Agregar prenda.</p>
                  </div>
                  <span>0</span>
                </article>
              ) : (
                ownProducts.map((product) => (
                  <article key={product.id} className="wardrobe-card">
                    <div
                      className="wardrobe-card-media"
                      style={
                        resolveBackendMedia(product.imagenUrl)
                          ? {
                              backgroundImage: `linear-gradient(rgba(38, 50, 34, 0.08), rgba(38, 31, 24, 0.12)), url("${resolveBackendMedia(product.imagenUrl)}")`,
                            }
                          : undefined
                      }
                    >
                      {!resolveBackendMedia(product.imagenUrl) ? <span>Sin imagen</span> : null}
                      <strong>{product.status}</strong>
                    </div>

                    <div className="wardrobe-card-body">
                      <div className="wardrobe-card-head">
                        <div>
                          <span>{product.category}</span>
                          <h3>{product.name || product.nombre}</h3>
                        </div>
                        <strong>{product.price}</strong>
                      </div>
                      <p>{product.brand || "Sin marca"} - Talla {product.size}</p>
                      <p>{product.color || "Color no registrado"} - {product.estadoFisico}</p>

                      <div className="mini-actions wardrobe-actions">
                        <button
                          type="button"
                          className="mini-action"
                          onClick={() => handleStartEditProduct(product)}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          className="mini-action"
                          onClick={() => handleProductAction(product.id, "pausar", "Prenda pausada.")}
                        >
                          Pausar
                        </button>
                        <button
                          type="button"
                          className="mini-action"
                          onClick={() => handleProductAction(product.id, "publicar", "Prenda publicada.")}
                        >
                          Publicar
                        </button>
                        <button
                          type="button"
                          className="mini-action"
                          onClick={() => handleProductAction(product.id, "vendida", "Prenda marcada como vendida.")}
                        >
                          Vendida
                        </button>
                        <button
                          type="button"
                          className="mini-action"
                          onClick={() => handleProductAction(product.id, "intercambiada", "Prenda marcada como intercambiada.")}
                        >
                          Intercambiada
                        </button>
                        <button
                          type="button"
                          className="mini-action mini-action-danger"
                          onClick={() => handleDeleteProduct(product.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>

                    {editingProductId === product.id && editProductForm ? (
                      <form className="wardrobe-edit-form" onSubmit={handleUpdateProduct}>
                        <div className="module-form-grid">
                          <label>
                            Nombre
                            <input
                              value={editProductForm.nombre}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  nombre: keepLettersAndSpaces(event.target.value),
                                }))
                              }
                            />
                          </label>
                          <label>
                            Marca
                            <input
                              value={editProductForm.marca}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  marca: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="full-span">
                            Descripcion
                            <textarea
                              rows="3"
                              value={editProductForm.descripcion}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  descripcion: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label>
                            Color
                            <input
                              value={editProductForm.color}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  color: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label>
                            Contacto
                            <input
                              inputMode="numeric"
                              maxLength="9"
                              value={editProductForm.contacto}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  contacto: keepDigits(event.target.value, 9),
                                }))
                              }
                            />
                          </label>
                          <label>
                            Talla
                            <select
                              value={editProductForm.talla}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  talla: event.target.value,
                                }))
                              }
                            >
                              {garmentOptions.tallas.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Categoria
                            <select
                              value={editProductForm.categoria}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  categoria: event.target.value,
                                }))
                              }
                            >
                              {garmentOptions.categorias.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Estado fisico
                            <select
                              value={editProductForm.estadoFisico}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  estadoFisico: event.target.value,
                                }))
                              }
                            >
                              {garmentOptions.estadosFisicos.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Tipo publicacion
                            <select
                              value={editProductForm.tipoPublicacion}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  tipoPublicacion: event.target.value,
                                }))
                              }
                            >
                              {garmentOptions.tiposPublicacion.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Precio
                            <input
                              type="text"
                              inputMode="decimal"
                              value={editProductForm.precio}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  precio: keepDecimal(event.target.value),
                                }))
                              }
                            />
                          </label>
                          <label className="full-span">
                            Cambiar imagen
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  imagen: event.target.files?.[0] || null,
                                }))
                              }
                            />
                            <span className="file-helper">
                              {editProductForm.imagen
                                ? `Nueva imagen: ${editProductForm.imagen.name}`
                                : "Opcional. Si no seleccionas una nueva imagen, se mantiene la actual."}
                            </span>
                          </label>
                        </div>

                        <div className="button-row">
                          <button type="submit" className="button-primary module-submit">
                            Guardar cambios
                          </button>
                          <button
                            type="button"
                            className="button-secondary"
                            onClick={handleCancelEditProduct}
                          >
                            Cancelar
                          </button>
                        </div>
                      </form>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeSection === "agregar" ? (
          <section className="dashboard-panel user-section-panel">
            <div className="panel-head">
              <h2>Agregar prenda</h2>
              <span>Completa y publica de forma ordenada</span>
            </div>

            <form className="module-form" onSubmit={handleCreateProduct}>
              <div className="module-form-grid">
                <label>
                  Nombre
                  <input
                    value={productForm.nombre}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        nombre: keepLettersAndSpaces(event.target.value),
                      }))
                    }
                  />
                </label>
                <label>
                  Marca
                  <input
                    value={productForm.marca}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, marca: event.target.value }))
                    }
                  />
                </label>
                <label className="full-span">
                  Descripcion
                  <textarea
                    rows="4"
                    value={productForm.descripcion}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        descripcion: event.target.value,
                      }))
                    }
                  />
                </label>
                <label>
                  Color
                  <input
                    value={productForm.color}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, color: event.target.value }))
                    }
                  />
                </label>
                <label>
                  Contacto
                  <input
                    inputMode="numeric"
                    maxLength="9"
                    value={productForm.contacto}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        contacto: keepDigits(event.target.value, 9),
                      }))
                    }
                  />
                </label>
                <label>
                  Talla
                  <select
                    value={productForm.talla}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, talla: event.target.value }))
                    }
                  >
                    {garmentOptions.tallas.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Categoria
                  <select
                    value={productForm.categoria}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        categoria: event.target.value,
                      }))
                    }
                  >
                    {garmentOptions.categorias.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Estado fisico
                  <select
                    value={productForm.estadoFisico}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        estadoFisico: event.target.value,
                      }))
                    }
                  >
                    {garmentOptions.estadosFisicos.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tipo publicacion
                  <select
                    value={productForm.tipoPublicacion}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        tipoPublicacion: event.target.value,
                      }))
                    }
                  >
                    {garmentOptions.tiposPublicacion.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Precio
                  <input
                    type="text"
                    inputMode="decimal"
                    value={productForm.precio}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        precio: keepDecimal(event.target.value),
                      }))
                    }
                  />
                </label>
                <label className="full-span">
                  Imagen de la prenda
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        imagen: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  <span className="file-helper">
                    {productForm.imagen
                      ? `Imagen seleccionada: ${productForm.imagen.name}`
                      : "Selecciona una imagen desde tu computadora."}
                  </span>
                </label>
              </div>

              {renderStatusMessage(productStatus)}

              <button type="submit" className="button-primary module-submit">
                Publicar prenda
              </button>
            </form>
          </section>
        ) : null}

        {activeSection === "ia" ? (
          <section className="dashboard-panel user-section-panel user-section-panel-ia">
            <div className="panel-head">
              <h2>Recomendacion IA</h2>
              <span>Sugerencias basadas en estilo, ocasion y clima</span>
            </div>

            <div className="user-ia-intro">
              <article className="user-summary-card">
                <strong>Recomendacion de outfit</strong>
                <p>Completa tu perfil y recibe prendas recomendadas que encajen con tu necesidad.</p>
              </article>
            </div>

            <form className="module-form" onSubmit={handleRecommendOutfit}>
              <div className="module-form-grid">
                <label>
                  Estilo
                  <select
                    value={outfitForm.estilo}
                    onChange={(event) =>
                      setOutfitForm((current) => ({ ...current, estilo: event.target.value }))
                    }
                  >
                    {iaOptions.estilos.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Ocasion
                  <select
                    value={outfitForm.ocasion}
                    onChange={(event) =>
                      setOutfitForm((current) => ({ ...current, ocasion: event.target.value }))
                    }
                  >
                    {iaOptions.ocasiones.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Clima
                  <select
                    value={outfitForm.clima}
                    onChange={(event) =>
                      setOutfitForm((current) => ({ ...current, clima: event.target.value }))
                    }
                  >
                    {iaOptions.climas.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Estatura (cm)
                  <input
                    type="number"
                    min="140"
                    max="205"
                    step="1"
                    value={outfitForm.estaturaCm}
                    onChange={(event) =>
                      setOutfitForm((current) => ({
                        ...current,
                        estaturaCm: keepDigits(event.target.value, 3),
                      }))
                    }
                  />
                </label>
                <label>
                  Contextura
                  <select
                    value={outfitForm.contextura}
                    onChange={(event) =>
                      setOutfitForm((current) => ({ ...current, contextura: event.target.value }))
                    }
                  >
                    {iaOptions.contexturas.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="button-row">
                <button type="submit" className="button-primary module-submit">
                  Recomendar outfit
                </button>
              </div>
            </form>

            {renderStatusMessage(aiStatus)}

            {aiResult ? (
              <div className="result-box result-box-rich">
                <div className="result-section">
                  <strong>{aiResult.recomendacionGeneral || "Prendas recomendadas para tu perfil"}</strong>
                  {suggestedGarments.length ? (
                    <div className="result-chip-list">
                      {suggestedGarments.map((item) => (
                        <span key={item} className="result-chip">
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>

                {recommendationReasons.length ? (
                  <div className="result-section">
                    <h3>Por que te las recomendamos</h3>
                    <ul className="result-list">
                      {recommendationReasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {recommendedProducts.length ? (
                  <div className="result-section">
                    <h3>Prendas recomendadas</h3>
                    <div className="product-grid user-dashboard-products">
                      {recommendedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="empty-state">
                <strong>Sin resultado todavia</strong>
                <p>Cuando presiones recomendar outfit, veras aqui las prendas sugeridas para tu perfil.</p>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}

export default UserDashboardPage;
