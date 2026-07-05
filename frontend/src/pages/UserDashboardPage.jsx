import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { logoutRequest } from "../api/auth";
import { analyzeGarmentPhoto, generateVirtualTryOn, recommendOutfit } from "../api/ia";
import { fetchOwnPurchaseProofs, fetchOwnSalesProofs } from "../api/comprobantesPago";
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
  fetchProductOptions,
  updateProduct,
  updateProductImage,
  updateProductStatus,
} from "../api/prendas";
import { createClaim, fetchOwnClaims } from "../api/reclamos";
import { fetchOwnProfile, updateOwnProfile } from "../api/usuarios";
import ProductCard from "../components/ProductCard";
import { garmentOptions } from "../data/staticData";
import { clearAuthSession, getAuthSession } from "../utils/authStorage";
import { keepDecimal, keepDigits, keepLettersAndSpaces } from "../utils/inputSanitizers";
import { resolveBackendMedia } from "../utils/media";
import { adaptProduct, adaptProducts } from "../utils/productAdapter";

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

const defaultBrandOptions = {
  marcasReconocidas: [
    "Nike",
    "Adidas",
    "Puma",
    "H&M",
    "Zara",
    "Reebok",
    "Levi's",
    "Under Armour",
    "Tommy Hilfiger",
  ],
  opcionOtraMarca: "OTRA",
};

