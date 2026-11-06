/* Mini Yellow Pages: neighborhood directory & emergency-prep organizer.
   All data lives in this browser's localStorage. Use Settings → Export to back up. */
(() => {
  "use strict";

  const STORE_KEY = "myp:data:v1";
  const GOBAG_KEY = "myp:gobag:v1";
  const PRINT_KEY = "myp:print:v1";
  const SHARE_FIELDS = [
    ["phone", "Phone"],
    ["email", "Email"],
    ["occupation", "Occupation"],
    ["skills", "Skills"],
    ["resources", "Equipment & resources"],
    ["needs", "Special needs & pets (shared with pod & responders)"],
  ];

  // ---------- utilities ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const today = () => new Date().toISOString().slice(0, 10);
  const splitList = (s) => String(s || "").split(",").map((x) => x.trim()).filter(Boolean);
  const uniq = (arr) => [...new Set(arr)];
  const fmtDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso + (iso.length === 10 ? "T12:00:00" : ""));
    return isNaN(d) ? iso : d.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
  };

  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(() => t.classList.remove("show"), 2600);
  }

  function safeGet(key) {
    try { return localStorage.getItem(key); } catch { return null; }
  }
  function safeSet(key, val) {
    try { localStorage.setItem(key, val); return true; } catch { return false; }
  }

  // ---------- state ----------
  function blankState() {
    return {
      version: 1,
      settings: {
        name: "",
        organizer: "",
        organizerContact: "",
        meetingPoint: "",
        podSize: 5,
        numbers: DEFAULT_NUMBERS.map((n) => ({ ...n })),
      },
      households: [],
      pods: [],
    };
  }

  function normalizeHousehold(h) {
    const share = Object.fromEntries(SHARE_FIELDS.map(([k]) => [k, true]));
    return {
      id: h.id || uid(),
      names: h.names || "",
      address: h.address || "",
      unit: h.unit || "",
      phone: h.phone || "",
      phone2: h.phone2 || "",
      email: h.email || "",
      household: h.household || "",
      occupation: h.occupation || "",
      skills: Array.isArray(h.skills) ? h.skills : splitList(h.skills),
      resources: Array.isArray(h.resources) ? h.resources : splitList(h.resources),
      needs: h.needs || "",
      pets: h.pets || "",
      notes: h.notes || "",
      consent: {
        given: !!h.consent?.given,
        date: h.consent?.date || "",
        signedBy: h.consent?.signedBy || "",
        share: { ...share, ...(h.consent?.share || {}) },
      },
      podId: h.podId || null,
      updatedAt: h.updatedAt || new Date().toISOString(),
    };
  }

  function load() {
    const raw = safeGet(STORE_KEY);
    if (!raw) return blankState();
    try {
      return migrate(JSON.parse(raw));
    } catch {
      return blankState();
    }
  }

  function migrate(data) {
    const base = blankState();
    const s = { ...base, ...data };
    s.settings = { ...base.settings, ...(data.settings || {}) };
    if (!Array.isArray(s.settings.numbers)) s.settings.numbers = base.settings.numbers;
    s.households = (data.households || []).map(normalizeHousehold);
    s.pods = (data.pods || []).map((p) => ({ id: p.id || uid(), name: p.name || "", captainId: p.captainId || null }));
    // drop dangling pod references
    const podIds = new Set(s.pods.map((p) => p.id));
    s.households.forEach((h) => { if (h.podId && !podIds.has(h.podId)) h.podId = null; });
    return s;
  }

  let state = load();
  function save() {
    if (!safeSet(STORE_KEY, JSON.stringify(state))) {
      toast("Couldn't save. Browser storage is unavailable. Export a backup!");
    }
  }

  // ---------- address helpers ----------
  function parseAddress(addr) {
    const m = String(addr || "").trim().match(/^(\d+)\s*[-A-Za-z]?\s+(.*)$/);
    if (!m) return { num: Infinity, street: String(addr || "").trim().toLowerCase() };
    return { num: parseInt(m[1], 10), street: m[2].trim().toLowerCase().replace(/\./g, "") };
  }
  function byAddress(a, b) {
    const pa = parseAddress(a.address), pb = parseAddress(b.address);
    return pa.street.localeCompare(pb.street) || pa.num - pb.num || (a.unit || "").localeCompare(b.unit || "");
  }
  function byName(a, b) { return a.names.localeCompare(b.names, undefined, { sensitivity: "base" }); }
  const fullAddress = (h) => h.address + (h.unit ? `, ${h.unit}` : "");

  // ---------- routing ----------
  const routes = { directory: renderDirectory, pods: renderPods, prepare: renderPrepare, print: renderPrint, settings: renderSettings };
  function currentRoute() {
    const r = location.hash.replace(/^#\/?/, "").split("/")[0];
    return routes[r] ? r : "directory";
  }
  function render() {
    const r = currentRoute();
    $$("#tabs a").forEach((a) => a.classList.toggle("active", a.dataset.route === r));
    $("#hood-name").textContent = state.settings.name || "Your neighborhood";
    document.title = (state.settings.name ? state.settings.name + " · " : "") + "Mini Yellow Pages";
    routes[r]();
  }
  window.addEventListener("hashchange", () => { render(); window.scrollTo(0, 0); });

  // ---------- Directory ----------
  const dirUI = { q: "", skill: "", show: "all", sort: "address" };

  function renderDirectory() {
    const hs = state.households;
    const allSkills = uniq(hs.flatMap((h) => [...h.skills, ...h.resources])).sort();
    if (dirUI.skill && !allSkills.includes(dirUI.skill)) dirUI.skill = "";
    const consented = hs.filter((h) => h.consent.given).length;

    $("#view").innerHTML = `
      <section class="page-head">
        <div>
          <h1>Directory</h1>
          <p class="muted">${hs.length} household${hs.length === 1 ? "" : "s"} · ${consented} consented to be listed</p>
        </div>
        <div class="btn-row">
          <label class="btn" title="Restore a .json backup, or add/update households from a .csv spreadsheet">Import…<input type="file" class="import-file" accept=".csv,.json,text/csv,application/json" hidden></label>
          ${hs.length ? `<button class="btn" data-act="export-csv">Export .csv</button>
          <button class="btn" data-act="export-json">Export backup .json</button>` : ""}
          <button class="btn primary" data-act="add">+ Add household</button>
        </div>
      </section>
      ${hs.length === 0 ? emptyDirectory() : `
      <section class="toolbar">
        <input type="search" id="q" placeholder="Search names, streets, skills…" value="${esc(dirUI.q)}" aria-label="Search">
        <select id="skill" aria-label="Filter by skill or resource">
          <option value="">All skills &amp; resources</option>
          ${allSkills.map((s) => `<option ${s === dirUI.skill ? "selected" : ""}>${esc(s)}</option>`).join("")}
        </select>
        <select id="show" aria-label="Filter by consent">
          <option value="all" ${dirUI.show === "all" ? "selected" : ""}>Everyone</option>
          <option value="yes" ${dirUI.show === "yes" ? "selected" : ""}>Consented</option>
          <option value="no" ${dirUI.show === "no" ? "selected" : ""}>Needs consent</option>
        </select>
        <select id="sort" aria-label="Sort">
          <option value="address" ${dirUI.sort === "address" ? "selected" : ""}>Sort by street</option>
          <option value="name" ${dirUI.sort === "name" ? "selected" : ""}>Sort by name</option>
        </select>
      </section>
      <section class="cards" id="cards"></section>`}
    `;
    if (hs.length) {
      drawCards();
      $("#q").addEventListener("input", (e) => { dirUI.q = e.target.value; drawCards(); });
      $("#skill").addEventListener("change", (e) => { dirUI.skill = e.target.value; drawCards(); });
      $("#show").addEventListener("change", (e) => { dirUI.show = e.target.value; drawCards(); });
      $("#sort").addEventListener("change", (e) => { dirUI.sort = e.target.value; drawCards(); });
    }
  }

  function emptyDirectory() {
    return `
      <div class="empty">
        <h2>Start your neighborhood directory</h2>
        <ol>
          <li>Go to <a href="#/print">Print</a> and print blank <strong>sign-up &amp; consent forms</strong> to take door to door.</li>
          <li>Enter each returned form here with <strong>+ Add household</strong>.</li>
          <li>Group households into check-in <a href="#/pods">pods</a> of about 5.</li>
          <li>Print the finished booklet for every household that took part.</li>
        </ol>
        <p>Already have data? Use <strong>Import…</strong> above to restore a <code>.json</code> backup or load a <code>.csv</code> spreadsheet you exported earlier.</p>
        <p><button class="btn" data-act="sample">Load 12 sample neighbors to try it out</button></p>
      </div>`;
  }

  function matches(h) {
    if (dirUI.show === "yes" && !h.consent.given) return false;
    if (dirUI.show === "no" && h.consent.given) return false;
    if (dirUI.skill && !h.skills.includes(dirUI.skill) && !h.resources.includes(dirUI.skill)) return false;
    const q = dirUI.q.trim().toLowerCase();
    if (!q) return true;
    return [h.names, h.address, h.unit, h.occupation, h.phone, h.email, ...h.skills, ...h.resources]
      .join(" ").toLowerCase().includes(q);
  }

  function drawCards() {
    const list = state.households.filter(matches).sort(dirUI.sort === "name" ? byName : byAddress);
    const podName = (id) => state.pods.find((p) => p.id === id)?.name;
    $("#cards").innerHTML = list.length ? list.map((h) => `
      <article class="card ${h.consent.given ? "" : "pending"}">
        <header>
          <div>
            <h3>${esc(h.names) || "<em>Unnamed</em>"}</h3>
            <div class="addr">${esc(fullAddress(h))}</div>
          </div>
          <button class="btn small" data-act="edit" data-id="${h.id}">Edit</button>
        </header>
        <dl>
          ${h.phone ? `<dt>Phone</dt><dd><a href="tel:${esc(h.phone)}">${esc(h.phone)}</a>${h.phone2 ? ` · <a href="tel:${esc(h.phone2)}">${esc(h.phone2)}</a>` : ""}</dd>` : ""}
          ${h.email ? `<dt>Email</dt><dd><a href="mailto:${esc(h.email)}">${esc(h.email)}</a></dd>` : ""}
          ${h.occupation ? `<dt>Work</dt><dd>${esc(h.occupation)}</dd>` : ""}
          ${h.needs ? `<dt>Needs</dt><dd class="needs">${esc(h.needs)}</dd>` : ""}
          ${h.pets ? `<dt>Pets</dt><dd>${esc(h.pets)}</dd>` : ""}
        </dl>
        ${h.skills.length || h.resources.length ? `<div class="tags">
          ${h.skills.map((s) => `<span class="tag">${esc(s)}</span>`).join("")}
          ${h.resources.map((s) => `<span class="tag res">${esc(s)}</span>`).join("")}
        </div>` : ""}
        <footer>
          ${h.consent.given
            ? `<span class="badge ok">Consented${h.consent.date ? " " + esc(fmtDate(h.consent.date)) : ""}</span>`
            : `<span class="badge warn">No consent yet. Won't be printed</span>`}
          ${h.podId ? `<span class="badge">${esc(podName(h.podId) || "Pod")}</span>` : ""}
        </footer>
      </article>`).join("") : `<p class="muted">No households match.</p>`;
  }

  // ---------- Household editor ----------
  function chipGroup(name, suggestions, selected) {
    const all = uniq([...suggestions, ...selected]);
    return `<div class="chips">${all.map((s) => `
      <label class="chip"><input type="checkbox" name="${name}" value="${esc(s)}" ${selected.includes(s) ? "checked" : ""}><span>${esc(s)}</span></label>`).join("")}
    </div>`;
  }

  function openEditor(id) {
    const existing = state.households.find((h) => h.id === id);
    const h = normalizeHousehold(existing || {});
    const dlg = $("#editor");
    dlg.innerHTML = `
      <form method="dialog" id="hh-form">
        <header class="dlg-head">
          <h2>${existing ? "Edit household" : "Add household"}</h2>
          <button type="button" class="icon-btn" data-close aria-label="Close">✕</button>
        </header>
        <div class="dlg-body">
          <fieldset>
            <legend>Who &amp; where</legend>
            <label class="wide">Name(s) as they should appear<input name="names" required value="${esc(h.names)}" placeholder="e.g. Maria & Tom Alvarez"></label>
            <label>Street address<input name="address" required value="${esc(h.address)}" placeholder="112 Oak St"></label>
            <label>Unit / apt<input name="unit" value="${esc(h.unit)}"></label>
            <label>Phone<input name="phone" type="tel" value="${esc(h.phone)}"></label>
            <label>Second phone<input name="phone2" type="tel" value="${esc(h.phone2)}"></label>
            <label>Email<input name="email" type="email" value="${esc(h.email)}"></label>
            <label>Occupation(s)<input name="occupation" value="${esc(h.occupation)}"></label>
            <label class="wide">Household members<input name="household" value="${esc(h.household)}" placeholder="e.g. 2 adults, 2 kids (ages 4, 7)"></label>
          </fieldset>
          <fieldset>
            <legend>Skills they can offer in an emergency</legend>
            ${chipGroup("skills", SKILL_SUGGESTIONS, h.skills)}
            <label class="wide">Other skills (comma-separated)<input name="skillsOther" placeholder="e.g. Beekeeper, Arabic"></label>
          </fieldset>
          <fieldset>
            <legend>Equipment &amp; resources they could share</legend>
            ${chipGroup("resources", RESOURCE_SUGGESTIONS, h.resources)}
            <label class="wide">Other resources (comma-separated)<input name="resourcesOther"></label>
          </fieldset>
          <fieldset>
            <legend>Check-on-me info</legend>
            <label class="wide">Special needs<textarea name="needs" rows="2" placeholder="${esc(NEEDS_HINT)}">${esc(h.needs)}</textarea></label>
            <label class="wide">Pets<input name="pets" value="${esc(h.pets)}" placeholder="e.g. 2 dogs, 1 cat"></label>
          </fieldset>
          <fieldset class="consent">
            <legend>Consent</legend>
            <label class="check wide"><input type="checkbox" name="consentGiven" ${h.consent.given ? "checked" : ""}>
              <span><strong>This household agreed to be listed</strong> in the printed directory and assigned to a pod.</span></label>
            <label>Date of consent<input type="date" name="consentDate" value="${esc(h.consent.date || (existing ? "" : today()))}"></label>
            <label>Given by<input name="signedBy" value="${esc(h.consent.signedBy)}" placeholder="Who signed / said yes"></label>
            <div class="wide">
              <p class="hint">Name and address are always printed for consenting households. Uncheck anything they <em>don't</em> want printed:</p>
              <div class="share-grid">
                ${SHARE_FIELDS.map(([k, label]) => `<label class="check"><input type="checkbox" name="share_${k}" ${h.consent.share[k] ? "checked" : ""}><span>${label}</span></label>`).join("")}
              </div>
            </div>
          </fieldset>
          <fieldset>
            <legend>Organizer notes (never printed)</legend>
            <label class="wide"><textarea name="notes" rows="2">${esc(h.notes)}</textarea></label>
          </fieldset>
        </div>
        <footer class="dlg-foot">
          ${existing ? `<button type="button" class="btn danger" data-del>Delete</button>` : "<span></span>"}
          <div>
            <button type="button" class="btn" data-close>Cancel</button>
            <button type="submit" class="btn primary">Save</button>
          </div>
        </footer>
      </form>`;

    const form = $("#hh-form", dlg);
    $$("[data-close]", dlg).forEach((b) => b.addEventListener("click", () => dlg.close()));
    $("[data-del]", dlg)?.addEventListener("click", () => {
      if (!confirm(`Delete ${h.names || "this household"}? This can't be undone.`)) return;
      state.households = state.households.filter((x) => x.id !== h.id);
      state.pods.forEach((p) => { if (p.captainId === h.id) p.captainId = null; });
      save(); dlg.close(); render(); toast("Household deleted");
    });
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(form);
      const get = (k) => (fd.get(k) || "").toString().trim();
      const updated = normalizeHousehold({
        ...h,
        names: get("names"),
        address: get("address"),
        unit: get("unit"),
        phone: get("phone"),
        phone2: get("phone2"),
        email: get("email"),
        occupation: get("occupation"),
        household: get("household"),
        skills: uniq([...fd.getAll("skills"), ...splitList(get("skillsOther"))]),
        resources: uniq([...fd.getAll("resources"), ...splitList(get("resourcesOther"))]),
        needs: get("needs"),
        pets: get("pets"),
        notes: get("notes"),
        consent: {
          given: fd.has("consentGiven"),
          date: get("consentDate"),
          signedBy: get("signedBy"),
          share: Object.fromEntries(SHARE_FIELDS.map(([k]) => [k, fd.has("share_" + k)])),
        },
        updatedAt: new Date().toISOString(),
      });
      if (!updated.consent.given) updated.podId = null;
      if (existing) Object.assign(existing, updated);
      else state.households.push(updated);
      save(); dlg.close(); render();
      toast(existing ? "Saved" : "Household added");
    });
    dlg.showModal();
    $("input[name=names]", dlg).focus();
  }

  // ---------- Pods ----------
  function autoAssignPods() {
    const size = Math.max(2, Math.min(12, parseInt(state.settings.podSize, 10) || 5));
    const list = state.households.filter((h) => h.consent.given).sort(byAddress);
    if (!list.length) return 0;
    const count = Math.max(1, Math.ceil(list.length / size)); // no pod larger than the chosen size
    // Keep any existing pod names/captains where possible
    const pods = [];
    for (let i = 0; i < count; i++) {
      pods.push(state.pods[i] ? { ...state.pods[i], captainId: null } : { id: uid(), name: "", captainId: null });
    }
    state.households.forEach((h) => (h.podId = null));
    // Distribute contiguous runs of neighbors as evenly as possible
    let idx = 0;
    pods.forEach((p, i) => {
      const n = Math.floor(list.length / count) + (i < list.length % count ? 1 : 0);
      const members = list.slice(idx, idx + n);
      idx += n;
      members.forEach((h) => (h.podId = p.id));
      if (!p.name) {
        const streets = uniq(members.map((h) => h.address.replace(/^\s*\d+\S*\s*/, "")));
        p.name = `Pod ${i + 1}` + (streets.length ? ` · ${streets.slice(0, 2).join(" / ")}` : "");
      }
      // Default captain: first member without listed special needs (organizer can change it)
      p.captainId = (members.find((h) => !h.needs) || members[0])?.id || null;
    });
    state.pods = pods;
    return count;
  }

  function renderPods() {
    const consented = state.households.filter((h) => h.consent.given);
    const notConsented = state.households.length - consented.length;
    const unassigned = consented.filter((h) => !h.podId).sort(byAddress);
    const podOptions = (sel) => `<option value="">Unassigned</option>` +
      state.pods.map((p, i) => `<option value="${p.id}" ${p.id === sel ? "selected" : ""}>${esc(p.name || `Pod ${i + 1}`)}</option>`).join("");

    $("#view").innerHTML = `
      <section class="page-head">
        <div>
          <h1>Check-in pods</h1>
          <p class="muted">After an emergency, each household checks on the others in its pod, and they check on you.
          Pods are built from nearby addresses. Only households that consented are included${notConsented ? ` (${notConsented} waiting on consent)` : ""}.</p>
        </div>
      </section>
      <section class="toolbar">
        <label class="inline">Households per pod
          <input type="number" id="pod-size" min="2" max="12" value="${esc(state.settings.podSize)}">
        </label>
        <button class="btn primary" data-act="auto-pods" ${consented.length ? "" : "disabled"}>Auto-assign by address</button>
        <button class="btn" data-act="add-pod">+ Empty pod</button>
      </section>
      ${consented.length === 0 ? `<div class="empty"><p>No consenting households yet. Add households in the <a href="#/directory">Directory</a> first.</p></div>` : ""}
      <section class="pods">
        ${state.pods.map((p, i) => {
          const members = consented.filter((h) => h.podId === p.id).sort(byAddress);
          return `
          <article class="pod" data-pod="${p.id}">
            <header>
              <input class="pod-name" data-pod-name="${p.id}" value="${esc(p.name)}" placeholder="Pod ${i + 1}" aria-label="Pod name">
              <button class="icon-btn" data-act="del-pod" data-id="${p.id}" title="Remove pod" aria-label="Remove pod">✕</button>
            </header>
            <label class="inline small">Captain
              <select data-captain="${p.id}">
                <option value="">None</option>
                ${members.map((h) => `<option value="${h.id}" ${h.id === p.captainId ? "selected" : ""}>${esc(h.names)}</option>`).join("")}
              </select>
            </label>
            <ul class="members">
              ${members.map((h) => `
                <li>
                  <div>
                    <strong>${esc(h.names)}</strong>${h.id === p.captainId ? ' <span class="badge">Captain</span>' : ""}
                    <div class="muted small">${esc(fullAddress(h))}${h.phone ? " · " + esc(h.phone) : ""}</div>
                    ${h.needs ? `<div class="needs small">⚠ ${esc(h.needs)}</div>` : ""}
                  </div>
                  <select data-move="${h.id}" aria-label="Move to pod">${podOptions(p.id)}</select>
                </li>`).join("") || `<li class="muted">No members yet</li>`}
            </ul>
            <footer class="muted small">${members.length} household${members.length === 1 ? "" : "s"}</footer>
          </article>`;
        }).join("")}
      </section>
      ${unassigned.length ? `
      <section>
        <h2>Not in a pod yet</h2>
        <ul class="members flat">
          ${unassigned.map((h) => `<li><div><strong>${esc(h.names)}</strong><div class="muted small">${esc(fullAddress(h))}</div></div>
            <select data-move="${h.id}" aria-label="Assign to pod">${podOptions(null)}</select></li>`).join("")}
        </ul>
      </section>` : ""}
    `;

    $("#pod-size").addEventListener("change", (e) => {
      state.settings.podSize = Math.max(2, Math.min(12, parseInt(e.target.value, 10) || 5));
      save();
    });
    $$("[data-pod-name]").forEach((inp) => inp.addEventListener("change", (e) => {
      const p = state.pods.find((x) => x.id === inp.dataset.podName);
      p.name = e.target.value.trim(); save();
    }));
    $$("[data-captain]").forEach((sel) => sel.addEventListener("change", (e) => {
      const p = state.pods.find((x) => x.id === sel.dataset.captain);
      p.captainId = e.target.value || null; save(); renderPods();
    }));
    $$("[data-move]").forEach((sel) => sel.addEventListener("change", (e) => {
      const h = state.households.find((x) => x.id === sel.dataset.move);
      const old = h.podId;
      h.podId = e.target.value || null;
      state.pods.forEach((p) => { if (p.id === old && p.captainId === h.id) p.captainId = null; });
      save(); renderPods();
    }));
  }

  // ---------- Prepare ----------
  function loadGobag() { try { return JSON.parse(safeGet(GOBAG_KEY) || "{}"); } catch { return {}; } }

  function guideHTML(g) {
    return `
      <article class="guide" id="guide-${g.id}">
        <h2>${esc(g.title)}</h2>
        <p class="lead">${esc(g.summary)}</p>
        ${g.sections.map((s) => `
          <div class="guide-sec ${s.warn ? "warn" : ""}">
            <h3>${esc(s.heading)}</h3>
            ${s.steps ? `<ol>${s.steps.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : ""}
            ${s.text ? `<p>${esc(s.text)}</p>` : ""}
          </div>`).join("")}
      </article>`;
  }

  function numbersHTML() {
    const nums = state.settings.numbers.filter((n) => n.label && n.number);
    const s = state.settings;
    return `
      <table class="numbers">
        ${nums.map((n) => `<tr><th>${esc(n.label)}</th><td>${esc(n.number)}</td></tr>`).join("")}
        ${s.organizer ? `<tr><th>Neighborhood organizer: ${esc(s.organizer)}</th><td>${esc(s.organizerContact)}</td></tr>` : ""}
        ${s.meetingPoint ? `<tr><th>Neighborhood meeting point</th><td>${esc(s.meetingPoint)}</td></tr>` : ""}
      </table>`;
  }

  function renderPrepare() {
    const checks = loadGobag();
    const total = GO_BAG.reduce((n, g) => n + g.items.length, 0);
    const done = Object.values(checks).filter(Boolean).length;
    $("#view").innerHTML = `
      <section class="page-head">
        <div>
          <h1>Prepare</h1>
          <p class="muted">Quick guides for the first hours of an emergency. These are general guidelines. Always follow instructions from local officials and your utilities.</p>
        </div>
      </section>
      <nav class="guide-nav">
        <a href="#/prepare" data-jump="numbers">Important numbers</a>
        <a href="#/prepare" data-jump="gobag">Go bag</a>
        ${GUIDES.map((g) => `<a href="#/prepare" data-jump="guide-${g.id}">${esc(g.title)}</a>`).join("")}
      </nav>
      <article class="guide" id="numbers">
        <h2>Important numbers</h2>
        ${numbersHTML()}
        <p class="muted small">Fill in your local utility numbers and meeting point under <a href="#/settings">Settings</a>.</p>
      </article>
      <article class="guide" id="gobag">
        <h2>Pack a go bag</h2>
        <p class="lead">One bag per person, ready to grab in 5 minutes. Check items off as you pack them (saved on this device).</p>
        <div class="progress" aria-label="Go bag progress"><span style="width:${total ? (done / total) * 100 : 0}%"></span></div>
        <p class="muted small" id="gobag-count">${done} of ${total} packed</p>
        <div class="gobag">
          ${GO_BAG.map((g, gi) => `
            <div>
              <h3>${esc(g.group)}</h3>
              ${g.items.map((it, ii) => {
                const key = `${gi}.${ii}`;
                return `<label class="check"><input type="checkbox" data-gobag="${key}" ${checks[key] ? "checked" : ""}><span>${esc(it)}</span></label>`;
              }).join("")}
            </div>`).join("")}
        </div>
        <p><button class="btn small" data-act="reset-gobag">Clear checklist</button></p>
      </article>
      ${GUIDES.map(guideHTML).join("")}
    `;
    $$("[data-jump]").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      document.getElementById(a.dataset.jump)?.scrollIntoView({ behavior: "smooth" });
    }));
    $$("[data-gobag]").forEach((cb) => cb.addEventListener("change", () => {
      const c = loadGobag();
      c[cb.dataset.gobag] = cb.checked;
      safeSet(GOBAG_KEY, JSON.stringify(c));
      const n = Object.values(c).filter(Boolean).length;
      $("#gobag-count").textContent = `${n} of ${total} packed`;
      $(".progress span").style.width = `${(n / total) * 100}%`;
    }));
  }

  // ---------- Print ----------
  const PRINT_PARTS = [
    ["cover", "Cover & important numbers", true],
    ["directory", "Directory listings", true],
    ["index", "Skills & resources index", true],
    ["pods", "Pod assignments", true],
    ["guides", "Emergency guides", true],
    ["gobag", "Go-bag checklist", true],
    ["signs", "OK / HELP window signs", false],
    ["forms", "Blank sign-up & consent forms", false],
  ];
  function loadPrintPrefs() {
    let p = {};
    try { p = JSON.parse(safeGet(PRINT_KEY) || "{}"); } catch { /* ignore */ }
    const parts = Object.fromEntries(PRINT_PARTS.map(([k, , d]) => [k, p.parts?.[k] ?? d]));
    return { parts, sort: p.sort || "address", forms: p.forms || 2 };
  }

  // What may be printed about a household, honoring their share choices
  function printable(h) {
    const s = h.consent.share;
    return {
      ...h,
      phone: s.phone ? h.phone : "",
      phone2: s.phone ? h.phone2 : "",
      email: s.email ? h.email : "",
      occupation: s.occupation ? h.occupation : "",
      skills: s.skills ? h.skills : [],
      resources: s.resources ? h.resources : [],
      needs: s.needs ? h.needs : "",
      pets: s.needs ? h.pets : "",
    };
  }

  function renderPrint() {
    const prefs = loadPrintPrefs();
    $("#view").innerHTML = `
      <section class="page-head no-print">
        <div>
          <h1>Print the booklet</h1>
          <p class="muted">Only households that consented are included, and only the fields they agreed to share.
          Organizer notes are never printed. Tip: in the print dialog, turn off "headers and footers" and print double-sided.</p>
        </div>
        <button class="btn primary" data-act="print">Print…</button>
      </section>
      <section class="print-opts no-print">
        ${PRINT_PARTS.map(([k, label]) => `<label class="check"><input type="checkbox" data-part="${k}" ${prefs.parts[k] ? "checked" : ""}><span>${label}</span></label>`).join("")}
        <label class="inline">Directory order
          <select id="p-sort">
            <option value="address" ${prefs.sort === "address" ? "selected" : ""}>By street</option>
            <option value="name" ${prefs.sort === "name" ? "selected" : ""}>By name</option>
          </select>
        </label>
        <label class="inline">Blank forms <input type="number" id="p-forms" min="1" max="20" value="${prefs.forms}"></label>
      </section>
      <div class="booklet" id="booklet">${bookletHTML(prefs)}</div>
    `;
    const update = () => {
      const p = {
        parts: Object.fromEntries($$("[data-part]").map((c) => [c.dataset.part, c.checked])),
        sort: $("#p-sort").value,
        forms: Math.max(1, Math.min(20, parseInt($("#p-forms").value, 10) || 1)),
      };
      safeSet(PRINT_KEY, JSON.stringify(p));
      $("#booklet").innerHTML = bookletHTML(p);
    };
    $$(".print-opts input, .print-opts select").forEach((el) => el.addEventListener("change", update));
  }

  function bookletHTML(prefs) {
    const s = state.settings;
    const hood = s.name || "Our Neighborhood";
    const list = state.households.filter((h) => h.consent.given).map(printable)
      .sort(prefs.sort === "name" ? byName : byAddress);
    const out = [];
    const P = prefs.parts;

    if (P.cover) out.push(`
      <section class="sheet cover">
        <div class="cover-mark">Mini<br>Yellow<br>Pages</div>
        <h1>${esc(hood)}</h1>
        <p class="cover-sub">Neighborhood directory &amp; emergency guide</p>
        <p class="cover-date">Updated ${esc(fmtDate(today()))} · ${list.length} households</p>
        <div class="cover-numbers">
          <h2>Important numbers</h2>
          ${numbersHTML()}
        </div>
        <p class="confidential">Private: for participating neighbors only. Please don't post online or share outside the neighborhood.
        ${s.organizer ? `To update or remove your listing, contact ${esc(s.organizer)}${s.organizerContact ? ` (${esc(s.organizerContact)})` : ""}.` : ""}</p>
      </section>`);

    if (P.directory) {
      let lastStreet = null;
      out.push(`
      <section class="sheet">
        <h2 class="sheet-title">Directory</h2>
        <div class="listing">
          ${list.length ? list.map((h) => {
            let head = "";
            if (prefs.sort === "address") {
              const st = parseAddress(h.address).street;
              if (st !== lastStreet) {
                lastStreet = st;
                head = `<h3 class="street">${esc(h.address.replace(/^\s*\d+\S*\s*/, "") || "Other")}</h3>`;
              }
            }
            const podName = state.pods.find((p) => p.id === h.podId)?.name;
            return `${head}
            <div class="entry">
              <div class="entry-top"><strong>${esc(h.names)}</strong><span class="dots"></span><span>${esc(h.phone)}</span></div>
              <div>${esc(fullAddress(h))}${h.phone2 ? ` · ${esc(h.phone2)}` : ""}${h.email ? ` · ${esc(h.email)}` : ""}</div>
              ${h.occupation ? `<div><em>${esc(h.occupation)}</em></div>` : ""}
              ${h.skills.length ? `<div><b>Skills:</b> ${esc(h.skills.join(", "))}</div>` : ""}
              ${h.resources.length ? `<div><b>Has:</b> ${esc(h.resources.join(", "))}</div>` : ""}
              ${h.needs ? `<div class="needs">⚠ ${esc(h.needs)}</div>` : ""}
              ${h.pets ? `<div><b>Pets:</b> ${esc(h.pets)}</div>` : ""}
              ${podName ? `<div class="small muted">${esc(podName)}</div>` : ""}
            </div>`;
          }).join("") : `<p>No consenting households yet.</p>`}
        </div>
      </section>`);
    }

    if (P.index) {
      const idx = (key) => {
        const m = new Map();
        list.forEach((h) => h[key].forEach((k) => { if (!m.has(k)) m.set(k, []); m.get(k).push(h); }));
        return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
      };
      const block = (title, entries) => `
        <h3>${title}</h3>
        ${entries.length ? `<dl class="index">${entries.map(([k, hs]) => `
          <dt>${esc(k)}</dt>
          <dd>${hs.map((h) => `${esc(h.names)} <span class="muted">(${esc(fullAddress(h))}${h.phone ? ", " + esc(h.phone) : ""})</span>`).join("<br>")}</dd>`).join("")}</dl>`
        : `<p class="muted">None listed.</p>`}`;
      out.push(`
      <section class="sheet">
        <h2 class="sheet-title">Who can help: skills &amp; resources</h2>
        <div class="two-col">
          <div>${block("Skills", idx("skills"))}</div>
          <div>${block("Equipment &amp; resources", idx("resources"))}</div>
        </div>
      </section>`);
    }

    if (P.pods) {
      const pods = state.pods.map((p, i) => ({ p, i, members: list.filter((h) => h.podId === p.id).sort(byAddress) }))
        .filter((x) => x.members.length);
      out.push(`
      <section class="sheet">
        <h2 class="sheet-title">Check-in pods</h2>
        <p>After an emergency, check on every household in your pod within the first hour, starting with anyone marked ⚠.
        Captains report to ${s.meetingPoint ? `the meeting point: <strong>${esc(s.meetingPoint)}</strong>` : "the neighborhood organizer"}.</p>
        <div class="pod-grid">
          ${pods.length ? pods.map(({ p, i, members }) => `
            <div class="pod-print">
              <h3>${esc(p.name || `Pod ${i + 1}`)}</h3>
              <table>
                ${members.map((h) => `<tr>
                  <td class="box">☐</td>
                  <td><strong>${esc(h.names)}</strong>${h.id === p.captainId ? " ★" : ""}<br><span class="small">${esc(fullAddress(h))}</span>
                  ${h.needs ? `<br><span class="needs small">⚠ ${esc(h.needs)}</span>` : ""}</td>
                  <td class="small">${esc(h.phone)}</td></tr>`).join("")}
              </table>
            </div>`).join("") : `<p class="muted">Pods haven't been assigned yet.</p>`}
        </div>
        ${pods.length ? `<p class="small muted">★ = pod captain · ☐ = tick off once you've reached them</p>` : ""}
      </section>`);
    }

    if (P.guides) out.push(`<section class="sheet guides-print"><h2 class="sheet-title">Emergency guides</h2>${GUIDES.map(guideHTML).join("")}</section>`);

    if (P.gobag) out.push(`
      <section class="sheet">
        <h2 class="sheet-title">Go-bag checklist</h2>
        <p>One bag per person, ready to grab in 5 minutes. Check it every 6 months and rotate food, water, and medications.</p>
        <div class="gobag print-gobag">
          ${GO_BAG.map((g) => `<div><h3>${esc(g.group)}</h3>${g.items.map((it) => `<div class="pcheck">☐ ${esc(it)}</div>`).join("")}</div>`).join("")}
        </div>
      </section>`);

    if (P.signs) out.push(`
      <section class="sheet sign ok-sign"><div>OK</div><p>We are OK. No help needed.</p></section>
      <section class="sheet sign help-sign"><div>HELP</div><p>We need help. Please check on us.</p></section>`);

    if (P.forms) {
      const form = signupFormHTML();
      for (let i = 0; i < (prefs.forms || 1); i++) out.push(form);
    }

    return out.join("") || `<p class="muted">Pick at least one section to print.</p>`;
  }

  function signupFormHTML() {
    const s = state.settings;
    const hood = s.name || "our neighborhood";
    const line = (label, cls = "") => `<div class="fline ${cls}"><span>${label}</span><i></i></div>`;
    return `
      <section class="sheet form">
        <h2 class="sheet-title">Mini Yellow Pages: Neighbor sign-up</h2>
        <p>We're putting together a printed directory for <strong>${esc(hood)}</strong> so neighbors can reach each other and help each other
        in an emergency. We'll also set up check-in "pods" of about ${esc(s.podSize)} nearby households who agree to check on each other after a disaster.
        Taking part is completely voluntary.</p>
        <div class="form-grid">
          ${line("Name(s) to list")}
          ${line("Address / unit")}
          ${line("Phone")}${line("Other phone")}
          ${line("Email")}
          ${line("Occupation(s)")}
          ${line("Household members (adults / kids)")}
          ${line("Pets")}
        </div>
        <h3>Skills you could offer in an emergency</h3>
        <div class="form-checks">${SKILL_SUGGESTIONS.slice(0, 18).map((x) => `<span>☐ ${esc(x)}</span>`).join("")}</div>
        ${line("Other skills / languages")}
        <h3>Equipment you could share</h3>
        <div class="form-checks">${RESOURCE_SUGGESTIONS.map((x) => `<span>☐ ${esc(x)}</span>`).join("")}</div>
        <h3>Anything neighbors should know to check on you?</h3>
        <p class="small">e.g. limited mobility, relies on powered medical equipment, lives alone, infant at home</p>
        ${line("")}${line("")}
        <div class="consent-box">
          <h3>Consent</h3>
          <p>☐ I/we agree to have our <strong>name and address</strong> listed in the ${esc(hood)} Mini Yellow Pages, shared only with participating neighbors, and to be placed in a check-in pod.</p>
          <p>Also OK to print: ☐ Phone &nbsp; ☐ Email &nbsp; ☐ Occupation &nbsp; ☐ Skills &nbsp; ☐ Equipment &nbsp; ☐ Special needs (helps neighbors &amp; responders)</p>
          <p class="small">You can ask to update or remove your listing at any time${s.organizer ? ` by contacting ${esc(s.organizer)}${s.organizerContact ? ` at ${esc(s.organizerContact)}` : ""}` : ""}.
          The directory is for neighborhood use only and won't be posted online or sold.</p>
          <div class="form-grid">${line("Signature")}${line("Date")}</div>
        </div>
      </section>`;
  }

  // ---------- Settings & data ----------
  function renderSettings() {
    const s = state.settings;
    $("#view").innerHTML = `
      <section class="page-head"><div><h1>Settings &amp; data</h1></div></section>
      <form id="settings-form" class="panel">
        <h2>Neighborhood</h2>
        <div class="grid2">
          <label>Neighborhood name<input name="name" value="${esc(s.name)}" placeholder="e.g. Oak & Elm Neighbors"></label>
          <label>Meeting point after a disaster<input name="meetingPoint" value="${esc(s.meetingPoint)}" placeholder="e.g. Corner of Oak & Elm, by the mailbox"></label>
          <label>Organizer name<input name="organizer" value="${esc(s.organizer)}"></label>
          <label>Organizer phone / email<input name="organizerContact" value="${esc(s.organizerContact)}"></label>
        </div>
        <h2>Important numbers</h2>
        <p class="muted small">Printed on the booklet cover. Leave a number blank to hide that line.</p>
        <div id="numbers">
          ${s.numbers.map((n, i) => `
            <div class="num-row">
              <input name="nl${i}" value="${esc(n.label)}" aria-label="Label">
              <input name="nn${i}" value="${esc(n.number)}" aria-label="Number" placeholder="Number">
              <button type="button" class="icon-btn" data-act="del-num" data-i="${i}" aria-label="Remove">✕</button>
            </div>`).join("")}
        </div>
        <p><button type="button" class="btn small" data-act="add-num">+ Add number</button></p>
        <p><button type="submit" class="btn primary">Save settings</button></p>
      </form>

      <section class="panel">
        <h2>Your data</h2>
        <p>Everything is stored <strong>only in this browser</strong> on this device. Nothing is uploaded anywhere.
        Export a backup regularly, and use it to move the directory to another computer or hand it to a co-organizer.</p>
        <p class="muted small">A <strong>.json backup</strong> restores everything (households, pods and settings) and replaces what's here.
        A <strong>.csv spreadsheet</strong> adds households, and updates any with the same name and address.</p>
        <div class="btn-row">
          <button class="btn primary" data-act="export-json">Export backup (.json)</button>
          <label class="btn">Import .json or .csv…<input type="file" class="import-file" accept=".csv,.json,text/csv,application/json" hidden></label>
          <button class="btn" data-act="export-csv">Export spreadsheet (.csv)</button>
        </div>
        <h3>Danger zone</h3>
        <div class="btn-row">
          <button class="btn" data-act="sample">Add sample neighbors</button>
          <button class="btn danger" data-act="wipe">Erase all data</button>
        </div>
      </section>
    `;
    const form = $("#settings-form");
    const collect = () => {
      const fd = new FormData(form);
      ["name", "meetingPoint", "organizer", "organizerContact"].forEach((k) => (s[k] = (fd.get(k) || "").toString().trim()));
      s.numbers = s.numbers.map((_, i) => ({ label: (fd.get("nl" + i) || "").toString().trim(), number: (fd.get("nn" + i) || "").toString().trim() }));
    };
    form.addEventListener("submit", (e) => { e.preventDefault(); collect(); save(); render(); toast("Settings saved"); });
    form.addEventListener("click", (e) => {
      const b = e.target.closest("[data-act]");
      if (!b) return;
      if (b.dataset.act === "add-num") { collect(); s.numbers.push({ label: "", number: "" }); save(); renderSettings(); }
      if (b.dataset.act === "del-num") { collect(); s.numbers.splice(+b.dataset.i, 1); save(); renderSettings(); }
    });
  }

  function download(name, text, type) {
    const blob = new Blob([text], { type });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const slug = () => (state.settings.name || "neighborhood").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  function exportJSON() {
    download(`mini-yellow-pages-${slug()}-${today()}.json`, JSON.stringify(state, null, 2), "application/json");
    toast("Backup downloaded");
  }

  function exportCSV() {
    const cols = ["names", "address", "unit", "phone", "phone2", "email", "occupation", "household", "skills", "resources", "needs", "pets", "consent", "consentDate", "signedBy", "hiddenFields", "pod", "notes"];
    const cell = (v) => {
      const s = String(v ?? "");
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = state.households.slice().sort(byAddress).map((h) => [
      h.names, h.address, h.unit, h.phone, h.phone2, h.email, h.occupation, h.household,
      h.skills.join("; "), h.resources.join("; "), h.needs, h.pets,
      h.consent.given ? "yes" : "no", h.consent.date, h.consent.signedBy,
      SHARE_FIELDS.filter(([k]) => !h.consent.share[k]).map(([k]) => k).join("; "),
      state.pods.find((p) => p.id === h.podId)?.name || "", h.notes,
    ].map(cell).join(","));
    download(`mini-yellow-pages-${slug()}-${today()}.csv`, [cols.join(","), ...rows].join("\n"), "text/csv");
    toast("Spreadsheet downloaded");
  }

  // ---------- Import (.json backup or .csv spreadsheet) ----------
  function importFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "").replace(/^﻿/, "");
      const isJSON = /\.json$/i.test(file.name) || /^\s*[[{]/.test(text);
      try {
        if (isJSON) importJSONText(text);
        else importCSVText(text);
      } catch (err) {
        alert(`Couldn't import "${file.name}". ${err.message || ""}`.trim());
      }
    };
    reader.onerror = () => alert(`Couldn't read "${file.name}".`);
    reader.readAsText(file);
  }

  function importJSONText(text) {
    let data;
    try { data = JSON.parse(text); } catch { throw new Error("The file isn't valid JSON."); }
    if (Array.isArray(data)) return mergeHouseholds(data.map(normalizeHousehold), "file");
    if (!data || !Array.isArray(data.households)) throw new Error("It doesn't look like a Mini Yellow Pages backup.");
    if (state.households.length &&
        !confirm(`Replace everything here (${state.households.length} households, pods and settings) with this backup (${data.households.length} households)?\n\nTip: export a backup of the current data first if you might need it.`)) return;
    state = migrate(data);
    save(); render(); toast(`Backup restored: ${state.households.length} households`);
  }

  // RFC 4180-style CSV parser (quoted fields, escaped quotes, newlines inside quotes)
  function parseCSV(text) {
    const rows = [];
    let row = [], field = "", i = 0, quoted = false;
    const delim = (text.split("\n")[0].match(/\t/g) || []).length > (text.split("\n")[0].match(/,/g) || []).length ? "\t" : ",";
    while (i < text.length) {
      const c = text[i];
      if (quoted) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; } else quoted = false;
        } else field += c;
      } else if (c === '"') quoted = true;
      else if (c === delim) { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(field); rows.push(row); row = []; field = "";
      } else field += c;
      i++;
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    return rows.filter((r) => r.some((v) => v.trim() !== ""));
  }

  const CSV_ALIASES = {
    names: ["names", "name", "fullname", "householdname", "family"],
    address: ["address", "streetaddress", "street", "addr"],
    unit: ["unit", "apt", "apartment", "suite"],
    phone: ["phone", "phonenumber", "mobile", "cell", "telephone", "phone1"],
    phone2: ["phone2", "otherphone", "secondphone", "altphone"],
    email: ["email", "emailaddress", "e-mail"],
    occupation: ["occupation", "occupations", "job", "work", "profession"],
    household: ["household", "householdmembers", "members"],
    skills: ["skills", "skill"],
    resources: ["resources", "equipment", "has"],
    needs: ["needs", "specialneeds"],
    pets: ["pets", "pet"],
    consent: ["consent", "consented", "consentgiven"],
    consentDate: ["consentdate", "dateofconsent"],
    signedBy: ["signedby", "givenby"],
    hiddenFields: ["hiddenfields", "donotprint", "dontprint"],
    pod: ["pod", "podname"],
    notes: ["notes", "organizernotes"],
  };
  const keyOf = (h) => `${h.names}|${h.address}|${h.unit}`.toLowerCase().replace(/[^a-z0-9|]/g, "");
  const truthy = (v) => /^(y|yes|true|1|x|✓|✔|consented|agreed)$/i.test(String(v).trim());

  function importCSVText(text) {
    const rows = parseCSV(text);
    if (rows.length < 2) throw new Error("The spreadsheet has no data rows.");
    const norm = (h) => h.toLowerCase().replace(/[^a-z0-9]/g, "");
    const header = rows[0].map(norm);
    const col = {};
    for (const [field, aliases] of Object.entries(CSV_ALIASES)) {
      const idx = header.findIndex((h) => aliases.map(norm).includes(h));
      if (idx >= 0) col[field] = idx;
    }
    if (col.names === undefined && col.address === undefined) {
      throw new Error('The first row needs column headings, including at least "names" or "address".');
    }
    const records = rows.slice(1).map((r) => {
      const get = (f) => (col[f] === undefined ? undefined : (r[col[f]] ?? "").trim());
      const rec = {};
      ["names", "address", "unit", "phone", "phone2", "email", "occupation", "household", "needs", "pets", "notes"]
        .forEach((f) => { if (get(f) !== undefined) rec[f] = get(f); });
      ["skills", "resources"].forEach((f) => { if (get(f) !== undefined) rec[f] = uniq(get(f).split(/[;,]/).map((x) => x.trim()).filter(Boolean)); });
      if (get("consent") !== undefined || get("consentDate") !== undefined || get("signedBy") !== undefined || get("hiddenFields") !== undefined) {
        const hidden = (get("hiddenFields") || "").toLowerCase();
        rec.consent = {
          given: get("consent") !== undefined ? truthy(get("consent")) : undefined,
          date: get("consentDate"),
          signedBy: get("signedBy"),
          share: get("hiddenFields") !== undefined
            ? Object.fromEntries(SHARE_FIELDS.map(([k]) => [k, !hidden.includes(k)])) : undefined,
        };
      }
      rec._pod = get("pod");
      return rec;
    }).filter((rec) => rec.names || rec.address);
    if (!records.length) throw new Error("No rows with a name or address were found.");
    mergeHouseholds(records, "spreadsheet");
  }

  // Add new households; update existing ones that have the same name + address + unit.
  function mergeHouseholds(records, what) {
    const byKey = new Map(state.households.map((h) => [keyOf(h), h]));
    let added = 0, updated = 0;
    const plan = records.map((rec) => {
      const existing = byKey.get(keyOf({ names: rec.names || "", address: rec.address || "", unit: rec.unit || "" }));
      existing ? updated++ : added++;
      return { rec, existing };
    });
    if (!confirm(`Import ${records.length} household${records.length === 1 ? "" : "s"} from this ${what}?\n\n` +
      `• ${added} new\n• ${updated} matching name & address (will be updated)\n\nNothing else will be removed.`)) return;

    const podFor = (name) => {
      if (!name) return null;
      let p = state.pods.find((x) => x.name.trim().toLowerCase() === name.trim().toLowerCase());
      if (!p) { p = { id: uid(), name: name.trim(), captainId: null }; state.pods.push(p); }
      return p.id;
    };
    plan.forEach(({ rec, existing }) => {
      const { _pod, consent, ...fields } = rec;
      const base = existing || normalizeHousehold({});
      const merged = { ...base, ...fields, updatedAt: new Date().toISOString() };
      if (consent) {
        merged.consent = {
          given: consent.given ?? base.consent.given,
          date: consent.date ?? base.consent.date,
          signedBy: consent.signedBy ?? base.consent.signedBy,
          share: consent.share ?? base.consent.share,
        };
      }
      if (_pod !== undefined) merged.podId = podFor(_pod);
      const h = normalizeHousehold(merged);
      if (!h.consent.given) h.podId = null;
      if (existing) Object.assign(existing, h);
      else { state.households.push(h); byKey.set(keyOf(h), h); }
    });
    save(); render();
    toast(`Imported: ${added} added, ${updated} updated`);
  }

  function addSamples() {
    SAMPLE_HOUSEHOLDS.forEach(([names, address, phone, email, occupation, skills, resources, needs, pets]) => {
      state.households.push(normalizeHousehold({
        names, address, phone, email, occupation, skills, resources, needs, pets,
        notes: "Sample entry",
        consent: { given: true, date: today(), signedBy: names },
      }));
    });
    if (!state.settings.name) state.settings.name = "Oak & Elm Neighbors";
    save(); render(); toast("Sample neighbors added");
  }

  // ---------- global actions ----------
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b || b.closest("#settings-form")) return;
    switch (b.dataset.act) {
      case "add": openEditor(null); break;
      case "edit": openEditor(b.dataset.id); break;
      case "sample": addSamples(); break;
      case "auto-pods": {
        const hasPods = state.households.some((h) => h.podId);
        if (hasPods && !confirm("Re-assign every consenting household to pods by address? Manual changes will be replaced.")) return;
        const n = autoAssignPods(); save(); renderPods(); toast(`Created ${n} pod${n === 1 ? "" : "s"}`);
        break;
      }
      case "add-pod": state.pods.push({ id: uid(), name: `Pod ${state.pods.length + 1}`, captainId: null }); save(); renderPods(); break;
      case "del-pod": {
        const id = b.dataset.id;
        state.households.forEach((h) => { if (h.podId === id) h.podId = null; });
        state.pods = state.pods.filter((p) => p.id !== id);
        save(); renderPods(); break;
      }
      case "reset-gobag": safeSet(GOBAG_KEY, "{}"); renderPrepare(); break;
      case "print": window.print(); break;
      case "export-json": exportJSON(); break;
      case "export-csv": exportCSV(); break;
      case "wipe":
        if (!confirm("Erase ALL households, pods and settings from this browser? Export a backup first if you might need it.")) return;
        if (!confirm("Are you sure? This can't be undone.")) return;
        state = blankState(); save(); render(); toast("All data erased");
        break;
    }
  });

  document.addEventListener("change", (e) => {
    if (!e.target.matches(".import-file")) return;
    importFile(e.target.files[0]);
    e.target.value = "";
  });

  render();
})();
