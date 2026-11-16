// Publishable key: safe to expose in the browser. Access is enforced by RLS policies in Supabase.
const SUPABASE_URL = "https://iketsxynlezaumttsjip.supabase.co";
const SUPABASE_KEY = "sb_publishable_ZYYDweqnSAZ__jMKgJWvFg_rEwaj5kW";
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
const app = document.getElementById("app");
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const img = u => u ? `<img src="${esc(u)}" alt="" loading="lazy">` : `<img alt="">`;

const pages = {
  async home() {
    app.innerHTML = `<section class="hero"><h1>Daytona Roleplay</h1><p>VC Only</p>
      <a class="btn" href="#/team">Meet the Team</a> <a class="btn ghost" href="#/store">Visit the Store</a></section>`;
  },
  async team() {
    const { data, error } = await sb.from("team_members").select("*").order("sort_order").order("created_at");
    if (error) return app.innerHTML = `<p class="msg">Could not load team.</p>`;
    app.innerHTML = `<h2>Our Team</h2>` + (data.length ? `<div class="grid">${data.map(m =>
      `<div class="card">${img(m.image_url)}<h3>${esc(m.name)}</h3><p class="role">${esc(m.role)}</p><p>${esc(m.description)}</p></div>`).join("")}</div>`
      : `<p class="msg">No team members yet.</p>`);
  },
  async store() {
    const { data, error } = await sb.from("store_items").select("*").eq("active", true).order("created_at");
    if (error) return app.innerHTML = `<p class="msg">Could not load store.</p>`;
    app.innerHTML = `<h2>Store</h2>` + (data.length ? `<div class="grid">${data.map(i =>
      `<div class="card">${img(i.image_url)}<h3>${esc(i.name)}</h3><p>${esc(i.description)}</p><div class="price">$${Number(i.price).toFixed(2)}</div></div>`).join("")}</div>`
      : `<p class="msg">No products yet.</p>`);
  },
  async admin() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return loginForm();
    const { data: p } = await sb.from("profiles").select("role").eq("id", session.user.id).maybeSingle();
    if (!p || p.role !== "admin") {
      app.innerHTML = `<p class="msg">This account is not authorized for the admin panel.</p><button class="btn" id="out">Sign out</button>`;
      return document.getElementById("out").onclick = signOut;
    }
    app.innerHTML = `<h2>Admin Panel</h2><button class="btn ghost" id="out">Sign out</button><div id="t"></div><div id="s"></div>`;
    document.getElementById("out").onclick = signOut;
    manager(document.getElementById("t"), "team_members", "Team Members", [
      { name: "name", label: "Name", req: 1 }, { name: "role", label: "Role", req: 1 },
      { name: "description", label: "Description", area: 1 }, { name: "image_url", label: "Image URL" },
      { name: "sort_order", label: "Sort order", type: "number", num: 1 }], "sort_order");
    manager(document.getElementById("s"), "store_items", "Store Products", [
      { name: "name", label: "Name", req: 1 }, { name: "description", label: "Description", area: 1 },
      { name: "price", label: "Price", type: "number", num: 1, req: 1, step: 1 }, { name: "image_url", label: "Image URL" },
      { name: "active", label: "Visible in store", type: "checkbox", bool: 1 }], "created_at");
  }
};

function loginForm() {
  app.innerHTML = `<h2>Admin Login</h2><form class="card form" id="lf"><label>Email<input type="email" name="e" required></label>
    <label>Password<input type="password" name="p" required></label><button class="btn">Log in</button><div id="err"></div></form>`;
  document.getElementById("lf").onsubmit = async ev => {
    ev.preventDefault();
    const f = ev.target;
    const { error } = await sb.auth.signInWithPassword({ email: f.e.value, password: f.p.value });
    if (error) document.getElementById("err").innerHTML = `<p class="msg">Login failed.</p>`; else route();
  };
}
async function signOut() { await sb.auth.signOut(); route(); }

async function manager(el, table, title, fields, orderCol) {
  const { data = [] } = await sb.from(table).select("*").order(orderCol);
  el.innerHTML = `<h3>${title}</h3><form class="card form">${fields.map(f =>
    `<label>${f.label}${f.area ? `<textarea name="${f.name}" rows="3"></textarea>` :
    `<input name="${f.name}" type="${f.type || "text"}" ${f.step ? 'step="any"' : ""} ${f.req ? "required" : ""} ${f.bool ? "checked" : ""}>`}</label>`).join("")}
    <button class="btn">Save</button><button type="reset" class="btn ghost" id="clr">Clear</button></form>
    ${data.map(r => `<div class="row"><span>${esc(r.name)}</span><span><button class="btn ghost sm" data-e="${r.id}">Edit</button><button class="btn danger sm" data-d="${r.id}">Delete</button></span></div>`).join("")}`;
  const form = el.querySelector("form");
  let editId = null;
  form.onreset = () => { editId = null; };
  form.onsubmit = async ev => {
    ev.preventDefault();
    const row = {};
    fields.forEach(f => {
      const i = form.elements[f.name];
      row[f.name] = f.bool ? i.checked : f.num ? Number(i.value || 0) : (i.value.trim() || (f.req ? "" : null));
    });
    const { error } = editId ? await sb.from(table).update(row).eq("id", editId) : await sb.from(table).insert(row);
    if (error) alert("Save failed: " + error.message); else route();
  };
  el.querySelectorAll("[data-e]").forEach(b => b.onclick = () => {
    const r = data.find(x => x.id === b.dataset.e); editId = r.id;
    fields.forEach(f => { const i = form.elements[f.name]; f.bool ? i.checked = !!r[f.name] : i.value = r[f.name] ?? ""; });
    form.scrollIntoView({ behavior: "smooth" });
  });
  el.querySelectorAll("[data-d]").forEach(b => b.onclick = async () => {
    if (!confirm("Delete this item?")) return;
    const { error } = await sb.from(table).delete().eq("id", b.dataset.d);
    if (error) alert("Delete failed: " + error.message); else route();
  });
}

function route() {
  const name = (location.hash.replace("#/", "") || "home");
  document.querySelectorAll("#links a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#/" + (name === "home" ? "" : name)));
  document.getElementById("links").classList.remove("open");
  (pages[name] || pages.home)();
}
document.getElementById("menu").onclick = () => document.getElementById("links").classList.toggle("open");
window.addEventListener("hashchange", route);
route();