function UserDashboardPage() {
  const navigate = useNavigate();
  const session = getAuthSession();
  const [activeSection, setActiveSection] = useState("inicio");
  const [profile, setProfile] = useState(null);
  const [ownProducts, setOwnProducts] = useState([]);
  const [ownMethods, setOwnMethods] = useState([]);
  const [ownClaims, setOwnClaims] = useState([]);
  const [ownPurchases, setOwnPurchases] = useState([]);
  const [ownSales, setOwnSales] = useState([]);
  const [publicCatalog, setPublicCatalog] = useState([]);
  const [catalogTargets, setCatalogTargets] = useState([]);
  const [dashboardError, setDashboardError] = useState("");
  const [catalogFilters, setCatalogFilters] = useState({
    texto: "",
    categoria: "",
    genero: "",
    precioMinimo: "",
    precioMaximo: "",
  });
  const [activeCatalogFilters, setActiveCatalogFilters] = useState({});
  const [productStatus, setProductStatus] = useState({ type: "", message: "" });
  const [profileStatus, setProfileStatus] = useState({ type: "", message: "" });
  const [paymentStatus, setPaymentStatus] = useState({ type: "", message: "" });
  const [claimStatus, setClaimStatus] = useState({ type: "", message: "" });
  const [aiStatus, setAiStatus] = useState({ type: "", message: "" });
  const [aiResult, setAiResult] = useState(null);
  const [tryOnFaceFile, setTryOnFaceFile] = useState(null);
  const [tryOnFacePreview, setTryOnFacePreview] = useState("");
  const [selectedTryOnProductIds, setSelectedTryOnProductIds] = useState([]);
  const [tryOnStatus, setTryOnStatus] = useState({ type: "", message: "" });
  const [tryOnResult, setTryOnResult] = useState(null);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editProductForm, setEditProductForm] = useState(null);
  const [productOptions, setProductOptions] = useState(defaultBrandOptions);
  const [wardrobeView, setWardrobeView] = useState("PUBLICADA");
  const [aiGarmentFile, setAiGarmentFile] = useState(null);
  const [aiGarmentPreview, setAiGarmentPreview] = useState("");
  const [aiGarmentStatus, setAiGarmentStatus] = useState({ type: "", message: "" });
  const [aiGarmentSuggestion, setAiGarmentSuggestion] = useState(null);
  const [productForm, setProductForm] = useState({
    nombre: "",
    descripcion: "",
    marca: defaultBrandOptions.marcasReconocidas[0],
    marcaPersonalizada: "",
    genero: "UNISEX",
    color: "",
    talla: "M",
    categoria: "POLO",
    estadoFisico: "BUEN_ESTADO",
    precio: "",
    tipoPublicacion: "VENTA",
    contacto: "",
    imagen: null,
    imagenSecundaria: null,
  });
  const [paymentForm, setPaymentForm] = useState({
    tipoMetodoPago: "YAPE",
    numero: "",
    titular: "",
    instrucciones: "",
    qrFile: null,
  });
  const [claimForm, setClaimForm] = useState({
    usuarioReportadoId: "",
    prendaId: "",
    motivo: "NO_ENTREGA",
    descripcion: "",
  });
  const [purchaseClaimForm, setPurchaseClaimForm] = useState({
    comprobanteId: "",
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
  const [profileForm, setProfileForm] = useState({
    telefono: session.telefono || "",
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
      const [
        productsResult,
        methodsResult,
        claimsResult,
        purchasesResult,
        salesResult,
        catalogResult,
        optionsResult,
      ] =
        await Promise.allSettled([
          fetchOwnProducts(),
          fetchOwnPaymentMethods(),
          fetchOwnClaims(),
          fetchOwnPurchaseProofs(),
          fetchOwnSalesProofs(),
          fetchCatalog(),
          fetchProductOptions(),
        ]);

      if (!isMounted) return;

      setOwnProducts(
        productsResult.status === "fulfilled" ? adaptProducts(productsResult.value) : [],
      );
      setOwnMethods(methodsResult.status === "fulfilled" ? methodsResult.value : []);
      setOwnClaims(claimsResult.status === "fulfilled" ? claimsResult.value : []);
      setOwnPurchases(purchasesResult.status === "fulfilled" ? purchasesResult.value : []);
      setOwnSales(salesResult.status === "fulfilled" ? salesResult.value : []);

      const options =
        optionsResult.status === "fulfilled" ? optionsResult.value : defaultBrandOptions;
      setProductOptions({
        marcasReconocidas: options?.marcasReconocidas?.length
          ? options.marcasReconocidas
          : defaultBrandOptions.marcasReconocidas,
        opcionOtraMarca: options?.opcionOtraMarca || defaultBrandOptions.opcionOtraMarca,
      });

      setCatalogTargets(
        catalogResult.status === "fulfilled"
          ? catalogResult.value
              .filter((item) => String(item.usuarioId) !== String(profile?.usuario?.id))
              .map((item) => ({
                id: item.id,
                nombre: item.nombre,
                usuarioId: item.usuarioId,
                nombreVendedor: item.nombreVendedor,
              }))
          : [],
      );

      if (productsResult.status === "rejected") {
        setDashboardError(
          productsResult.reason?.message || "No se pudieron cargar tus prendas.",
        );
        return;
      }

      setDashboardError("");
    }

    hydrateUserModules();
    return () => {
      isMounted = false;
    };
  }, [profile?.usuario?.id]);

  useEffect(() => {
    return () => {
      if (aiGarmentPreview) {
        URL.revokeObjectURL(aiGarmentPreview);
      }
    };
  }, [aiGarmentPreview]);

  useEffect(() => {
    return () => {
      if (tryOnFacePreview) {
        URL.revokeObjectURL(tryOnFacePreview);
      }
    };
  }, [tryOnFacePreview]);

  useEffect(() => {
    const telefono = profile?.usuario?.telefono || session.telefono || "";
    setProfileForm((current) =>
      current.telefono === telefono ? current : { ...current, telefono },
    );
  }, [profile?.usuario?.telefono, session.telefono]);

  const stats = profile?.estadisticas
    ? [
        { label: "Prendas publicadas", value: String(profile.estadisticas.totalPrendas) },
        { label: "Publicadas activas", value: String(profile.estadisticas.prendasPublicadas) },
        { label: "Vendidas", value: String(profile.estadisticas.prendasVendidas) },
        { label: "Intercambiadas", value: String(profile.estadisticas.prendasIntercambiadas) },
      ]
    : [
        { label: "Prendas publicadas", value: String(ownProducts.length) },
        { label: "Métodos de pago", value: String(ownMethods.length) },
        { label: "Reclamos", value: String(ownClaims.length) },
        { label: "Ventas recibidas", value: String(ownSales.length) },
        { label: "Compras", value: String(ownPurchases.length) },
      ];

  const fallbackProfile = {
    nombre: session.nombre || "Mi cuenta",
    email: session.email || "No disponible",
    telefono: session.telefono || "No registrado",
  };

  const displayName = profile?.usuario?.nombre || fallbackProfile.nombre;
  const accountPhone = profile?.usuario?.telefono || session.telefono || "";
  const avatarLabel = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0] || "")
    .join("")
    .toUpperCase();

  function handleLogout() {
    logoutRequest()
      .catch(() => null)
      .finally(() => {
        clearAuthSession();
        navigate("/login", { replace: true });
      });
  }

  async function handleUpdateProfile(event) {
    event.preventDefault();
    setProfileStatus({ type: "", message: "" });

    const telefono = profileForm.telefono.trim();
    if (!/^9\d{8}$/.test(telefono)) {
      setProfileStatus({
        type: "error",
        message: "Ingresa un celular valido de 9 digitos que empiece con 9.",
      });
      return;
    }

    try {
      const updatedProfile = await updateOwnProfile({ telefono });
      localStorage.setItem("telefono", telefono);
      setProfile(updatedProfile);
      setProfileStatus({ type: "success", message: "Celular actualizado correctamente." });
    } catch (error) {
      setProfileStatus({ type: "error", message: error.message });
    }
  }

  function handleCatalogSearch(event) {
    event.preventDefault();
    const min = catalogFilters.precioMinimo ? Number(catalogFilters.precioMinimo) : null;
    const max = catalogFilters.precioMaximo ? Number(catalogFilters.precioMaximo) : null;

    if ((min !== null && min < 1) || (max !== null && max < 1)) {
      setDashboardError("El precio mínimo y máximo deben ser al menos S/ 1.");
      return;
    }

    if (min !== null && max !== null && min > max) {
      setDashboardError("El precio mínimo no puede ser mayor que el precio máximo.");
      return;
    }

    setDashboardError("");
    setActiveCatalogFilters({
      texto: catalogFilters.texto.trim(),
      categoria: catalogFilters.categoria,
      genero: catalogFilters.genero,
      precioMinimo: catalogFilters.precioMinimo,
      precioMaximo: catalogFilters.precioMaximo,
    });
  }

  function handleClearCatalogSearch() {
    const emptyFilters = {
      texto: "",
      categoria: "",
      genero: "",
      precioMinimo: "",
      precioMaximo: "",
    };
    setCatalogFilters(emptyFilters);
    setActiveCatalogFilters({});
  }

  function handleGenderCatalog(genero) {
    setActiveSection("inicio");
    setDashboardError("");
    setCatalogFilters((current) => ({ ...current, genero }));
    setActiveCatalogFilters((current) => ({ ...current, genero }));
  }

  function isRecognizedBrand(brand) {
    return productOptions.marcasReconocidas.some(
      (option) => option.toLowerCase() === String(brand || "").trim().toLowerCase(),
    );
  }

  function resolveBrandPayload(form) {
    const selectedBrand = form.marca || productOptions.marcasReconocidas[0] || "";
    const customBrand = (form.marcaPersonalizada || "").trim();

    return {
      marca: selectedBrand,
      marcaPersonalizada: selectedBrand === productOptions.opcionOtraMarca ? customBrand : "",
    };
  }

  function normalizeOption(value, options, fallback) {
    const normalized = String(value || "").trim().toUpperCase();
    return options.find((option) => option.toUpperCase() === normalized) || fallback;
  }

  function applySuggestedBrand(brand) {
    const value = String(brand || "").trim();
    if (!value) return {};

    if (isRecognizedBrand(value)) {
      const recognized = productOptions.marcasReconocidas.find(
        (option) => option.toLowerCase() === value.toLowerCase(),
      );
      return { marca: recognized || value, marcaPersonalizada: "" };
    }

    return {
      marca: productOptions.opcionOtraMarca,
      marcaPersonalizada: value,
    };
  }

  function handleAiGarmentFileChange(file) {
    if (aiGarmentPreview) {
      URL.revokeObjectURL(aiGarmentPreview);
    }

    setAiGarmentFile(file || null);
    setAiGarmentSuggestion(null);
    setAiGarmentStatus({ type: "", message: "" });
    setAiGarmentPreview(file ? URL.createObjectURL(file) : "");
  }

  async function handleAnalyzeGarmentWithIa() {
    if (!aiGarmentFile) {
      setAiGarmentStatus({ type: "error", message: "Primero sube una foto de tu prenda." });
      return;
    }

    setAiGarmentStatus({ type: "", message: "" });

    try {
      const suggestion = await analyzeGarmentPhoto(aiGarmentFile);
      const brandPatch = applySuggestedBrand(suggestion.marca);

      setAiGarmentSuggestion(suggestion);
      setProductForm((current) => ({
        ...current,
        nombre: suggestion.nombre || current.nombre,
        descripcion: suggestion.descripcion || current.descripcion,
        ...brandPatch,
        color: suggestion.color || current.color,
        talla: normalizeOption(suggestion.talla, garmentOptions.tallas, current.talla),
        categoria: normalizeOption(suggestion.categoria, garmentOptions.categorias, current.categoria),
        estadoFisico: normalizeOption(
          suggestion.estadoFisico,
          garmentOptions.estadosFisicos,
          current.estadoFisico,
        ),
        precio:
          suggestion.precio !== undefined && suggestion.precio !== null
            ? String(suggestion.precio)
            : current.precio,
        tipoPublicacion: normalizeOption(
          suggestion.tipoPublicacion,
          garmentOptions.tiposPublicacion,
          current.tipoPublicacion,
        ),
      }));
      setAiGarmentStatus({
        type: "success",
        message: "La IA completo los campos posibles. Revisa y ajusta antes de publicar.",
      });
    } catch (error) {
      setAiGarmentStatus({ type: "error", message: error.message });
    }
  }

  async function handleCopyAiGarmentImage() {
    if (!aiGarmentFile) {
      setAiGarmentStatus({ type: "error", message: "Sube una foto para copiarla al formulario." });
      return;
    }

    setProductForm((current) => ({ ...current, imagen: aiGarmentFile }));

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            [aiGarmentFile.type || "image/png"]: aiGarmentFile,
          }),
        ]);
      }

      setAiGarmentStatus({
        type: "success",
        message: "Imagen copiada y colocada en Imagen de la prenda.",
      });
    } catch {
      setAiGarmentStatus({
        type: "success",
        message: "Imagen colocada en Imagen de la prenda. Tu navegador no permitió copiar al portapapeles.",
      });
    }
  }

  async function handleCreateProduct(event) {
    event.preventDefault();
    setProductStatus({ type: "", message: "" });

    try {
      const brandPayload = resolveBrandPayload(productForm);
      const productPayload = {
        nombre: productForm.nombre,
        descripcion: productForm.descripcion,
        marca: brandPayload.marca,
        marcaPersonalizada: brandPayload.marcaPersonalizada,
        genero: productForm.genero,
        color: productForm.color,
        talla: productForm.talla,
        categoria: productForm.categoria,
        estadoFisico: productForm.estadoFisico,
        precio: Number(productForm.precio || 0),
        tipoPublicacion: productForm.tipoPublicacion,
        contacto: accountPhone,
      };
      const created = productForm.imagen || productForm.imagenSecundaria
        ? await createProductWithImage(productPayload, productForm.imagen, productForm.imagenSecundaria)
        : await createProduct(productPayload);

      setOwnProducts((current) => [adaptProduct(created), ...current]);
      setProductForm({
        nombre: "",
        descripcion: "",
        marca: productOptions.marcasReconocidas[0] || defaultBrandOptions.marcasReconocidas[0],
        marcaPersonalizada: "",
        genero: "UNISEX",
        color: "",
        talla: "M",
        categoria: "POLO",
        estadoFisico: "BUEN_ESTADO",
        precio: "",
        tipoPublicacion: "VENTA",
        contacto: accountPhone,
        imagen: null,
        imagenSecundaria: null,
      });
      setProductStatus({ type: "success", message: "Prenda creada correctamente." });
      setWardrobeView("PUBLICADA");
      setActiveSection("armario");
    } catch (error) {
      setProductStatus({ type: "error", message: error.message });
    }
  }

  async function handleCreatePaymentMethod(event) {
    event.preventDefault();
    setPaymentStatus({ type: "", message: "" });

    try {
      const created = await createPaymentMethod(paymentForm, paymentForm.qrFile);
      setOwnMethods((current) => [created, ...current]);
      setPaymentForm({
        tipoMetodoPago: "YAPE",
        numero: "",
        titular: "",
        instrucciones: "",
        qrFile: null,
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
    const originalBrand = product.marca || product.brand || "";
    const recognizedBrand = isRecognizedBrand(originalBrand);

    setEditingProductId(product.id);
    setEditProductForm({
      nombre: product.nombre || product.name || "",
      descripcion: product.descripcion || "",
      marca: recognizedBrand ? originalBrand : productOptions.opcionOtraMarca,
      marcaPersonalizada: recognizedBrand ? "" : originalBrand,
      color: product.color || "",
      talla: product.talla || product.size || "M",
      categoria: product.categoria || product.category || "POLO",
      genero: product.genero || "UNISEX",
      estadoFisico: product.estadoFisico || "BUEN_ESTADO",
      precio: product.precio !== undefined && product.precio !== null ? String(product.precio) : "",
      tipoPublicacion: product.tipoPublicacion || "VENTA",
      contacto: accountPhone || product.contacto || "",
      imagen: null,
      imagenSecundaria: null,
      imagenUrl: product.imagenUrl || "",
      imagenSecundariaUrl: product.imagenSecundariaUrl || "",
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
      const brandPayload = resolveBrandPayload(editProductForm);
      const payload = {
        nombre: editProductForm.nombre,
        descripcion: editProductForm.descripcion,
        marca: brandPayload.marca,
        marcaPersonalizada: brandPayload.marcaPersonalizada,
        genero: editProductForm.genero,
        color: editProductForm.color,
        talla: editProductForm.talla,
        categoria: editProductForm.categoria,
        estadoFisico: editProductForm.estadoFisico,
        precio: Number(editProductForm.precio || 0),
        tipoPublicacion: editProductForm.tipoPublicacion,
        contacto: accountPhone || editProductForm.contacto,
        imagenUrl: editProductForm.imagenUrl,
        imagenSecundariaUrl: editProductForm.imagenSecundariaUrl,
      };

      const updatedProduct = await updateProduct(editingProductId, payload);
      const finalProduct = editProductForm.imagen || editProductForm.imagenSecundaria
        ? await updateProductImage(
            editingProductId,
            editProductForm.imagen,
            editProductForm.imagenSecundaria,
          )
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
          ? String(claimForm.usuarioReportadoId)
          : null,
        prendaId: claimForm.prendaId ? String(claimForm.prendaId) : null,
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

  async function handleCreatePurchaseClaim(event, purchase) {
    event.preventDefault();
    setClaimStatus({ type: "", message: "" });

    if (!purchase?.id) {
      setClaimStatus({ type: "error", message: "No se encontro la compra seleccionada." });
      return;
    }

    try {
      const created = await createClaim({
        usuarioReportadoId: String(purchase.vendedorId || ""),
        prendaId: String(purchase.prendaId || ""),
        prendaNombre: purchase.prendaNombre || "Prenda",
        nombreUsuarioReportado: purchase.vendedorNombre || "Vendedor",
        comprobanteId: String(purchase.id),
        motivo: purchaseClaimForm.motivo,
        descripcion: purchaseClaimForm.descripcion,
      });
      setOwnClaims((current) => [created, ...current]);
      setPurchaseClaimForm({
        comprobanteId: "",
        motivo: "NO_ENTREGA",
        descripcion: "",
      });
      setClaimStatus({ type: "success", message: "Reclamo enviado al administrador." });
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
      setSelectedTryOnProductIds([]);
      setTryOnResult(null);
      setTryOnStatus({ type: "", message: "" });
      setAiStatus({ type: "success", message: "Recomendación generada." });
    } catch (error) {
      setAiStatus({ type: "error", message: error.message });
    }
  }

  function handleTryOnFaceFileChange(file) {
    if (tryOnFacePreview) {
      URL.revokeObjectURL(tryOnFacePreview);
    }

    setTryOnFaceFile(file || null);
    setTryOnFacePreview(file ? URL.createObjectURL(file) : "");
    setTryOnResult(null);
    setTryOnStatus({ type: "", message: "" });
  }

  function handleToggleTryOnProduct(id) {
    setSelectedTryOnProductIds((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      if (current.length >= 2) {
        setTryOnStatus({ type: "error", message: "Solo puedes seleccionar 2 prendas para la prueba virtual." });
        return current;
      }

      setTryOnStatus({ type: "", message: "" });
      return [...current, id];
    });
  }

  async function handleGenerateVirtualTryOn() {
    if (!tryOnFaceFile) {
      setTryOnStatus({ type: "error", message: "Sube una foto frontal de tu rostro o medio cuerpo." });
      return;
    }

    if (selectedTryOnProductIds.length !== 2) {
      setTryOnStatus({ type: "error", message: "Selecciona exactamente 2 prendas recomendadas." });
      return;
    }

    const validationMessage = validateIaProfile();
    if (validationMessage) {
      setTryOnStatus({ type: "error", message: validationMessage });
      return;
    }

    try {
      const result = await generateVirtualTryOn({
        fotoRostro: tryOnFaceFile,
        estaturaCm: Number(outfitForm.estaturaCm),
        contextura: outfitForm.contextura,
        prendaIds: selectedTryOnProductIds,
      });
      setTryOnResult(result);
      setTryOnStatus({
        type: result.imagenUrl ? "success" : "error",
        message: result.imagenUrl
          ? "Prueba virtual generada."
          : "Flujo listo. Falta conectar la API de generación de imagen para devolver la foto final.",
      });
    } catch (error) {
      setTryOnStatus({ type: "error", message: error.message });
    }
  }

  function renderStatusMessage(status) {
    return status.message ? (
      <div className={`form-message form-message-${status.type}`}>
        {status.message}
      </div>
    ) : null;
  }

  const visibleCatalog = activeCatalogFilters.genero
    ? publicCatalog.filter((product) => product.genero === activeCatalogFilters.genero)
    : publicCatalog;
  const publishedProducts = ownProducts.filter((product) => product.estadoPublicacion === "PUBLICADA");
  const soldProducts = ownProducts.filter((product) => product.estadoPublicacion === "VENDIDA");
  const otherProducts = ownProducts.filter(
    (product) => !["PUBLICADA", "VENDIDA"].includes(product.estadoPublicacion),
  );
  const displayedWardrobeProducts =
    wardrobeView === "VENDIDA"
      ? soldProducts
      : wardrobeView === "OTRAS"
        ? otherProducts
        : publishedProducts;
  const personalSections = [
    { id: "perfil", label: "Mi perfil" },
    { id: "pagos", label: "Metodos de pago" },
    { id: "agregar", label: "Publicar prenda" },
    { id: "armario", label: "Mi armario" },
    { id: "ventas", label: "Ventas" },
    { id: "compras", label: "Historial de compras" },
  ];
  const inPersonalPanel = personalSections.some((section) => section.id === activeSection);
  const recommendedProducts = adaptProducts(aiResult?.referenciasCatalogo || []);
  const recommendationReasons = aiResult?.razones || [];
  const suggestedGarments = aiResult?.prendasSugeridas || [];

  return (
    <section className="user-dashboard-shell user-shop-shell">
      {!inPersonalPanel ? (
        <header className="user-shop-header">
          <button type="button" className="user-shop-brand" onClick={() => handleGenderCatalog("")}>
            Estilo IA
          </button>

          <nav className="user-shop-nav" aria-label="Catálogo principal">
            <button type="button" onClick={() => handleGenderCatalog("HOMBRE")}>
              Hombre
            </button>
            <button type="button" onClick={() => handleGenderCatalog("MUJER")}>
              Mujer
            </button>
            <button type="button" onClick={() => handleGenderCatalog("UNISEX")}>
              Unisex
            </button>
            <button type="button" onClick={() => setActiveSection("ia")}>
              Recomendación IA
            </button>
          </nav>

          <div className="user-shop-actions">
            <button type="button" className="publish-entry-button" onClick={() => setActiveSection("perfil")}>
              <span>{avatarLabel || "U"}</span>
              Publique aquí
            </button>
            <button type="button" className="shop-logout-button" onClick={handleLogout}>
              Salir
            </button>
          </div>
        </header>
      ) : null}

      <div className="user-dashboard-main user-shop-main">
        {inPersonalPanel ? (
          <>
            <div className="user-panel-back-row">
              <button type="button" className="button-secondary user-panel-back-button" onClick={() => setActiveSection("inicio")}>
                Volver
              </button>
            </div>

            <header className="user-dashboard-top user-personal-top">
              <div>
                <p className="section-kicker">Panel personal</p>
                <h2>Hola, {displayName}</h2>
                <span>Administra tu información, publica prendas y revisa tu armario.</span>
              </div>
              <div className="user-dashboard-avatar">{avatarLabel || "U"}</div>
            </header>
          </>
        ) : null}

        {inPersonalPanel ? (
          <nav className="personal-tabs" aria-label="Panel personal">
            {personalSections.map((section) => (
              <button
                key={section.id}
                type="button"
                className={activeSection === section.id ? "personal-tab personal-tab-active" : "personal-tab"}
                onClick={() => setActiveSection(section.id)}
              >
                {section.label}
              </button>
            ))}
          </nav>
        ) : null}

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
                    placeholder="Nombre, marca o descripción"
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
                  Categoría
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
                  Precio mínimo
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
                  Precio máximo
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

              {visibleCatalog.length ? (
                <div className="product-grid user-dashboard-products">
                  {visibleCatalog.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <strong>No hay prendas publicadas por ahora.</strong>
                  <p>Cuando existan publicaciones activas o coincidencias con tu búsqueda, aparecerán aquí.</p>
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
                <span>Datos personales de tu cuenta</span>
              </div>

              <div className="user-summary-grid">
                <article className="user-summary-card">
                  <strong>Nombre</strong>
                  <p>{profile?.usuario?.nombre || fallbackProfile.nombre}</p>
                </article>
                <article className="user-summary-card">
                  <strong>Email</strong>
                  <p>{profile?.usuario?.email || fallbackProfile.email}</p>
                </article>
                <article className="user-summary-card">
                  <strong>Teléfono</strong>
                  <p>{profile?.usuario?.telefono || fallbackProfile.telefono}</p>
                </article>
                <article className="user-summary-card">
                  <strong>Calificación</strong>
                  <p>{profile?.promedioCalificacion ?? "Sin datos"}</p>
                </article>
              </div>

              <form className="module-form profile-phone-form" onSubmit={handleUpdateProfile}>
                <label>
                  Celular de contacto
                  <input
                    value={profileForm.telefono}
                    inputMode="numeric"
                    maxLength={9}
                    placeholder="Ejemplo: 987654321"
                    onChange={(event) =>
                      setProfileForm((current) => ({
                        ...current,
                        telefono: keepDigits(event.target.value, 9),
                      }))
                    }
                  />
                </label>
                <p className="form-helper">
                  Si creaste tu cuenta con Google, agrega aqui tu celular para que tus compradores puedan contactarte y para usarlo al publicar prendas.
                </p>
                {profileStatus.message ? (
                  <div className={`form-message form-message-${profileStatus.type}`}>
                    {profileStatus.message}
                  </div>
                ) : null}
                <button type="submit" className="button-primary">
                  Guardar celular
                </button>
              </form>
            </section>

            {false ? (
              <>
            <section className="dashboard-panel user-section-panel">
              <div className="panel-head">
                <h2>Mis prendas publicadas</h2>
                <span>Publicaciones vinculadas a tu cuenta</span>
              </div>

              <div className="mini-list">
                {ownProducts.length === 0 ? (
                  <article className="mini-item">
                    <div>
                      <strong>Aún no tienes prendas</strong>
                      <p>Cuando publiques una prenda, aparecerá también en esta sección.</p>
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
                <h2>Métodos de pago</h2>
                  <span>Activa o registra tus métodos</span>
                </div>

                <div className="mini-list">
                  {ownMethods.map((method) => (
                    <article key={method.id || method.tipoMetodoPago} className="mini-item mini-item-stack">
                      <div>
                        <strong>{method.tipoMetodoPago}</strong>
                        <p>{method.numero || method.titular || method.instrucciones || "Sin detalle"}</p>
                        {method.qrUrl ? <p>QR registrado</p> : null}
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
                        <strong>Sin métodos registrados</strong>
                        <p>Agrega Yape, Plin, transferencia u otro método.</p>
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
                    <label className="full-span">
                      QR de pago
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={(event) =>
                          setPaymentForm((current) => ({
                            ...current,
                            qrFile: event.target.files?.[0] || null,
                          }))
                        }
                      />
                      <span className="file-helper">
                        {paymentForm.qrFile
                          ? `QR seleccionado: ${paymentForm.qrFile.name}`
                          : "Opcional. Sube el QR de Yape, Plin o transferencia."}
                      </span>
                    </label>
                  </div>

                  {renderStatusMessage(paymentStatus)}

                  <button type="submit" className="button-primary module-submit">
                    Guardar método
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
                        <strong>Aún no registraste reclamos</strong>
                        <p>Cuando envíes uno, aparecerá aquí con su estado.</p>
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
                      Prenda del catálogo
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
                        placeholder="Se completa automáticamente"
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
                      Descripción
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
              </>
            ) : null}
          </div>
        ) : null}

        {activeSection === "pagos" ? (
          <section className="dashboard-panel user-section-panel">
            <div className="panel-head">
              <h2>Metodos de pago</h2>
              <span>Registra Yape, Plin o transferencia para tus ventas</span>
            </div>

            <div className="mini-list">
              {ownMethods.map((method) => (
                <article key={method.id || method.tipoMetodoPago} className="mini-item mini-item-stack">
                  <div>
                    <strong>{method.tipoMetodoPago}</strong>
                    <p>{method.numero || method.titular || method.instrucciones || "Sin detalle"}</p>
                    {method.qrUrl ? <p>QR registrado</p> : null}
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
                    <p>Agrega tus datos de pago para que los compradores puedan pagar una prenda.</p>
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
                <label className="full-span">
                  QR de pago
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) =>
                      setPaymentForm((current) => ({
                        ...current,
                        qrFile: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  <span className="file-helper">
                    {paymentForm.qrFile
                      ? `QR seleccionado: ${paymentForm.qrFile.name}`
                      : "Opcional. Sube el QR de Yape, Plin o transferencia."}
                  </span>
                </label>
              </div>

              {renderStatusMessage(paymentStatus)}

              <button type="submit" className="button-primary module-submit">
                Guardar metodo
              </button>
            </form>
          </section>
        ) : null}

        {activeSection === "armario" ? (
          <section className="dashboard-panel user-section-panel">
            <div className="panel-head">
              <h2>Mi armario</h2>
              <span>Tus prendas y acciones disponibles</span>
            </div>

            {renderStatusMessage(productStatus)}

            <div className="wardrobe-status-tabs">
              <button
                type="button"
                className={wardrobeView === "PUBLICADA" ? "wardrobe-status-tab wardrobe-status-tab-active" : "wardrobe-status-tab"}
                onClick={() => setWardrobeView("PUBLICADA")}
              >
                Publicadas <span>{publishedProducts.length}</span>
              </button>
              <button
                type="button"
                className={wardrobeView === "VENDIDA" ? "wardrobe-status-tab wardrobe-status-tab-active" : "wardrobe-status-tab"}
                onClick={() => setWardrobeView("VENDIDA")}
              >
                Vendidas <span>{soldProducts.length}</span>
              </button>
              <button
                type="button"
                className={wardrobeView === "OTRAS" ? "wardrobe-status-tab wardrobe-status-tab-active" : "wardrobe-status-tab"}
                onClick={() => setWardrobeView("OTRAS")}
              >
                Otras <span>{otherProducts.length}</span>
              </button>
            </div>

            <div className="wardrobe-grid">
              {displayedWardrobeProducts.length === 0 ? (
                <article className="mini-item wardrobe-empty-card">
                  <div>
                    <strong>
                      {wardrobeView === "VENDIDA"
                        ? "No tienes prendas vendidas"
                        : wardrobeView === "OTRAS"
                          ? "No tienes otras prendas"
                          : "No tienes prendas publicadas"}
                    </strong>
                    <p>
                      {wardrobeView === "VENDIDA"
                        ? "Cuando marques una prenda como vendida, aparecerá aquí."
                        : wardrobeView === "OTRAS"
                          ? "Aquí aparecerán prendas pausadas o intercambiadas."
                        : "Publica una prenda desde la sección Publicar prenda."}
                    </p>
                  </div>
                  <span>0</span>
                </article>
              ) : (
                displayedWardrobeProducts.map((product) => (
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
                      {resolveBackendMedia(product.imagenSecundariaUrl) ? (
                        <span
                          className="wardrobe-card-media-hover"
                          style={{
                            backgroundImage: `linear-gradient(rgba(38, 50, 34, 0.08), rgba(38, 31, 24, 0.12)), url("${resolveBackendMedia(product.imagenSecundariaUrl)}")`,
                          }}
                        ></span>
                      ) : null}
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
                            <select
                              value={editProductForm.marca}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  marca: event.target.value,
                                  marcaPersonalizada:
                                    event.target.value === productOptions.opcionOtraMarca
                                      ? current.marcaPersonalizada
                                      : "",
                                }))
                              }
                            >
                              {productOptions.marcasReconocidas.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                              <option value={productOptions.opcionOtraMarca}>Otros</option>
                            </select>
                          </label>
                          {editProductForm.marca === productOptions.opcionOtraMarca ? (
                            <label>
                              Otra marca
                              <input
                                value={editProductForm.marcaPersonalizada || ""}
                                onChange={(event) =>
                                  setEditProductForm((current) => ({
                                    ...current,
                                    marcaPersonalizada: event.target.value,
                                  }))
                                }
                                placeholder="Escribe la marca"
                              />
                            </label>
                          ) : null}
                          <label>
                            Género
                            <select
                              value={editProductForm.genero}
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  genero: event.target.value,
                                }))
                              }
                            >
                              <option value="HOMBRE">Hombre</option>
                              <option value="MUJER">Mujer</option>
                              <option value="UNISEX">Unisex</option>
                            </select>
                          </label>
                          <label className="full-span">
                            Descripción
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
                          <div className="form-static-field">
                            <strong>Contacto</strong>
                            <span>{accountPhone || editProductForm.contacto || "No registrado"}</span>
                          </div>
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
                            Categoría
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
                            Estado físico
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
                            Tipo publicación
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
                            Cambiar foto principal
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
                                ? `Nueva foto principal: ${editProductForm.imagen.name}`
                                : "Opcional. Esta foto aparece primero en el catálogo."}
                            </span>
                          </label>
                          <label className="full-span">
                            Cambiar foto secundaria
                            <input
                              type="file"
                              accept="image/png,image/jpeg,image/jpg,image/webp"
                              onChange={(event) =>
                                setEditProductForm((current) => ({
                                  ...current,
                                  imagenSecundaria: event.target.files?.[0] || null,
                                }))
                              }
                            />
                            <span className="file-helper">
                              {editProductForm.imagenSecundaria
                                ? `Nueva foto secundaria: ${editProductForm.imagenSecundaria.name}`
                                : "Opcional. Esta foto aparece al pasar el mouse por la prenda."}
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

        {activeSection === "ventas" ? (
          <section className="dashboard-panel user-section-panel">
            <div className="panel-head">
              <h2>Ventas</h2>
              <span>Comprobantes recibidos por tus prendas</span>
            </div>

            <div className="commerce-proof-list">
              {ownSales.length === 0 ? (
                <article className="mini-item">
                  <div>
                    <strong>Aun no recibes comprobantes</strong>
                    <p>Cuando un comprador suba su comprobante, aparecera aqui ligado a la prenda.</p>
                  </div>
                  <span>0</span>
                </article>
              ) : (
                ownSales.map((sale) => (
                  <article key={sale.id} className="commerce-proof-card">
                    <div>
                      <span className="section-kicker">Comprobante recibido</span>
                      <h3>{sale.prendaNombre || "Prenda sin nombre"}</h3>
                      <p>Comprador: {sale.compradorNombre || sale.compradorEmail || "No registrado"}</p>
                      <p>Email: {sale.compradorEmail || "No registrado"}</p>
                      <p>Monto: S/ {Number(sale.monto || 0).toFixed(2)} - Estado: {sale.estado}</p>
                      <p>{sale.creadoEn ? new Date(sale.creadoEn).toLocaleString("es-PE") : ""}</p>
                    </div>
                    {sale.comprobanteUrl ? (
                      <a href={sale.comprobanteUrl} target="_blank" rel="noreferrer">
                        <img src={sale.comprobanteUrl} alt="Comprobante de pago recibido" />
                      </a>
                    ) : null}
                  </article>
                ))
              )}
            </div>
          </section>
        ) : null}

        {activeSection === "compras" ? (
          <section className="dashboard-panel user-section-panel">
            <div className="panel-head">
              <h2>Historial de compras</h2>
              <span>Comprobantes enviados y reclamos de compra</span>
            </div>

            {renderStatusMessage(claimStatus)}

            <div className="commerce-proof-list">
              {ownPurchases.length === 0 ? (
                <article className="mini-item">
                  <div>
                    <strong>Aun no tienes compras registradas</strong>
                    <p>Cuando subas un comprobante desde el detalle de una prenda, aparecera aqui.</p>
                  </div>
                  <span>0</span>
                </article>
              ) : (
                ownPurchases.map((purchase) => (
                  <article key={purchase.id} className="commerce-proof-card">
                    <div>
                      <span className="section-kicker">Compra registrada</span>
                      <h3>{purchase.prendaNombre || "Prenda sin nombre"}</h3>
                      <p>Vendedor: {purchase.vendedorNombre || "Vendedor"}</p>
                      <p>Monto: S/ {Number(purchase.monto || 0).toFixed(2)} - Estado: {purchase.estado}</p>
                      <p>{purchase.creadoEn ? new Date(purchase.creadoEn).toLocaleString("es-PE") : ""}</p>

                      {purchaseClaimForm.comprobanteId === purchase.id ? (
                        <form
                          className="module-form purchase-claim-form"
                          onSubmit={(event) => handleCreatePurchaseClaim(event, purchase)}
                        >
                          <label>
                            Motivo del reclamo
                            <select
                              value={purchaseClaimForm.motivo}
                              onChange={(event) =>
                                setPurchaseClaimForm((current) => ({
                                  ...current,
                                  motivo: event.target.value,
                                }))
                              }
                            >
                              {garmentOptions.motivosReclamo.map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          </label>
                          <label>
                            Describe el problema
                            <textarea
                              rows="3"
                              value={purchaseClaimForm.descripcion}
                              onChange={(event) =>
                                setPurchaseClaimForm((current) => ({
                                  ...current,
                                  descripcion: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <div className="button-row">
                            <button type="submit" className="button-primary">
                              Enviar reclamo
                            </button>
                            <button
                              type="button"
                              className="button-secondary"
                              onClick={() =>
                                setPurchaseClaimForm({
                                  comprobanteId: "",
                                  motivo: "NO_ENTREGA",
                                  descripcion: "",
                                })
                              }
                            >
                              Cancelar
                            </button>
                          </div>
                        </form>
                      ) : (
                        <button
                          type="button"
                          className="button-secondary"
                          onClick={() =>
                            setPurchaseClaimForm({
                              comprobanteId: purchase.id,
                              motivo: "NO_ENTREGA",
                              descripcion: "",
                            })
                          }
                        >
                          Reclamar problema
                        </button>
                      )}
                    </div>
                    {purchase.comprobanteUrl ? (
                      <a href={purchase.comprobanteUrl} target="_blank" rel="noreferrer">
                        <img src={purchase.comprobanteUrl} alt="Comprobante de pago enviado" />
                      </a>
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
              <h2>Publicar prenda</h2>
              <span>Completa y publica de forma ordenada</span>
            </div>

            <section className="ai-garment-assistant">
              <div className="ai-garment-copy">
                <p className="section-kicker">Deja que la IA lo haga por ti</p>
                <h3>Convierte una foto simple en una publicación lista</h3>
                <p>
                  Sube una foto de tu prenda para que la IA sugiera descripción,
                  color, categoría, estado, precio y marca cuando pueda reconocerla.
                </p>
                <div className="ai-garment-actions">
                  <label className="ai-upload-control">
                    Subir foto
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={(event) => handleAiGarmentFileChange(event.target.files?.[0] || null)}
                    />
                  </label>
                  <button type="button" className="button-secondary" onClick={handleAnalyzeGarmentWithIa}>
                    Analizar con IA
                  </button>
                  <button type="button" className="button-primary" onClick={handleCopyAiGarmentImage}>
                    Copiar imagen
                  </button>
                </div>
                {renderStatusMessage(aiGarmentStatus)}
              </div>

              <div className="ai-garment-preview-card">
                <div
                  className={`ai-garment-preview ${aiGarmentPreview ? "ai-garment-preview-ready" : ""}`}
                  style={
                    aiGarmentPreview
                      ? {
                          backgroundImage: `url("${aiGarmentPreview}")`,
                        }
                      : undefined
                  }
                >
                  {!aiGarmentPreview ? <span>Vista previa IA</span> : null}
                </div>
                <div className="ai-garment-preview-meta">
                  <strong>{aiGarmentSuggestion?.nombre || "Imagen para catálogo"}</strong>
                  <span>
                    {aiGarmentFile
                      ? "Lista para usar en Imagen de la prenda"
                      : "Aquí aparecerá la prenda subida"}
                  </span>
                </div>
              </div>
            </section>

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
                  <select
                    value={productForm.marca}
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        marca: event.target.value,
                        marcaPersonalizada:
                          event.target.value === productOptions.opcionOtraMarca
                            ? current.marcaPersonalizada
                            : "",
                      }))
                    }
                  >
                    {productOptions.marcasReconocidas.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                    <option value={productOptions.opcionOtraMarca}>Otros</option>
                  </select>
                </label>
                {productForm.marca === productOptions.opcionOtraMarca ? (
                  <label>
                    Otra marca
                    <input
                      value={productForm.marcaPersonalizada}
                      onChange={(event) =>
                        setProductForm((current) => ({
                          ...current,
                          marcaPersonalizada: event.target.value,
                        }))
                      }
                      placeholder="Escribe la marca"
                    />
                  </label>
                ) : null}
                <label>
                  Género
                  <select
                    value={productForm.genero}
                    onChange={(event) =>
                      setProductForm((current) => ({ ...current, genero: event.target.value }))
                    }
                  >
                    <option value="HOMBRE">Hombre</option>
                    <option value="MUJER">Mujer</option>
                    <option value="UNISEX">Unisex</option>
                  </select>
                </label>
                <label className="full-span">
                  Descripción
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
                <div className="form-static-field">
                  <strong>Contacto</strong>
                  <span>{accountPhone || "No registrado en tu perfil"}</span>
                </div>
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
                  Categoría
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
                  Estado físico
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
                  Tipo publicación
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
                  Foto principal de la prenda
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
                      ? `Foto principal: ${productForm.imagen.name}`
                      : "Esta foto aparecerá primero en el catálogo."}
                  </span>
                </label>
                <label className="full-span">
                  Foto secundaria para hover
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) =>
                      setProductForm((current) => ({
                        ...current,
                        imagenSecundaria: event.target.files?.[0] || null,
                      }))
                    }
                  />
                  <span className="file-helper">
                    {productForm.imagenSecundaria
                      ? `Foto secundaria: ${productForm.imagenSecundaria.name}`
                      : "Al pasar el mouse por la prenda se mostrará esta segunda foto."}
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
              <h2>Recomendación IA</h2>
              <span>Sugerencias basadas en estilo, ocasion y clima</span>
            </div>

            <div className="user-ia-intro">
              <article className="user-summary-card">
                <strong>Recomendación de outfit</strong>
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
                  Ocasión
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
                    <h3>Por qué te las recomendamos</h3>
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
                    <p className="tryon-helper">Selecciona exactamente 2 prendas para generar la prueba virtual.</p>
                    <div className="product-grid user-dashboard-products tryon-select-grid">
                      {recommendedProducts.map((product) => (
                        <article
                          key={product.id}
                          className={
                            selectedTryOnProductIds.includes(product.id)
                              ? "tryon-select-card tryon-select-card-active"
                              : "tryon-select-card"
                          }
                        >
                          <ProductCard product={product} />
                          <button
                            type="button"
                            className="tryon-select-button"
                            onClick={() => handleToggleTryOnProduct(product.id)}
                          >
                            {selectedTryOnProductIds.includes(product.id) ? "Seleccionada" : "Elegir para prueba"}
                          </button>
                        </article>
                      ))}
                    </div>
                  </div>
                ) : null}

                {recommendedProducts.length ? (
                  <div className="virtual-tryon-panel">
                    <div className="virtual-tryon-copy">
                      <h3>Prueba virtual con tu rostro</h3>
                      <p>
                        Sube una foto frontal o de medio cuerpo. La prueba usará tu estatura,
                        contextura y las 2 prendas seleccionadas.
                      </p>

                      <div className="virtual-tryon-actions">
                        <label className="ai-upload-control">
                          Subir rostro
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/webp"
                            onChange={(event) => handleTryOnFaceFileChange(event.target.files?.[0] || null)}
                          />
                        </label>
                        <button type="button" className="button-primary" onClick={handleGenerateVirtualTryOn}>
                          Generar prueba virtual
                        </button>
                      </div>

                      {renderStatusMessage(tryOnStatus)}
                    </div>

                    <div className="virtual-tryon-preview">
                      <div
                        className={`virtual-tryon-face ${tryOnFacePreview ? "virtual-tryon-face-ready" : ""}`}
                        style={
                          tryOnFacePreview
                            ? {
                                backgroundImage: `url("${tryOnFacePreview}")`,
                              }
                            : undefined
                        }
                      >
                        {!tryOnFacePreview ? <span>Foto del usuario</span> : null}
                      </div>

                      <div className="virtual-tryon-result">
                        {tryOnResult?.imagenUrl ? (
                          <img src={resolveBackendMedia(tryOnResult.imagenUrl)} alt="Prueba virtual generada" />
                        ) : (
                          <div>
                            <strong>Resultado IA</strong>
                            <span>{tryOnResult?.estado || "Pendiente"}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {tryOnResult?.prendasSeleccionadas?.length ? (
                      <div className="virtual-tryon-summary">
                        {tryOnResult.prendasSeleccionadas.map((product) => (
                          <span key={product.id}>{product.nombre}</span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="empty-state">
                <strong>Sin resultado todavía</strong>
                <p>Cuando presiones recomendar outfit, verás aquí las prendas sugeridas para tu perfil.</p>
              </div>
            )}
          </section>
        ) : null}
      </div>
    </section>
  );
}

export default UserDashboardPage;
