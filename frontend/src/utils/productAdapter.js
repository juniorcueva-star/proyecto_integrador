export function formatPrice(value) {
  if (value === undefined || value === null || value === "") return "";

  const numericValue =
    typeof value === "number"
      ? value
      : Number(String(value).replace("S/", "").replace(",", ".").trim());

  if (Number.isNaN(numericValue)) return String(value);

  return `S/ ${numericValue.toLocaleString("es-PE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function adaptProduct(product) {
  if (!product) return product;

  return {
    ...product,
    name: product.name || product.nombre,
    category: product.category || product.categoria,
    brand: product.brand || product.marca,
    size: product.size || product.talla,
    seller: product.seller || product.nombreVendedor,
    price: product.price ? formatPrice(product.price) : formatPrice(product.precio),
    status:
      product.status ||
      (product.estadoPublicacion === "PUBLICADA"
        ? "Disponible"
        : product.estadoPublicacion || ""),
  };
}

export function adaptProducts(products = []) {
  return products.map(adaptProduct);
}
