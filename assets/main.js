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

  // Sets text, keeping hyphenated words like "well-being" on one line.
  function setText(el, text) {
    String(text || "").split(/(\S*\w-\w\S*)/).forEach(function (part, i) {
      if (!part) return;
      if (i % 2) {
        var span = document.createElement("span");
        span.className = "nowrap";
        span.textContent = part;
        el.appendChild(span);
      } else {
        el.appendChild(document.createTextNode(part));
      }
    });
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

  function renderLink(td, url, label, title) {
    url = safeUrl(url);
    if (url) {
      var a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.textContent = label;
      // Extra context for screen readers; the name still starts with the visible text.
      if (title) {
        var context = document.createElement("span");
        context.className = "visually-hidden";
        context.textContent = " for " + title;
        a.appendChild(context);
      }
      td.appendChild(a);
    } else {
      var span = document.createElement("span");
      span.className = "muted";
      span.textContent = "Not yet available";
      td.appendChild(span);
    }
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
      setText(cell(tr, "Project", "project-title"), p.title);
      renderPeople(cell(tr, "Researchers", "project-people"), names);
      setText(cell(tr, "Description"), p.description);

      renderLink(cell(tr, "Preregistration", "project-link"), p.preregistration, "View preregistration", p.title);
      renderLink(cell(tr, "Paper", "project-link"), p.paper, "Read paper", p.title);

      tbody.appendChild(tr);
      rows.push({ tr: tr, text: [p.title, people, p.description].join(" ").toLowerCase() });
    });
    loaded = true;
    table.hidden = false;
    applyFilter();
    renderStats(projects);
  }

  // Summary counts in the hero; a count of zero is hidden, and the whole list stays
  // hidden if the projects fail to load.
  function renderStats(projects) {
    var stats = document.getElementById("hero-stats");
    if (!stats) return;
    var people = {};
    var preregistered = 0;
    var papers = 0;
    var valid = projects.filter(function (p) { return p && typeof p === "object"; });
    valid.forEach(function (p) {
      var names = Array.isArray(p.researchers) ? p.researchers : (p.researchers ? [p.researchers] : []);
      names.forEach(function (name) { people[String(name).trim().toLowerCase()] = true; });
      if (safeUrl(p.preregistration)) preregistered++;
      if (safeUrl(p.paper)) papers++;
    });
    var values = {
      projects: valid.length,
      researchers: Object.keys(people).length,
      preregistered: preregistered,
      papers: papers
    };
    var shown = 0;
    Array.prototype.forEach.call(stats.querySelectorAll("[data-stat]"), function (dd) {
      var value = values[dd.getAttribute("data-stat")];
      dd.textContent = value;
      dd.parentNode.hidden = !value;
      if (value) shown++;
    });
    stats.hidden = shown === 0;
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
