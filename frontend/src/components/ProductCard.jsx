import { Link } from "react-router-dom";
import { resolveBackendMedia } from "../utils/media";
import { adaptProduct } from "../utils/productAdapter";

function ProductCard({ product }) {
  const normalizedProduct = adaptProduct(product);
  const imageUrl = resolveBackendMedia(normalizedProduct.imagenUrl);
  const mediaStyle = imageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(241, 228, 206, 0.08), rgba(234, 219, 195, 0.08)), url("${imageUrl}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }
    : undefined;

  return (
    <article className="product-card">
      <div
        className={`product-media ${imageUrl ? "product-media-image" : `product-media-${product.accent}`}`}
        style={mediaStyle}
      >
        <span
          className={
            normalizedProduct.status === "Intercambio"
              ? "status-badge status-badge-alt"
              : "status-badge"
          }
        >
          {normalizedProduct.status}
        </span>
      </div>

        <div className="product-content">
          <div className="product-meta-row">
            <span>{normalizedProduct.category}</span>
            <span>{normalizedProduct.size}</span>
          </div>
          <h3>{normalizedProduct.name}</h3>
          <p>{normalizedProduct.brand}</p>
          <div className="product-price-row">
            <strong>{normalizedProduct.price}</strong>
            <span>{normalizedProduct.previousPrice || ""}</span>
          </div>
          <div className="product-card-actions">
            <span>{normalizedProduct.seller}</span>
            <Link to={`/prenda/${normalizedProduct.id}`}>Ver detalle</Link>
          </div>
        </div>
      </article>
    );
}

export default ProductCard;
