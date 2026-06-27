import { useEffect, useState } from "react";
import { createPaymentMethod, fetchOwnPaymentMethods, togglePaymentMethod } from "../api/metodosPago";
import { createProduct, fetchCatalog, fetchOwnProducts } from "../api/prendas";
import { createClaim, fetchOwnClaims } from "../api/reclamos";
import { fetchOwnProfile } from "../api/usuarios";
import {
  aiActions,
  featuredProducts,
  garmentOptions,
  paymentMethods,
  userDashboardStats,
  userModules,
} from "../data/mockData";
import { adaptProduct, adaptProducts } from "../utils/productAdapter";

function UserDashboardPage() {
  const [profile, setProfile] = useState(null);
  const [ownProducts, setOwnProducts] = useState(featuredProducts);
  const [ownMethods, setOwnMethods] = useState(paymentMethods);
  const [ownClaims, setOwnClaims] = useState([]);
  const [catalogTargets, setCatalogTargets] = useState([]);
  const [productStatus, setProductStatus] = useState({ type: "", message: "" });
  const [paymentStatus, setPaymentStatus] = useState({ type: "", message: "" });
  const [claimStatus, setClaimStatus] = useState({ type: "", message: "" });
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
    imagenUrl: "",
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

  useEffect(() => {
    let isMounted = true;

    async function loadOwnProfile() {
      try {
        const data = await fetchOwnProfile();
        if (isMounted) {
          setProfile(data);
        }
      } catch {
        if (isMounted) {
          setProfile(null);
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
      } catch {
        if (!isMounted) return;
        setOwnMethods(paymentMethods);
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
    : userDashboardStats;

  async function handleCreateProduct(event) {
    event.preventDefault();
    setProductStatus({ type: "", message: "" });

    try {
      const created = await createProduct({
        ...productForm,
        precio: Number(productForm.precio || 0),
      });

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
        imagenUrl: "",
      });
      setProductStatus({ type: "success", message: "Prenda creada correctamente." });
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
    try {
      const updated = await togglePaymentMethod(id, !active);
      setOwnMethods((current) =>
        current.map((item) => (item.id === id ? updated : item)),
      );
    } catch (error) {
      setPaymentStatus({ type: "error", message: error.message });
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

  return (
    <section className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <p className="section-kicker">Panel usuario</p>
          <h1>Tu armario, tus publicaciones y tu IA</h1>
        </div>
      </div>

      <div className="dashboard-stats">
        {stats.map((item) => (
          <article key={item.label} className="stat-card">
            <strong>{item.value}</strong>
            <span>{item.label}</span>
          </article>
        ))}
      </div>

      <div className="dashboard-grid">
        {userModules.map((module) => (
          <article key={module.title} className="dashboard-card">
            <h2>{module.title}</h2>
            <p>{module.description}</p>
          </article>
        ))}
      </div>

      <div className="dashboard-split">
        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Mis prendas recientes</h2>
            <span>Acciones: editar, pausar, vender, intercambiar</span>
          </div>

          <div className="mini-list">
            {ownProducts.slice(0, 3).map((product) => (
              <article key={product.id} className="mini-item">
                <div>
                  <strong>{product.name || product.nombre}</strong>
                  <p>
                    {product.category} · {product.size} · {product.status}
                  </p>
                </div>
                <span>{product.price}</span>
              </article>
            ))}
          </div>
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Metodos de pago activos</h2>
            <span>Activar, desactivar o eliminar</span>
          </div>

          <div className="mini-list">
            {ownMethods.map((method) => (
              <article key={method.id || method.type} className="mini-item">
                <div>
                  <strong>{method.type || method.tipoMetodoPago}</strong>
                  <p>{method.detail || method.numero || method.titular || "Sin detalle"}</p>
                </div>
                <button
                  type="button"
                  className="mini-action"
                  onClick={() => handleToggleMethod(method.id, method.activo ?? true)}
                >
                  {method.activo ?? true ? "Desactivar" : "Activar"}
                </button>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="dashboard-panel dashboard-panel-feature">
        <div className="panel-head">
          <h2>Asistente Estilo IA</h2>
          <span>Herramientas disponibles para el usuario autenticado</span>
        </div>

        <div className="chip-grid">
          {aiActions.map((action) => (
            <div key={action} className="action-chip">
              {action}
            </div>
          ))}
        </div>
      </section>

      <section className="dashboard-panel">
        <div className="panel-head">
          <h2>Mis reclamos</h2>
          <span>Seguimiento de soporte y moderacion</span>
        </div>

        <div className="mini-list">
          {ownClaims.length === 0 ? (
            <article className="mini-item">
              <div>
                <strong>Aun no registraste reclamos</strong>
                <p>Cuando envíes uno, aparecerá aquí con su estado.</p>
              </div>
              <span>Sin casos</span>
            </article>
          ) : (
            ownClaims.map((claim) => (
              <article key={claim.id} className="mini-item">
                <div>
                  <strong>#{claim.id} · {claim.motivo}</strong>
                  <p>{claim.descripcion}</p>
                </div>
                <span>{claim.estado}</span>
              </article>
            ))
          )}
        </div>
      </section>

      <div className="dashboard-split">
        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Agregar prenda</h2>
            <span>Formulario conectado al backend</span>
          </div>

          <form className="module-form" onSubmit={handleCreateProduct}>
            <div className="module-form-grid">
              <label>
                Nombre
                <input
                  value={productForm.nombre}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, nombre: event.target.value }))
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
                  value={productForm.contacto}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, contacto: event.target.value }))
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
                  type="number"
                  step="0.01"
                  value={productForm.precio}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, precio: event.target.value }))
                  }
                />
              </label>
              <label className="full-span">
                URL imagen opcional
                <input
                  value={productForm.imagenUrl}
                  onChange={(event) =>
                    setProductForm((current) => ({ ...current, imagenUrl: event.target.value }))
                  }
                />
              </label>
            </div>

            {productStatus.message ? (
              <div className={`form-message form-message-${productStatus.type}`}>
                {productStatus.message}
              </div>
            ) : null}

            <button type="submit" className="button-primary module-submit">
              Publicar prenda
            </button>
          </form>
        </section>

        <section className="dashboard-panel">
          <div className="panel-head">
            <h2>Agregar metodo de pago</h2>
            <span>Yape, Plin, transferencia, efectivo u otro</span>
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

            {paymentStatus.message ? (
              <div className={`form-message form-message-${paymentStatus.type}`}>
                {paymentStatus.message}
              </div>
            ) : null}

            <button type="submit" className="button-primary module-submit">
              Guardar metodo
            </button>
          </form>
        </section>
      </div>

      <section className="dashboard-panel">
        <div className="panel-head">
          <h2>Enviar reclamo</h2>
          <span>Modulo conectado al endpoint real del backend</span>
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
                    #{item.id} · {item.nombre} · {item.nombreVendedor}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Usuario reportado
              <input value={claimForm.usuarioReportadoId} readOnly placeholder="Se completa automaticamente" />
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

          {claimStatus.message ? (
            <div className={`form-message form-message-${claimStatus.type}`}>
              {claimStatus.message}
            </div>
          ) : null}

          <button type="submit" className="button-primary module-submit">
            Enviar reclamo
          </button>
        </form>
      </section>
    </section>
  );
}

export default UserDashboardPage;
