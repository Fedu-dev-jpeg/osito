(function () {
  "use strict";

  const PRODUCT_KEY = "libreria_callao_products";
  const SETTINGS_KEY = "libreria_callao_settings";
  const STATS_KEY = "libreria_callao_stats";
  const CART_KEY = "libreria_callao_cart";
  const FAVORITES_KEY = "libreria_callao_favorites";

  const defaultProducts = [
    { id: "lectura-lenta", name: "El arte de la lectura lenta", category: "Libros", subcategory: "Ensayo", description: "Ensayos sobre el oficio de leer. Tapa dura, 312 paginas.", price: 24900, badge: "Novedad", imageSlot: "callao-p1" },
    { id: "cuaderno-callao-a5", name: "Cuaderno Callao A5", category: "Papeleria", subcategory: "Cuadernos", description: "Papel marfil 100 g, hoja punteada. Cosido y con elastico.", price: 18400, imageSlot: "callao-p2" },
    { id: "pluma-recoleta-f", name: "Pluma fuente Recoleta F", category: "Escritura", subcategory: "Plumas", description: "Trazo fino, resina veteada. Incluye dos cartuchos y converter.", price: 67500, badge: "Edicion limitada", imageSlot: "callao-p3" },
    { id: "resaltadores-tierra", name: "Resaltadores tono tierra x6", category: "Escolar", subcategory: "Marcadores", description: "Punta biselada, tinta al agua. No traspasa el papel fino.", price: 9750, imageSlot: "callao-p4" },
    { id: "agenda-semanal-2026", name: "Agenda semanal 2026", category: "Agendas", subcategory: "2026", description: "Semana a la vista, feriados argentinos y 16 hojas de notas.", price: 31200, imageSlot: "callao-p5" }
  ];

  const money = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  });

  function readJson(key, fallback) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      console.warn("No se pudo leer", key, error);
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function getProducts() {
    const products = readJson(PRODUCT_KEY, null);
    if (Array.isArray(products) && products.length) return products;
    writeJson(PRODUCT_KEY, defaultProducts);
    return defaultProducts.slice();
  }

  function setProducts(products) {
    writeJson(PRODUCT_KEY, products);
    window.dispatchEvent(new CustomEvent("lc:products-updated"));
  }

  function getSettings() {
    return Object.assign({
      googleAnalyticsId: "",
      metaPixelId: "",
      whatsapp: "+541143720000",
      freeShippingFrom: 80000,
      campaignName: "",
      campaignBudget: "",
      campaignAudience: ""
    }, readJson(SETTINGS_KEY, {}));
  }

  function setSettings(settings) {
    writeJson(SETTINGS_KEY, settings);
    applyTracking(settings);
  }

  function track(eventName, details) {
    const stats = readJson(STATS_KEY, {});
    stats[eventName] = (stats[eventName] || 0) + 1;
    stats.lastEvent = { eventName, details: details || {}, at: new Date().toISOString() };
    writeJson(STATS_KEY, stats);

    if (typeof window.gtag === "function") window.gtag("event", eventName, details || {});
    if (typeof window.fbq === "function") window.fbq("trackCustom", eventName, details || {});
  }

  function applyTracking(settings) {
    const ga = (settings.googleAnalyticsId || "").trim();
    const pixel = (settings.metaPixelId || "").trim();

    if (ga && !document.querySelector("script[data-lc-ga]")) {
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(ga);
      script.dataset.lcGa = "true";
      document.head.appendChild(script);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", ga);
    }

    if (pixel && !window.fbq) {
      window.fbq = function () {
        window.fbq.callMethod ? window.fbq.callMethod.apply(window.fbq, arguments) : window.fbq.queue.push(arguments);
      };
      window.fbq.queue = [];
      window.fbq.loaded = true;
      window.fbq.version = "2.0";
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      script.dataset.lcMeta = "true";
      document.head.appendChild(script);
      window.fbq("init", pixel);
      window.fbq("track", "PageView");
    }
  }

  function slugify(value) {
    return String(value || "producto")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "producto";
  }

  function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) return resolve("");
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function productImage(product) {
    if (product.image) return `<img src="${product.image}" alt="${escapeHtml(product.name)}" style="width:100%; height:100%; object-fit:cover;">`;
    return `<image-slot id="${product.imageSlot || "admin-" + product.id}" shape="rect" fit="cover" placeholder="${escapeHtml(product.name)}"></image-slot>`;
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#039;"
    }[char]));
  }

  function renderProductCard(product) {
    const badge = product.badge ? `<span style="position:absolute; top:12px; left:12px; z-index:2; pointer-events:none; background:#1C2B46; color:#EFE9DC; font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:9.5px; letter-spacing:0.16em; text-transform:uppercase; padding:5px 9px; border-radius:2px;">${escapeHtml(product.badge)}</span>` : "";
    return `
      <article data-product-id="${escapeHtml(product.id)}" data-product-category="${escapeHtml(product.category)}" style="display:flex; flex-direction:column; border:1px solid rgba(28,43,70,0.14); border-radius:4px; background:#FFFDF7; overflow:hidden;">
        <div style="position:relative; height:250px; background:#F1EBDD; border-bottom:1px solid rgba(28,43,70,0.1);">
          ${productImage(product)}
          ${badge}
        </div>
        <div style="padding:18px 18px 20px; display:flex; flex-direction:column; flex:1; gap:8px;">
          <span style="font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:9.5px; letter-spacing:0.2em; text-transform:uppercase; color:#B68235;">${escapeHtml(product.category)} · ${escapeHtml(product.subcategory || "General")}</span>
          <h3 style="font-family:'Cormorant Garamond',Garamond,serif; font-weight:600; font-size:20px; line-height:1.18; color:#1C2B46; margin:0;">${escapeHtml(product.name)}</h3>
          <p style="font-size:12.5px; line-height:1.6; color:#6B665E; margin:0;">${escapeHtml(product.description)}</p>
          <div style="margin-top:auto; padding-top:14px; display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <span style="font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:17px; font-weight:600; color:#6B1E2B; font-variant-numeric:tabular-nums;">${money.format(Number(product.price) || 0)}</span>
            <button type="button" data-add-product="${escapeHtml(product.id)}" style="font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:11.5px; letter-spacing:0.08em; text-transform:uppercase; color:#1C2B46; border:1px solid rgba(28,43,70,0.28); border-radius:3px; padding:7px 11px; background:transparent; cursor:pointer;">Agregar</button>
          </div>
        </div>
      </article>
    `;
  }

  function findTextElement(text) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
    let node = walker.nextNode();
    while (node) {
      if ((node.textContent || "").trim() === text) return node;
      node = walker.nextNode();
    }
    return null;
  }

  function updateHeaderCounts() {
    const cart = readJson(CART_KEY, []);
    const favorites = readJson(FAVORITES_KEY, []);
    const total = cart.reduce((sum, item) => sum + ((Number(item.price) || 0) * (Number(item.qty) || 1)), 0);
    document.querySelectorAll("[data-lc-cart-count]").forEach((node) => { node.textContent = String(cart.reduce((sum, item) => sum + item.qty, 0)); });
    document.querySelectorAll("[data-lc-cart-total]").forEach((node) => { node.textContent = money.format(total); });
    document.querySelectorAll("[data-lc-fav-count]").forEach((node) => { node.textContent = String(favorites.length); });
  }

  function enhanceStorefront() {
    applyTracking(getSettings());
    const products = getProducts();
    const grids = Array.from(document.querySelectorAll("div[style*='grid-template-columns:repeat(5,1fr)']"));
    const productGrid = grids.find((grid) => grid.querySelector("article"));
    let activeCategory = "Todos";
    let query = "";

    function renderGrid() {
      if (!productGrid) return;
      const normalizedQuery = query.trim().toLowerCase();
      const filtered = products.filter((product) => {
        const matchesCategory = activeCategory === "Todos" || product.category.toLowerCase() === activeCategory.toLowerCase();
        const haystack = `${product.name} ${product.category} ${product.subcategory || ""} ${product.description}`.toLowerCase();
        return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery));
      });
      productGrid.innerHTML = filtered.length
        ? filtered.map(renderProductCard).join("")
        : `<div style="grid-column:1/-1; padding:28px; border:1px solid rgba(28,43,70,0.14); background:#FFFDF7; color:#5C574F;">No encontramos productos para esa busqueda.</div>`;
    }

    renderGrid();

    const searchShell = findTextElement("Buscar productos…");
    if (searchShell && !document.querySelector("[data-lc-search]")) {
      const input = document.createElement("input");
      input.type = "search";
      input.placeholder = "Buscar productos...";
      input.dataset.lcSearch = "true";
      input.style.cssText = "flex:1; min-width:0; border:0; outline:0; background:transparent; font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; color:#3A3733;";
      searchShell.replaceWith(input);
      input.addEventListener("input", () => {
        query = input.value;
        track("search", { query });
        renderGrid();
      });
    }

    document.querySelectorAll("a").forEach((link) => {
      const label = (link.textContent || "").trim();
      if (label === "Mi cuenta") link.setAttribute("href", "/admin");
      if (["Libreria", "Librería", "Escolar", "Oficina", "Papeleria", "Papelería", "Agendas", "Libros"].includes(label)) {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          activeCategory = label === "Librería" || label === "Libreria" ? "Libros" : label.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          track("category_click", { category: activeCategory });
          renderGrid();
        });
      }
      if (label === "Ver productos") {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          document.querySelector("[data-product-id]")?.scrollIntoView({ behavior: "smooth", block: "start" });
          track("view_products_click");
        });
      }
      if (label === "Suscribirme") {
        link.addEventListener("click", (event) => {
          event.preventDefault();
          const email = document.querySelector("[data-lc-newsletter]")?.value || "";
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            alert("Ingresá un email válido para suscribirte.");
            return;
          }
          track("newsletter_signup", { emailDomain: email.split("@")[1] });
          alert("Gracias por suscribirte. Te vamos a escribir con novedades de la librería.");
        });
      }
    });

    const newsletterPlaceholder = findTextElement("tu@correo.com.ar");
    if (newsletterPlaceholder && !document.querySelector("[data-lc-newsletter]")) {
      const input = document.createElement("input");
      input.type = "email";
      input.placeholder = "tu@correo.com.ar";
      input.dataset.lcNewsletter = "true";
      input.style.cssText = "width:320px; height:46px; border:1px solid rgba(28,43,70,0.24); border-radius:3px; background:#FFFDF7; display:flex; align-items:center; padding:0 14px; font-family:-apple-system,'Helvetica Neue',Helvetica,Arial,sans-serif; font-size:14px; color:#3A3733;";
      newsletterPlaceholder.replaceWith(input);
    }

    document.body.addEventListener("click", (event) => {
      const addButton = event.target.closest("[data-add-product]");
      if (addButton) {
        const product = getProducts().find((item) => item.id === addButton.dataset.addProduct);
        if (!product) return;
        const cart = readJson(CART_KEY, []);
        const existing = cart.find((item) => item.id === product.id);
        if (existing) existing.qty += 1;
        else cart.push({ id: product.id, name: product.name, price: product.price, qty: 1 });
        writeJson(CART_KEY, cart);
        track("add_to_cart", { productId: product.id, price: product.price });
        updateHeaderCounts();
        addButton.textContent = "Agregado";
        setTimeout(() => { addButton.textContent = "Agregar"; }, 1200);
      }
    });

    const cartAnchor = Array.from(document.querySelectorAll("a")).find((link) => (link.textContent || "").includes("Carrito"));
    if (cartAnchor) {
      const badge = cartAnchor.querySelector("span span");
      const totalNode = Array.from(cartAnchor.querySelectorAll("span")).find((node) => (node.textContent || "").includes("$"));
      if (badge) badge.dataset.lcCartCount = "true";
      if (totalNode) totalNode.dataset.lcCartTotal = "true";
      cartAnchor.addEventListener("click", (event) => {
        event.preventDefault();
        const cart = readJson(CART_KEY, []);
        const lines = cart.length ? cart.map((item) => `${item.qty} x ${item.name} - ${money.format(item.price * item.qty)}`).join("\n") : "El carrito esta vacio.";
        alert(lines);
        track("cart_open");
      });
    }

    const favoriteAnchor = Array.from(document.querySelectorAll("a")).find((link) => (link.textContent || "").trim() === "Favoritos");
    if (favoriteAnchor) {
      const counter = document.createElement("span");
      counter.dataset.lcFavCount = "true";
      counter.style.cssText = "font-size:11px; color:#6B1E2B;";
      favoriteAnchor.appendChild(counter);
      favoriteAnchor.addEventListener("click", (event) => {
        event.preventDefault();
        alert("Los favoritos se guardan localmente para esta sesión de administración/demo.");
        track("favorites_open");
      });
    }

    window.addEventListener("lc:products-updated", () => location.reload());
    updateHeaderCounts();
  }

  function field(name, label, type, value, required) {
    return `
      <label class="lc-admin-field">
        <span>${label}</span>
        <input name="${name}" type="${type || "text"}" value="${escapeHtml(value || "")}" ${required ? "required" : ""}>
      </label>
    `;
  }

  function renderAdmin() {
    document.documentElement.classList.add("lc-admin-page");
    document.body.innerHTML = `
      <main class="lc-admin">
        <header class="lc-admin-header">
          <div>
            <p>Administracion</p>
            <h1>Libreria Callao</h1>
            <span>Productos, estadisticas, Meta Pixel, Google Analytics y campañas.</span>
          </div>
          <a href="../Main.dc.html">Volver a la tienda</a>
        </header>
        <section class="lc-admin-grid">
          <form id="lc-product-form" class="lc-admin-card">
            <h2>Subir o editar producto</h2>
            <input type="hidden" name="id">
            ${field("name", "Nombre", "text", "", true)}
            ${field("category", "Categoria", "text", "", true)}
            ${field("subcategory", "Subcategoria", "text", "")}
            <label class="lc-admin-field"><span>Descripcion</span><textarea name="description" required></textarea></label>
            ${field("price", "Precio ARS", "number", "", true)}
            ${field("badge", "Etiqueta opcional", "text", "")}
            <label class="lc-admin-field"><span>Imagen del producto</span><input name="image" type="file" accept="image/*"></label>
            <div class="lc-admin-actions">
              <button type="submit">Guardar producto</button>
              <button type="button" id="lc-product-reset">Limpiar</button>
            </div>
          </form>
          <form id="lc-settings-form" class="lc-admin-card">
            <h2>Analytics y ads</h2>
            ${field("googleAnalyticsId", "Google Analytics ID", "text", getSettings().googleAnalyticsId)}
            ${field("metaPixelId", "Meta Pixel ID", "text", getSettings().metaPixelId)}
            ${field("whatsapp", "WhatsApp ventas", "text", getSettings().whatsapp)}
            ${field("freeShippingFrom", "Envio gratis desde", "number", getSettings().freeShippingFrom)}
            ${field("campaignName", "Campaña activa", "text", getSettings().campaignName)}
            ${field("campaignBudget", "Presupuesto diario", "number", getSettings().campaignBudget)}
            <label class="lc-admin-field"><span>Audiencia / notas de ads</span><textarea name="campaignAudience">${escapeHtml(getSettings().campaignAudience)}</textarea></label>
            <button type="submit">Guardar configuracion</button>
          </form>
        </section>
        <section class="lc-admin-grid">
          <div class="lc-admin-card">
            <h2>Estadisticas</h2>
            <div id="lc-stats"></div>
          </div>
          <div class="lc-admin-card">
            <h2>Productos cargados</h2>
            <div id="lc-product-list"></div>
          </div>
        </section>
      </main>
    `;

    const productForm = document.getElementById("lc-product-form");
    const settingsForm = document.getElementById("lc-settings-form");
    const resetButton = document.getElementById("lc-product-reset");

    function refreshAdmin() {
      const products = getProducts();
      const stats = readJson(STATS_KEY, {});
      document.getElementById("lc-stats").innerHTML = `
        <div class="lc-admin-stats">
          <strong>${products.length}</strong><span>productos</span>
          <strong>${readJson(CART_KEY, []).reduce((sum, item) => sum + item.qty, 0)}</strong><span>items en carrito</span>
          <strong>${stats.add_to_cart || 0}</strong><span>agregados al carrito</span>
          <strong>${stats.search || 0}</strong><span>busquedas</span>
          <strong>${stats.newsletter_signup || 0}</strong><span>suscripciones</span>
        </div>
        <p class="lc-admin-muted">Ultimo evento: ${escapeHtml(stats.lastEvent ? `${stats.lastEvent.eventName} (${stats.lastEvent.at})` : "sin datos todavia")}</p>
      `;
      document.getElementById("lc-product-list").innerHTML = products.map((product) => `
        <article class="lc-admin-product">
          <div>${product.image ? `<img src="${product.image}" alt="">` : ""}</div>
          <strong>${escapeHtml(product.name)}</strong>
          <span>${escapeHtml(product.category)} · ${money.format(Number(product.price) || 0)}</span>
          <button type="button" data-edit="${escapeHtml(product.id)}">Editar</button>
          <button type="button" data-delete="${escapeHtml(product.id)}">Eliminar</button>
        </article>
      `).join("");
    }

    productForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(productForm);
      const products = getProducts();
      const id = formData.get("id") || slugify(formData.get("name"));
      const existing = products.find((product) => product.id === id);
      const image = await readFileAsDataUrl(productForm.elements.image.files[0]);
      const product = {
        id,
        name: formData.get("name"),
        category: formData.get("category"),
        subcategory: formData.get("subcategory"),
        description: formData.get("description"),
        price: Number(formData.get("price")) || 0,
        badge: formData.get("badge"),
        image: image || (existing && existing.image) || "",
        imageSlot: (existing && existing.imageSlot) || "admin-" + id
      };
      const next = existing ? products.map((item) => item.id === id ? product : item) : products.concat(product);
      setProducts(next);
      track(existing ? "admin_product_update" : "admin_product_create", { productId: id });
      productForm.reset();
      productForm.elements.id.value = "";
      refreshAdmin();
      alert("Producto guardado.");
    });

    settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(settingsForm).entries());
      setSettings(data);
      track("admin_settings_update");
      alert("Configuracion guardada.");
    });

    resetButton.addEventListener("click", () => {
      productForm.reset();
      productForm.elements.id.value = "";
    });

    document.getElementById("lc-product-list").addEventListener("click", (event) => {
      const editId = event.target.dataset.edit;
      const deleteId = event.target.dataset.delete;
      const products = getProducts();
      if (editId) {
        const product = products.find((item) => item.id === editId);
        if (!product) return;
        ["id", "name", "category", "subcategory", "description", "price", "badge"].forEach((name) => {
          productForm.elements[name].value = product[name] || "";
        });
        productForm.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      if (deleteId && confirm("Eliminar este producto?")) {
        setProducts(products.filter((item) => item.id !== deleteId));
        track("admin_product_delete", { productId: deleteId });
        refreshAdmin();
      }
    });

    refreshAdmin();
  }

  function addResponsiveAndAdminStyles() {
    const style = document.createElement("style");
    style.textContent = `
      body > x-dc > div {
        width: min(100%, 1320px) !important;
        padding: 18px !important;
        box-sizing: border-box !important;
      }
      x-import[component-from-global-scope="ChromeWindow"] {
        min-width: 0 !important;
        width: 100% !important;
        display: block !important;
      }
      [data-om-starter="browser-window"] {
        width: min(100%, 1280px) !important;
        max-width: calc(100vw - 36px) !important;
        height: auto !important;
        min-height: 100vh !important;
        margin: 0 auto !important;
      }
      @media (max-width: 900px) {
        body > x-dc > div { width: 100% !important; padding: 0 !important; }
        x-import[component-from-global-scope="ChromeWindow"] { min-width: 0 !important; width: 100% !important; display: block !important; }
        [data-om-starter="browser-window"] { width: 100vw !important; height: auto !important; min-height: 100vh !important; border-radius: 0 !important; }
        div[style*="max-width:1240px"] { padding-left: 18px !important; padding-right: 18px !important; }
        div[style*="grid-template-columns:repeat(5,1fr)"] { grid-template-columns: 1fr !important; }
        div[style*="grid-template-columns:repeat(3,1fr)"], div[style*="grid-template-columns:1fr 1fr"], div[style*="grid-template-columns:1fr auto"], div[style*="grid-template-columns:auto 1fr auto"], div[style*="grid-template-columns:minmax(480px,0.86fr)"] { grid-template-columns: 1fr !important; }
        header nav, header nav > div, div[style*="justify-content:space-between"] { flex-wrap: wrap !important; }
        h1 { font-size: clamp(38px, 11vw, 60px) !important; }
        div[style*="height:474px"], div[style*="height:400px"], div[style*="height:250px"] { aspect-ratio: 4 / 3 !important; height: auto !important; }
      }
      .lc-admin-page body { margin: 0; background: #F7F3E9; color: #201F1D; font-family: Lora, Georgia, serif; }
      .lc-admin { max-width: 1180px; margin: 0 auto; padding: 32px 18px 56px; }
      .lc-admin-header { display: flex; justify-content: space-between; gap: 20px; align-items: flex-start; border-bottom: 1px solid rgba(28,43,70,.18); padding-bottom: 24px; margin-bottom: 24px; }
      .lc-admin-header p { margin: 0 0 8px; text-transform: uppercase; letter-spacing: .18em; color: #B68235; font: 12px system-ui, sans-serif; }
      .lc-admin-header h1 { margin: 0 0 6px; color: #1C2B46; font: 42px 'Cormorant Garamond', Garamond, serif; }
      .lc-admin-header a, .lc-admin button { border: 1px solid #6B1E2B; color: #6B1E2B; background: #FFFDF7; border-radius: 3px; padding: 10px 14px; cursor: pointer; text-decoration: none; font: 13px system-ui, sans-serif; }
      .lc-admin-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px; margin-bottom: 18px; }
      .lc-admin-card { background: #FFFDF7; border: 1px solid rgba(28,43,70,.16); border-radius: 5px; padding: 20px; }
      .lc-admin-card h2 { margin: 0 0 16px; color: #1C2B46; font: 28px 'Cormorant Garamond', Garamond, serif; }
      .lc-admin-field { display: grid; gap: 6px; margin-bottom: 12px; font: 13px system-ui, sans-serif; color: #4A4640; }
      .lc-admin-field input, .lc-admin-field textarea { width: 100%; border: 1px solid rgba(28,43,70,.24); border-radius: 3px; background: white; padding: 10px; font: 14px system-ui, sans-serif; }
      .lc-admin-field textarea { min-height: 96px; resize: vertical; }
      .lc-admin-actions { display: flex; gap: 10px; flex-wrap: wrap; }
      .lc-admin-stats { display: grid; grid-template-columns: auto 1fr; gap: 8px 12px; align-items: baseline; }
      .lc-admin-stats strong { color: #6B1E2B; font-size: 24px; }
      .lc-admin-muted { color: #6B665E; font-size: 13px; margin-top: 16px; }
      .lc-admin-product { display: grid; grid-template-columns: 58px 1fr auto auto; gap: 10px; align-items: center; padding: 10px 0; border-top: 1px solid rgba(28,43,70,.12); }
      .lc-admin-product img { width: 58px; height: 58px; object-fit: cover; border-radius: 3px; }
      .lc-admin-product span { color: #6B665E; font-size: 12px; }
      @media (max-width: 760px) {
        .lc-admin-header, .lc-admin-grid { grid-template-columns: 1fr; display: grid; }
        .lc-admin-product { grid-template-columns: 50px 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  document.addEventListener("DOMContentLoaded", () => {
    addResponsiveAndAdminStyles();
    const path = window.location.pathname.replace(/\/+$/, "");
    const adminRequested = path.endsWith("/admin") || path.endsWith("/admin/index.html") || new URLSearchParams(location.search).has("admin");
    if (adminRequested) renderAdmin();
    else enhanceStorefront();
  });
})();
