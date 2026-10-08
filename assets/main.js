// Approved projects table: loaded from data/projects.json.
(function () {
  var table = document.getElementById("projects-table");
  var status = document.getElementById("projects-status");
  var filter = document.getElementById("project-filter");
  if (!table) return;
  var tbody = table.querySelector("tbody");
  var rows = [];
  var loaded = false;

  function cell(tr, label, className) {
    var td = document.createElement("td");
    td.setAttribute("data-label", label);
    if (className) td.className = className;
    tr.appendChild(td);
    return td;
  }

  function safeUrl(url) {
    url = typeof url === "string" ? url.trim() : "";
    return /^https?:\/\//i.test(url) ? url : "";
  }

  // Lists names separated by commas, keeping each name on one line.
  function renderPeople(td, names) {
    names.forEach(function (name, i) {
      if (i > 0) td.appendChild(document.createTextNode(", "));
      var person = document.createElement("span");
      person.className = "person";
      person.textContent = name;
      td.appendChild(person);
    });
  }

  function render(projects) {
    if (!Array.isArray(projects)) throw new Error("projects.json must be an array");
    projects.forEach(function (p, i) {
      if (!p || typeof p !== "object") {
        console.warn("Skipping invalid entry " + i + " in projects.json:", p);
        return;
      }
      var tr = document.createElement("tr");
      var names = Array.isArray(p.researchers) ? p.researchers : (p.researchers ? [p.researchers] : []);
      var people = names.join(", ");
      cell(tr, "Project", "project-title").textContent = p.title || "";
      renderPeople(cell(tr, "Researchers", "project-people"), names);
      cell(tr, "Description").textContent = p.description || "";

      var prereg = cell(tr, "Preregistration", "project-prereg");
      var url = safeUrl(p.preregistration);
      if (url) {
        var a = document.createElement("a");
        a.href = url;
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = "View preregistration";
        // Extra context for screen readers; the name still starts with the visible text.
        if (p.title) {
          var context = document.createElement("span");
          context.className = "visually-hidden";
          context.textContent = " for " + p.title;
          a.appendChild(context);
        }
        prereg.appendChild(a);
      } else {
        var span = document.createElement("span");
        span.className = "muted";
        span.textContent = "Not yet available";
        prereg.appendChild(span);
      }

      tbody.appendChild(tr);
      rows.push({ tr: tr, text: [p.title, people, p.description].join(" ").toLowerCase() });
    });
    loaded = true;
    table.hidden = false;
    applyFilter();
  }

  // Also called after loading, so a query typed while the list loads still applies.
  function applyFilter() {
    if (!loaded) return;
    var q = filter ? filter.value.trim().toLowerCase() : "";
    rows.forEach(function (r) { r.tr.hidden = q !== "" && r.text.indexOf(q) === -1; });
    updateStatus();
  }

  function updateStatus() {
    var shown = rows.filter(function (r) { return !r.tr.hidden; }).length;
    var total = rows.length;
    if (total === 0) {
      status.textContent = "No projects have been listed yet.";
    } else if (shown === total) {
      status.textContent = total + (total === 1 ? " project" : " projects");
    } else if (shown === 0) {
      status.textContent = "No projects match your search. Try a different word, or clear the search to see all " + total + ".";
    } else {
      status.textContent = "Showing " + shown + " of " + total + " projects";
    }
  }

  if (filter) filter.addEventListener("input", applyFilter);

  fetch("data/projects.json", { cache: "no-cache" })
    .then(function (res) {
      if (!res.ok) throw new Error(res.status);
      return res.json();
    })
    .then(render)
    .catch(function (err) {
      console.error(err);
      loaded = false;
      rows = [];
      tbody.textContent = "";
      table.hidden = true;
      if (filter) filter.disabled = true;
      status.textContent = "The project list couldn't be loaded. Refresh the page, or email us for the list.";
    });
})();

// Decorative hero chart: a quantile dot plot of illustrative forecasts,
// with an empty marker for the visitor's own forecast.
(function () {
  var svg = document.getElementById("forecast-plot");
  if (!svg) return;

  var NS = "http://www.w3.org/2000/svg";
  var W = 360, H = 240;
  var left = 16, right = W - 16, baseline = 196;
  var n = 100, r = 5, d = 2 * r + 1;

  function el(name, attrs, text) {
    var node = document.createElementNS(NS, name);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    if (text) node.textContent = text;
    svg.appendChild(node);
    return node;
  }

  // Inverse normal CDF (Winitzki's erfinv approximation); accurate enough for a sketch.
  function qnorm(p) {
    var x = 2 * p - 1, a = 0.147;
    var ln = Math.log(1 - x * x);
    var t = 2 / (Math.PI * a) + ln / 2;
    return Math.SQRT2 * Math.sign(x) * Math.sqrt(Math.sqrt(t * t - ln / a) - t);
  }

  var lo = -1, hi = 1;
  function xScale(v) { return left + ((v - lo) / (hi - lo)) * (right - left); }

  var cols = {};
  for (var i = 0; i < n; i++) {
    var v = 0.12 + 0.25 * qnorm((i + 0.5) / n);
    var col = Math.round((xScale(v) - left) / d);
    cols[col] = (cols[col] || 0) + 1;
    el("circle", {
      class: "plot-dot",
      cx: left + col * d,
      cy: baseline - r - 2 - (cols[col] - 1) * d,
      r: r
    });
  }

  el("line", { class: "plot-axis", x1: left - 6, x2: right + 6, y1: baseline, y2: baseline });
  [[-1, "−1"], [0, "0"], [1, "1"]].forEach(function (t) {
    var x = xScale(t[0]);
    el("line", { class: "plot-axis", x1: x, x2: x, y1: baseline, y2: baseline + 5 });
    el("text", { class: "plot-label", x: x, y: baseline + 18, "text-anchor": "middle" }, t[1]);
  });
  el("text", { class: "plot-label", x: W / 2, y: H - 4, "text-anchor": "middle" },
    "Predicted effect of reducing social media use");

  var youX = xScale(-0.72);
  el("line", { class: "plot-you", x1: youX, x2: youX, y1: 46, y2: baseline });
  el("circle", { class: "plot-you-dot", cx: youX, cy: baseline - r - 2, r: r });
  el("text", { class: "plot-you-label", x: youX, y: 36, "text-anchor": "middle" }, "Your forecast?");
})();
