function verifyEl(tag, attrs) {
  var node = document.createElement(tag);
  if (!attrs) return node;
  Object.keys(attrs).forEach(function (key) {
    if (attrs[key] != null) node.setAttribute(key, String(attrs[key]));
  });
  return node;
}

function verifyLang() {
  return document.documentElement.getAttribute("data-lang") === "en" ? "en" : "es";
}

function legendItem(light, text) {
  var item = verifyEl("li", { "data-luz": light });
  item.textContent = text;
  return item;
}

function paintVerify(out, view) {
  var lang = verifyLang();
  out.replaceChildren();
  out.setAttribute("data-state", view.kind);
  out.setAttribute("data-luz", view.light);
  out.setAttribute("aria-busy", view.light === "espera" || view.kind === "comprobando" ? "true" : "false");
  if (view.kind === "vacio") {
    var emptyTitle = verifyEl("h2");
    emptyTitle.textContent = view.title[lang];
    var emptySupport = verifyEl("p", { class: "apoyo" });
    emptySupport.textContent = view.support[lang];
    var list = verifyEl("ul", { class: "leyenda" });
    list.append(
      legendItem("ok", lang === "en" ? "STUBX registry address" : "Dirección del registro de STUBX"),
      legendItem("riesgo", lang === "en" ? "Possible STUBX copy" : "Posible copia de STUBX"),
      legendItem("neutro", lang === "en" ? "Could not be checked" : "No se pudo comprobar"),
    );
    out.append(emptyTitle, emptySupport, list);
    return;
  }
  var flag = verifyEl("p", { class: "semaforo" });
  var dot = verifyEl("span", { class: "luz", "aria-hidden": "true" });
  var name = verifyEl("span");
  name.textContent = view.lightLabel[lang];
  flag.append(dot, name);
  var title = verifyEl("h2");
  title.textContent = view.title[lang];
  var support = verifyEl("p", { class: "apoyo" });
  support.textContent = view.support[lang];
  out.append(flag, title, support);
  if (view.mint) {
    var mint = verifyEl("p", { class: "mint" });
    mint.textContent = view.mint;
    out.append(mint);
  }
  if (view.partialNote) {
    var note = verifyEl("p", { class: "nota" });
    note.textContent = view.partialNote[lang];
    out.append(note);
  }
  if (view.signals && view.signals.length) {
    var signals = verifyEl("div", { class: "senales" });
    view.signals.forEach(function (signal) {
      var card = verifyEl("article", { class: "senal", "data-nivel": signal.level });
      var heading = verifyEl("h3");
      heading.textContent = signal.title[lang];
      var body = verifyEl("p");
      body.textContent = signal.explain[lang];
      card.append(heading, body);
      signals.append(card);
    });
    out.append(signals);
  }
  if (view.kind !== "vacio" && typeof AUDIT_NOTICE !== "undefined") {
    var audit = verifyEl("p", { class: "aviso-fijo" });
    audit.textContent = AUDIT_NOTICE[lang];
    out.append(audit);
  }
  if (view.rows && view.rows.length > 0) {
    var details = verifyEl("details", { class: "tecnico" });
    var summary = verifyEl("summary");
    summary.textContent = lang === "en" ? "Technical details" : "Detalles técnicos";
    var rows = verifyEl("dl");
    view.rows.forEach(function (row) {
      var term = verifyEl("dt");
      term.textContent = row.label[lang];
      var detail = verifyEl("dd");
      detail.textContent = row.value[lang];
      rows.append(term, detail);
    });
    details.append(summary, rows);
    out.append(details);
  }
}

function bootVerify() {
  var out = document.getElementById("resultado");
  var form = document.getElementById("consulta");
  var input = document.getElementById("direccion-token");
  if (!out || !form || !input || typeof STUBX_VERIFY === "undefined") return;
  var cards = STUBX_VERIFY.cards || [];
  var evm = STUBX_VERIFY.evm || [];
  var source = cards.length > 0 ? "lista" : "caida";

  var last = emptyView();

  function apply(view) {
    last = view;
    paintVerify(out, view);
    input.setAttribute("aria-invalid", view.kind === "invalida" ? "true" : "false");
    if (view.kind !== "vacio" && view.kind !== "comprobando") {
      var narrow = window.matchMedia("(max-width: 48rem)").matches;
      out.scrollIntoView({ block: narrow ? "start" : "nearest", inline: "nearest" });
    }
  }

  var generation = 0;

  function datedSignal(cardView) {
    if (cardView.kind === "oficial") {
      return {
        id: "ficha",
        level: "ok",
        title: { es: "Ficha fechada", en: "Dated card" },
        explain: {
          es: "Hay una ficha fechada de esta misma dirección. Es una foto anterior, no esta lectura.",
          en: "There is a dated card for this same address. It is an earlier snapshot, not this reading.",
        },
      };
    }
    if (cardView.kind === "copia") {
      return {
        id: "ficha",
        level: "riesgo",
        title: { es: "La ficha fechada también marca posible copia de STUBX", en: "The dated card also marks a possible STUBX copy" },
        explain: cardView.support,
      };
    }
    if (cardView.kind === "otra") {
      return {
        id: "ficha",
        level: "neutro",
        title: { es: "Hay una ficha fechada y no es la del registro", en: "There is a dated card and it is not the registry one" },
        explain: cardView.support,
      };
    }
    return null;
  }

  function run() {
    var value = input.value;
    var ticket = ++generation;
    if (typeof readAnyMint !== "function" || typeof loadingView !== "function") {
      apply(pendingView(value));
      window.requestAnimationFrame(function () {
        try {
          apply(classifyAddress(value, cards, source, evm));
        } catch (error) {
          apply(classifyAddress(value, [], "caida", evm));
        }
      });
      return;
    }
    var normalized = normalizeAddress(value);
    if (!normalized || /^0x/i.test(normalized) || !isAddress(normalized)) {
      apply(classifyAddress(value, cards, source, evm));
      return;
    }
    apply(loadingView(normalized));
    var rpc = STUBX_VERIFY.rpc || {};
    var endpoints = [rpc.primary, rpc.fallback].filter(function (item) { return !!item; });
    readAnyMint({
      mint: normalized,
      registry: STUBX_VERIFY.registry || [],
      endpoints: endpoints,
      maxRetries: 0,
      minIntervalMs: 200,
      timeoutMs: 8000,
    }).then(function (reading) {
      if (ticket !== generation) return;
      var view = reading;
      var extra = datedSignal(classifyAddress(normalized, cards, "lista", evm));
      if (extra && view.ok) {
        view.signals = view.signals.concat([extra]);
      }
      apply(view);
    }).catch(function () {
      if (ticket !== generation) return;
      apply(classifyAddress(normalized, cards, "caida", evm));
    });
  }

  apply(emptyView());
  form.addEventListener("submit", function (event) {
    event.preventDefault();
    run();
  });
  document.addEventListener("stubx-lang", function () {
    apply(last);
  });
  document.addEventListener("stubx-verify-preview", function (event) {
    var detail = event.detail || {};
    if (detail.kind === "comprobando") apply(pendingView(detail.raw || ""));
    if (detail.kind === "lectura_caida") apply(classifyAddress(detail.raw || "So11111111111111111111111111111111111111112", cards, "caida"));
  });
}
