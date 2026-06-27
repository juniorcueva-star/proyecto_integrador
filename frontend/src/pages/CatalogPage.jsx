import { useEffect, useState } from "react";
import { fetchCatalog } from "../api/prendas";
import ProductCard from "../components/ProductCard";
import { featuredProducts } from "../data/mockData";
import { adaptProducts } from "../utils/productAdapter";

function CatalogPage() {
  const [products, setProducts] = useState(featuredProducts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const data = await fetchCatalog();
        if (!isMounted) return;
        setProducts(adaptProducts(data));
        setError("");
      } catch (loadError) {
        if (!isMounted) return;
        setError("No se pudo cargar el catalogo real. Se muestran datos de referencia.");
        setProducts(featuredProducts);
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
  }, []);

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

      <div className="catalog-toolbar">
        <div className="toolbar-pill">Todos</div>
        <div className="toolbar-pill">Chaquetas</div>
        <div className="toolbar-pill">Vestidos</div>
        <div className="toolbar-pill">Abrigos</div>
        <div className="toolbar-pill">Intercambio</div>
      </div>

      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <div className="sidebar-block">
            <h3>Buscar</h3>
            <input type="text" placeholder="Nombre, marca o descripcion" />
          </div>
          <div className="sidebar-block">
            <h3>Rango de precio</h3>
            <div className="price-range">
              <input type="text" placeholder="Min" />
              <input type="text" placeholder="Max" />
            </div>
          </div>
          <div className="sidebar-block">
            <h3>Estado</h3>
            <label><input type="checkbox" /> Disponible</label>
            <label><input type="checkbox" /> Intercambio</label>
            <label><input type="checkbox" /> Venta e intercambio</label>
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
        </div>
      </div>
    </section>
  );
}

export default CatalogPage;
