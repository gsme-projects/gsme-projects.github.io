// Approved projects table: loaded from data/projects.json.
(function () {
  var table = document.getElementById("projects-table");
  var status = document.getElementById("projects-status");
  var filter = document.getElementById("project-filter");
  if (!table || !status) return;
  var tbody = table.querySelector("tbody");
  var rows = [];
  var loaded = false;

  function cell(tr, label, className) {
    var td = document.createElement("td");
    // Explicit role, because the card layout's display:block drops table semantics in Safari.
    td.setAttribute("role", "cell");
    td.setAttribute("data-label", label);
    if (className) td.className = className;
    tr.appendChild(td);
    return td;
  }

  function safeUrl(url) {
    url = typeof url === "string" ? url.trim() : "";
    return /^https?:\/\//i.test(url) ? url : "";
  }

  // Sets text, keeping short hyphenated words like "well-being" on one line. Longer
  // ones (slugs, URL fragments) are left free to wrap so they can't overflow a phone screen.
  function setText(el, text) {
    String(text || "").split(/([\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)+)/u).forEach(function (part, i) {
      if (!part) return;
      if (i % 2 && part.length <= 20) {
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

  // Researcher names as trimmed, non-empty strings; accepts a list or a single name.
  function researcherNames(p) {
    var names = Array.isArray(p.researchers) ? p.researchers : [p.researchers];
    return names
      .filter(function (name) { return typeof name === "string" && name.trim(); })
      .map(function (name) { return name.trim(); });
  }

  // `url` must already have passed safeUrl.
  function renderLink(td, url, label, title) {
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

  // Builds the table and returns the counts shown in the hero.
  function render(projects) {
    if (!Array.isArray(projects)) throw new Error("projects.json must be an array");
    var counts = { projects: 0, researchers: 0, preregistered: 0, papers: 0 };
    var people = {};
    projects.forEach(function (p, i) {
      if (!p || typeof p !== "object") {
        console.warn("Skipping invalid entry " + i + " in projects.json:", p);
        return;
      }
      var tr = document.createElement("tr");
      tr.setAttribute("role", "row");
      var names = researcherNames(p);
      var prereg = safeUrl(p.preregistration);
      var paper = safeUrl(p.paper);
      setText(cell(tr, "Project", "project-title"), p.title);
      renderPeople(cell(tr, "Researchers", "project-people"), names);
      setText(cell(tr, "Description"), p.description);
      renderLink(cell(tr, "Preregistration", "project-link"), prereg, "View preregistration", p.title);
      renderLink(cell(tr, "Paper", "project-link"), paper, "Read paper", p.title);

      tbody.appendChild(tr);
      rows.push({ tr: tr, text: [p.title, names.join(", "), p.description].join(" ").toLowerCase() });

      counts.projects++;
      names.forEach(function (name) { people[name.toLowerCase()] = true; });
      if (prereg) counts.preregistered++;
      if (paper) counts.papers++;
    });
    counts.researchers = Object.keys(people).length;
    loaded = true;
    table.hidden = false;
    applyFilter();
    return counts;
  }

  // Summary counts in the hero. A count of zero is hidden, and the whole list stays
  // hidden if the projects fail to load.
  function renderStats(values) {
    var stats = document.getElementById("hero-stats");
    if (!stats) return;
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
    .then(function (projects) {
      var counts = render(projects);
      // Kept apart from the load-failure handler below, so a problem with the counts
      // can't hide a table that loaded fine.
      try {
        renderStats(counts);
      } catch (err) {
        console.error(err);
      }
    })
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
