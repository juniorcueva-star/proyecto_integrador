import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProductDetail } from "../api/prendas";
import { fetchPublicProfile } from "../api/usuarios";
import { resolveBackendMedia } from "../utils/media";
import { formatPrice } from "../utils/productAdapter";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadProduct() {
      try {
        const data = await fetchProductDetail(id);
        if (!isMounted) return;
        setProduct(data);

        if (data?.usuarioId) {
          const profile = await fetchPublicProfile(data.usuarioId);
          if (!isMounted) return;
          setSellerProfile(profile);
        }

        setError("");
      } catch (loadError) {
        if (!isMounted) return;
        setError(loadError.message || "No se pudo cargar el detalle de la prenda.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const detailImage = resolveBackendMedia(product?.imagenUrl);
  const sellerPaymentMethods = sellerProfile?.metodosPago || [];
  const sellerProfileReviews = sellerProfile?.resenasRecibidas || [];

  if (loading) {
    return (
      <section className="detail-page">
        <div className="empty-state">
          <strong>Cargando prenda...</strong>
        </div>
      </section>
    );
  }

  if (!product) {
    return (
      <section className="detail-page">
        <div className="empty-state">
          <strong>No se pudo cargar esta prenda.</strong>
          <p>{error}</p>
          <Link to="/catalogo" className="button-primary">
            Volver al catalogo
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="detail-page">
      <div className="detail-layout">
        <div
          className={`detail-media product-media ${detailImage ? "product-media-image" : "product-media-camel"}`}
          style={
            detailImage
              ? {
                  backgroundImage: `linear-gradient(rgba(241, 228, 206, 0.08), rgba(234, 219, 195, 0.08)), url("${detailImage}")`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }
              : undefined
          }
        ></div>

        <div className="detail-panel">
          <p className="section-kicker">Detalle de prenda</p>
          <h1>{product.nombre}</h1>
          <p className="detail-lead">
            {product.descripcion}
          </p>

          <div className="detail-meta-grid">
            <div><strong>Marca</strong><span>{product.marca}</span></div>
            <div><strong>Talla</strong><span>{product.talla}</span></div>
            <div><strong>Color</strong><span>{product.color}</span></div>
            <div><strong>Estado</strong><span>{product.estadoFisico}</span></div>
            <div><strong>Tipo</strong><span>{product.tipoPublicacion}</span></div>
            <div><strong>Precio</strong><span>{formatPrice(product.precio)}</span></div>
            <div><strong>Contacto</strong><span>{product?.contacto || "No registrado"}</span></div>
          </div>

          <div className="detail-actions">
            <Link to={`/vendedor/${product?.usuarioId}`} className="button-primary">
              Ver vendedor
            </Link>
          </div>
        </div>
      </div>

      <section className="detail-extras">
        <article className="info-panel">
          <h2>Descripcion</h2>
          <p>
            {product.descripcion}
          </p>
        </article>

        <article className="info-panel">
          <h2>Metodos de pago del vendedor</h2>
          <div className="payment-list">
            {sellerPaymentMethods.length ? (
              sellerPaymentMethods.map((method) => (
                <div key={method.id || method.tipoMetodoPago} className="payment-item">
                  <strong>{method.tipoMetodoPago}</strong>
                  <span>{method.numero || method.titular || method.instrucciones || "Activo"}</span>
                </div>
              ))
            ) : (
              <div className="payment-item">
                <strong>Sin metodos visibles</strong>
                <span>Contacta al vendedor</span>
              </div>
            )}
          </div>
        </article>
      </section>

      <section className="review-section">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Confianza</p>
            <h2>Resenas del vendedor</h2>
          </div>
        </div>

        <div className="review-grid">
          {sellerProfileReviews.length ? (
            sellerProfileReviews.map((review) => (
              <article
                key={review.id || review.nombreAutor}
                className="review-card"
              >
                <strong>{review.nombreAutor}</strong>
                <span>{review.calificacion}</span>
                <p>{review.comentario}</p>
              </article>
            ))
          ) : (
            <article className="review-card">
              <strong>Sin resenas todavia</strong>
              <p>Este vendedor aun no tiene resenas registradas.</p>
            </article>
          )}
        </div>
      </section>
    </section>
  );
}

export default ProductDetailPage;
