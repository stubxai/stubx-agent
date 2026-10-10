/* Pasa la dirección escrita en Verify dentro del enlace, solo al pulsar. No la guarda. */
(function () {
  var BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  function queryAddress() {
    try {
      var value = new URLSearchParams(location.search).get("a") || "";
      return BASE58.test(value) ? value : "";
    } catch (error) {
      return "";
    }
  }

  function withAddress(href, address) {
    var url = new URL(href, location.origin);
    url.searchParams.set("a", address);
    return url.pathname + url.search + url.hash;
  }

  var input = document.getElementById("direccion-token");
  if (input) {
    var fromQuery = queryAddress();
    if (!input.value && fromQuery) input.value = fromQuery;
    document.querySelectorAll('a[href^="/aprender/"]').forEach(function (link) {
      link.addEventListener("click", function () {
        var value = String(input.value || "").trim();
        if (!BASE58.test(value)) return;
        link.setAttribute("href", withAddress(link.getAttribute("href") || "/aprender/", value));
      });
    });
    return;
  }

  var carried = queryAddress();
  if (!carried) return;
  document.querySelectorAll('a[href="/verify/"], a[href^="/verify/?"]').forEach(function (link) {
    link.addEventListener("click", function () {
      link.setAttribute("href", withAddress(link.getAttribute("href") || "/verify/", carried));
    });
  });
})();
