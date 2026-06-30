import { useEffect, useState } from "react";
import { fetchCatalog } from "../api/prendas";
import ProductCard from "../components/ProductCard";
import { garmentOptions } from "../data/staticData";
import { adaptProducts } from "../utils/productAdapter";

function CatalogPage() {
  const [products, setProducts] = useState([]);
  const [filters, setFilters] = useState({
    texto: "",
    categoria: "",
    precioMinimo: "",
    precioMaximo: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const data = await fetchCatalog(filters);
        if (!isMounted) return;
        setProducts(adaptProducts(data));
        setError("");
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError.message || "No se pudo cargar el catalogo.");
        setProducts([]);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, [filters]);

  function handleFilterChange(field, value) {
    setLoading(true);
    setFilters((current) => ({ ...current, [field]: value }));
  }

  return (
    <section className="catalog-page">
      <div className="page-hero">
        <p className="section-kicker">Catalogo</p>
        <h1>Piezas con historia listas para una nueva vida</h1>
        <p>
          Explora prendas seleccionadas, filtra por categoria y descubre
          vendedores con buena reputacion dentro de la comunidad.
        </p>
      </div>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <div className="sidebar-block">
            <h3>Buscar</h3>
            <input
              type="text"
              placeholder="Nombre, marca o descripcion"
              value={filters.texto}
              onChange={(event) => handleFilterChange("texto", event.target.value)}
            />
          </div>
          <div className="sidebar-block">
            <h3>Categoria</h3>
            <select
              value={filters.categoria}
              onChange={(event) => handleFilterChange("categoria", event.target.value)}
            >
              <option value="">Todas</option>
              {garmentOptions.categorias.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="sidebar-block">
            <h3>Rango de precio</h3>
            <div className="price-range">
              <input
                type="number"
                placeholder="Min"
                value={filters.precioMinimo}
                onChange={(event) => handleFilterChange("precioMinimo", event.target.value)}
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.precioMaximo}
                onChange={(event) => handleFilterChange("precioMaximo", event.target.value)}
              />
            </div>
          </div>
        </aside>

        <div className="catalog-content">
          <div className="catalog-summary">
            <strong>{loading ? "Cargando..." : `${products.length} resultados`}</strong>
            <span>
              {error || "Prendas activas, filtrables y listas para detalle"}
            </span>
          </div>

          <div className="product-grid product-grid-3">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          {!loading && products.length === 0 ? (
            <div className="empty-state">
              <strong>No hay prendas para estos filtros.</strong>
              <p>Cuando el backend tenga publicaciones activas, apareceran aqui.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default CatalogPage;
