import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { fetchCatalog } from "../api/prendas";
import ProductCard from "../components/ProductCard";
import { garmentOptions } from "../data/staticData";
import { keepDecimal, keepLettersAndSpaces } from "../utils/inputSanitizers";
import { adaptProducts } from "../utils/productAdapter";

function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialGender = searchParams.get("genero") || "";
  const [products, setProducts] = useState([]);
  const [filterForm, setFilterForm] = useState({
    texto: "",
    categoria: "",
    genero: initialGender,
    precioMinimo: "",
    precioMaximo: "",
  });
  const [activeFilters, setActiveFilters] = useState(initialGender ? { genero: initialGender } : {});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const genero = searchParams.get("genero") || "";
    if (!["", "HOMBRE", "MUJER", "UNISEX"].includes(genero)) return;

    setFilterForm((current) => ({ ...current, genero }));
    setActiveFilters((current) => ({ ...current, genero }));
    setLoading(true);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;

    async function loadCatalog() {
      try {
        const data = await fetchCatalog(activeFilters);
        if (!isMounted) return;
        const adaptedProducts = adaptProducts(data);
        const visibleProducts = activeFilters.genero
          ? adaptedProducts.filter((product) => product.genero === activeFilters.genero)
          : adaptedProducts;

        setProducts(visibleProducts);
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
  }, [activeFilters]);

  function handleFilterChange(field, value) {
    const cleanValue =
      field === "texto"
        ? keepLettersAndSpaces(value)
        : field === "precioMinimo" || field === "precioMaximo"
          ? keepDecimal(value)
          : value;

    setFilterForm((current) => ({ ...current, [field]: cleanValue }));
  }

  function handleApplyFilters(event) {
    event.preventDefault();
    const min = filterForm.precioMinimo ? Number(filterForm.precioMinimo) : null;
    const max = filterForm.precioMaximo ? Number(filterForm.precioMaximo) : null;

    if ((min !== null && min < 1) || (max !== null && max < 1)) {
      setError("El precio mínimo y máximo deben ser al menos S/ 1.");
      return;
    }

    if (min !== null && max !== null && min > max) {
      setError("El precio mínimo no puede ser mayor que el precio máximo.");
      return;
    }

    setLoading(true);
    const nextFilters = {
      texto: filterForm.texto.trim(),
      categoria: filterForm.categoria,
      genero: filterForm.genero,
      precioMinimo: filterForm.precioMinimo,
      precioMaximo: filterForm.precioMaximo,
    };

    setActiveFilters(nextFilters);

    if (nextFilters.genero) {
      setSearchParams({ genero: nextFilters.genero });
    } else {
      setSearchParams({});
    }
  }

  function handleClearFilters() {
    setFilterForm({
      texto: "",
      categoria: "",
      genero: "",
      precioMinimo: "",
      precioMaximo: "",
    });
    setLoading(true);
    setError("");
    setActiveFilters({});
    setSearchParams({});
  }

  return (
    <section className="catalog-page">
      <div className="page-hero">
        <p className="section-kicker">Catálogo</p>
        <h1>Piezas con historia listas para una nueva vida</h1>
        <p>
          Explora prendas seleccionadas, filtra por categoría y descubre
          vendedores con buena reputacion dentro de la comunidad.
        </p>
      </div>

      <div className="catalog-layout">
        <form className="catalog-sidebar" onSubmit={handleApplyFilters}>
          <div className="sidebar-block">
            <h3>Buscar</h3>
            <input
              type="text"
              placeholder="Nombre, marca o descripcion"
              value={filterForm.texto}
              onChange={(event) => handleFilterChange("texto", event.target.value)}
            />
          </div>
          <div className="sidebar-block">
            <h3>Categoría</h3>
            <select
              value={filterForm.categoria}
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
            <h3>Género</h3>
            <select
              value={filterForm.genero}
              onChange={(event) => handleFilterChange("genero", event.target.value)}
            >
              <option value="">Todos</option>
              <option value="HOMBRE">Hombre</option>
              <option value="MUJER">Mujer</option>
              <option value="UNISEX">Unisex</option>
            </select>
          </div>
          <div className="sidebar-block">
            <h3>Rango de precio</h3>
            <div className="price-range">
              <input
                type="text"
                inputMode="decimal"
                placeholder="Min"
                value={filterForm.precioMinimo}
                onChange={(event) => handleFilterChange("precioMinimo", event.target.value)}
              />
              <input
                type="text"
                inputMode="decimal"
                placeholder="Max"
                value={filterForm.precioMaximo}
                onChange={(event) => handleFilterChange("precioMaximo", event.target.value)}
              />
            </div>
          </div>
          <div className="sidebar-actions">
            <button type="submit" className="button-primary">
              Buscar
            </button>
            <button type="button" className="button-secondary" onClick={handleClearFilters}>
              Limpiar
            </button>
          </div>
        </form>

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
              <p>Cuando el backend tenga publicaciones activas, aparecerán aquí.</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export default CatalogPage;
