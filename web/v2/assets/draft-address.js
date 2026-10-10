/* Pasa la dirección escrita en Verify en el fragmento #a=, solo al pulsar. La lee y la quita del historial. No la guarda. */
(function () {
  var BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

  function fragmentAddress() {
    var raw = location.hash.charAt(0) === "#" ? location.hash.slice(1) : location.hash;
    var match = /(?:^|&)a=([1-9A-HJ-NP-Za-km-z]{32,44})(?=&|$)/.exec(raw);
    return match && BASE58.test(match[1]) ? match[1] : "";
  }

  function hashWithoutAddress(hash) {
    var raw = hash.charAt(0) === "#" ? hash.slice(1) : hash;
    if (!raw || raw.indexOf("a=") === -1) return raw;
    return raw
      .split("&")
      .filter(function (part) {
        return part.slice(0, 2) !== "a=";
      })
      .join("&");
  }

  function scrubAddress() {
    var url = new URL(location.href);
    var nextHash = hashWithoutAddress(url.hash);
    var queryHadAddress = url.searchParams.has("a");
    var previousHash = url.hash.charAt(0) === "#" ? url.hash.slice(1) : url.hash;
    url.searchParams.delete("a");
    if (!queryHadAddress && nextHash === previousHash) return;
    url.hash = nextHash;
    history.replaceState(history.state, "", url.pathname + url.search + url.hash);
  }

  function withAddress(href, address) {
    var url = new URL(href, location.origin);
    url.searchParams.delete("a");
    url.hash = "a=" + address;
    return url.pathname + url.search + url.hash;
  }

  var input = document.getElementById("direccion-token");
  if (input) {
    var fromFragment = fragmentAddress();
    if (!input.value && fromFragment) input.value = fromFragment;
    scrubAddress();
    document.querySelectorAll('a[href^="/aprender/"]').forEach(function (link) {
      link.addEventListener("click", function () {
        var value = String(input.value || "").trim();
        if (!BASE58.test(value)) return;
        link.setAttribute("href", withAddress(link.getAttribute("href") || "/aprender/", value));
      });
    });
    return;
  }

  var carried = fragmentAddress();
  scrubAddress();
  if (!carried) return;
  document.querySelectorAll('a[href="/verify/"], a[href^="/verify/?"]').forEach(function (link) {
    link.addEventListener("click", function () {
      link.setAttribute("href", withAddress(link.getAttribute("href") || "/verify/", carried));
    });
  });
})();
