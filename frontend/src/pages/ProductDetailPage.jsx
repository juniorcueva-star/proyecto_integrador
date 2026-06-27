import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchProductDetail } from "../api/prendas";
import { fetchPublicProfile } from "../api/usuarios";
import { paymentMethods, sellerReviews } from "../data/mockData";
import { resolveBackendMedia } from "../utils/media";

function ProductDetailPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
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
        setError("No se pudo cargar el detalle real. Se muestra una vista de referencia.");
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const detailImage = resolveBackendMedia(product?.imagenUrl);
  const sellerPaymentMethods = sellerProfile?.metodosPago?.length
    ? sellerProfile.metodosPago
    : paymentMethods;
  const sellerProfileReviews = sellerProfile?.resenasRecibidas?.length
    ? sellerProfile.resenasRecibidas
    : sellerReviews;

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
          <h1>{product?.nombre || "Trench de lana camel"}</h1>
          <p className="detail-lead">
            {error ||
              product?.descripcion ||
              "Pieza atemporal para climas templados, en excelente estado y lista para venta o intercambio."}
          </p>

          <div className="detail-meta-grid">
            <div><strong>Marca</strong><span>{product?.marca || "Max Mara"}</span></div>
            <div><strong>Talla</strong><span>{product?.talla || "M"}</span></div>
            <div><strong>Color</strong><span>{product?.color || "Camel"}</span></div>
            <div><strong>Estado</strong><span>{product?.estadoFisico || "Buen estado"}</span></div>
            <div><strong>Tipo</strong><span>{product?.tipoPublicacion || "Venta e intercambio"}</span></div>
            <div><strong>Precio</strong><span>{product ? `S/ ${product.precio}` : "S/ 140"}</span></div>
          </div>

          <div className="detail-actions">
            <Link to={`/vendedor/${product?.usuarioId || 1}`} className="button-primary">
              Ver vendedor
            </Link>
            <Link to="/user" className="button-secondary">
              Comprar o contactar
            </Link>
          </div>
        </div>
      </div>

      <section className="detail-extras">
        <article className="info-panel">
          <h2>Descripcion</h2>
          <p>
            {product?.descripcion ||
              "Trench estructurado con caida ligera, ideal para looks urbanos y de oficina. Conserva buena forma, tono uniforme y detalles bien cuidados en costuras, botones y cinturon."}
          </p>
        </article>

        <article className="info-panel">
          <h2>Metodos de pago del vendedor</h2>
          <div className="payment-list">
            {sellerPaymentMethods.map((method) => (
              <div key={method.id || method.type || method.tipoMetodoPago} className="payment-item">
                <strong>{method.type || method.tipoMetodoPago}</strong>
                <span>{method.detail || method.numero || method.titular || "Activo"}</span>
              </div>
            ))}
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
          {sellerProfileReviews.map((review) => (
            <article
              key={review.id || review.author || review.nombreAutor}
              className="review-card"
            >
              <strong>{review.author || review.nombreAutor}</strong>
              <span>{review.score || review.calificacion}</span>
              <p>{review.text || review.comentario}</p>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}

export default ProductDetailPage;
