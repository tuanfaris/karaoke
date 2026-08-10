const STORAGE_KEY = "karak-karaoke-2026";
const SESSION_KEY = "karak-karaoke-session";
const SUPABASE_REST_URL = "https://uwdeioascazghumvflpu.supabase.co/rest/v1";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_9lmAfojZTD82iRAFI7myEA_A4hAAv63";

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[char]));

function loadCache() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { registrations: [] }; }
  catch { return { registrations: [] }; }
}

let data = loadCache();
let staffId = sessionStorage.getItem(SESSION_KEY) || "";
let toastTimer;

function saveCache() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

function cacheRegistration(person) {
  data.registrations = data.registrations.filter((item) => item.staffId !== person.staffId);
  data.registrations.push(person);
  saveCache();
}

async function rpc(name, payload) {
  const response = await fetch(`${SUPABASE_REST_URL}/rpc/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify(payload)
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || "Database tidak dapat dihubungi.");
  return body;
}

function fromDatabase(row) {
  if (!row) return null;
  return {
    staffId: row.staff_id,
    fullName: row.full_name,
    attendance: row.attendance,
    preferredDate: row.preferred_date,
    preferredTime: row.preferred_time?.slice(0, 5) || "",
    preferredVenue: row.preferred_venue,
    songs: Array.isArray(row.songs) ? row.songs : [],
    updatedAt: row.updated_at
  };
}

async function fetchRegistration(id) {
  const person = fromDatabase(await rpc("get_karaoke_registration", { p_staff_id: id }));
  if (person) cacheRegistration(person);
  else {
    data.registrations = data.registrations.filter((item) => item.staffId !== id);
    saveCache();
  }
  return person;
}

async function persistRegistration(person) {
  const saved = fromDatabase(await rpc("save_karaoke_registration", {
    p_staff_id: person.staffId,
    p_full_name: person.fullName,
    p_attendance: person.attendance,
    p_preferred_date: person.preferredDate,
    p_preferred_time: person.preferredTime,
    p_preferred_venue: person.preferredVenue,
    p_songs: person.songs
  }));
  cacheRegistration(saved);
  return saved;
}

function toast(message, type = "success") {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.className = "toast", 3200);
}

function formatDate(value) {
  if (!value) return "Belum dipilih";
  return new Intl.DateTimeFormat("ms-MY", { day: "numeric", month: "long", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function shell(content) {
  return `<div class="ambient one"></div><div class="ambient two"></div><div class="laser laser-a"></div><div class="laser laser-b"></div>
    <header class="topbar"><a class="brand" href="#" aria-label="KARAK Karaoke Night"><span class="brand-mark">K</span><span>KARAK<br><small>KARAOKE NIGHT</small></span></a>${staffId ? `<button class="ghost" id="logoutBtn">Keluar</button>` : `<span class="date-chip">ANDA PILIH · KITA UNDI</span>`}</header>
    <main>${content}</main><div id="toast" class="toast" role="status" aria-live="polite"></div>`;
}

function renderLogin() {
  document.querySelector("#app").innerHTML = shell(`<section class="hero login-layout"><div class="hero-copy"><div class="live-badge"><span></span> KARAOKE · DISCO · GOOD VIBES</div><p class="eyebrow">PILIH TARIKH · MASA · TEMPAT</p><h1>Own the<br><em>spotlight.</em></h1><p class="lead">Satu pentas. Seribu memori. Daftar kehadiran dan pilih lagu untuk malam paling meriah tahun ini.</p><div class="countdown"><span class="pulse"></span>Cadangan anda menentukan acara kita</div><div class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div></div>
    <div class="login-card card"><div class="mic">🎤</div><p class="step">LANGKAH PERTAMA</p><h2>Masuk dengan Staff ID</h2><p>Tiada kata laluan diperlukan. Staff ID anda digunakan untuk mencari pendaftaran.</p><form id="loginForm"><label for="staffId">Staff ID</label><div class="input-row"><input id="staffId" name="staffId" placeholder="Contoh: 12345" maxlength="20" autocomplete="username" required /><button type="submit">Teruskan <span>→</span></button></div><small>Belum mendaftar? Anda akan dibawa ke borang pendaftaran.</small></form></div></section>
    <section class="event-strip"><div><small>TARIKH</small><strong>Pilihan bersama</strong></div><div><small>MASA</small><strong>Anda cadangkan</strong></div><div><small>TEMPAT</small><strong>Lokasi pilihan staf</strong></div></section>`);
  document.querySelector("#loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("staffId").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(value)) return toast("Masukkan Staff ID yang sah.", "error");
    const button = event.currentTarget.querySelector("button"); button.disabled = true; button.textContent = "Menyemak...";
    try { await fetchRegistration(value); staffId = value; sessionStorage.setItem(SESSION_KEY, staffId); renderPortal(); }
    catch (error) { button.disabled = false; button.innerHTML = "Teruskan <span>→</span>"; toast(error.message, "error"); }
  });
}

function registration() { return data.registrations.find((item) => item.staffId === staffId); }

function bindLogout() {
  document.querySelector("#logoutBtn")?.addEventListener("click", () => { sessionStorage.removeItem(SESSION_KEY); staffId = ""; renderLogin(); });
}

function renderPortal() {
  const person = registration();
  document.querySelector("#app").innerHTML = shell(person ? dashboard(person) : registrationForm());
  bindLogout();
  if (!person) bindRegistration(); else bindDashboard(person);
}

function registrationForm() {
  return `<section class="portal-head"><p class="eyebrow">SELAMAT DATANG</p><h1>Jom rancang <em>malam kita.</em></h1><p>Daftar kehadiran dan cadangkan tarikh, masa serta tempat yang paling sesuai.</p></section><section class="form-card card narrow"><div class="form-title"><span>01</span><div><h2>Daftar Kehadiran</h2><p>Staff ID: <strong>${escapeHtml(staffId)}</strong></p></div></div><form id="registerForm"><label for="fullName">Nama</label><input id="fullName" name="fullName" placeholder="Nama" maxlength="80" required /><fieldset><legend>Kehadiran</legend><label class="choice"><input type="radio" name="attendance" value="Hadir" checked /><span><b>✓</b><strong>Ya, saya hadir</strong><small>Simpan tempat saya</small></span></label><label class="choice"><input type="radio" name="attendance" value="Tidak Hadir" /><span><b>×</b><strong>Tidak dapat hadir</strong><small>Kemas kini kemudian jika berubah</small></span></label></fieldset><div class="preference-block"><div class="preference-heading"><span>02</span><div><h3>Cadangan acara anda</h3><p>Pilih waktu dan lokasi yang paling sesuai.</p></div></div><div class="preference-grid"><div><label for="preferredDate">Tarikh pilihan</label><input id="preferredDate" name="preferredDate" type="date" required /></div><div><label for="preferredTime">Masa pilihan</label><input id="preferredTime" name="preferredTime" type="time" required /></div><div class="venue-field"><label for="preferredVenue">Tempat pilihan</label><input id="preferredVenue" name="preferredVenue" placeholder="Contoh: Dewan Serbaguna" maxlength="120" required /></div></div></div><button class="primary full" type="submit">Simpan &amp; pilih lagu <span>→</span></button></form></section>`;
}

function bindRegistration() {
  document.querySelector("#registerForm").addEventListener("submit", async (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const button = event.currentTarget.querySelector("button[type=submit]"); button.disabled = true; button.textContent = "Menyimpan...";
    const person = { staffId, fullName: form.get("fullName").trim(), attendance: form.get("attendance"), preferredDate: form.get("preferredDate"), preferredTime: form.get("preferredTime"), preferredVenue: form.get("preferredVenue").trim(), songs: [] };
    try { await persistRegistration(person); renderPortal(); toast("Pendaftaran berjaya disimpan dalam database."); }
    catch (error) { button.disabled = false; button.textContent = "Simpan & pilih lagu →"; toast(error.message, "error"); }
  });
}

function dashboard(person) {
  const attending = person.attendance === "Hadir";
  return `<section class="dashboard-head"><div><p class="eyebrow">RUANG PESERTA</p><h1>Hai, ${escapeHtml(person.fullName.split(" ")[0])}! <span>👋</span></h1><p>Pilihan acara dan senarai lagu boleh dikemas kini pada bila-bila masa.</p></div><div class="status ${attending ? "yes" : "no"}"><span></span>${attending ? "Kehadiran disahkan" : "Tidak hadir"}</div></section><section class="stats"><div><small>STAFF ID</small><strong>${escapeHtml(person.staffId)}</strong></div><div><small>LAGU ANDA</small><strong>${person.songs.length}</strong></div><div><small>SIMPANAN</small><strong>Supabase ✓</strong></div></section><div class="dashboard-grid"><section class="card song-panel"><div class="section-title"><div><p class="step">SENARAI PERSEMBAHAN</p><h2>Lagu pilihan saya</h2></div><span class="song-count">${person.songs.length} lagu</span></div><form id="songForm" class="song-form"><input type="hidden" name="songId" /><div><label for="title">Tajuk lagu</label><input id="title" name="title" placeholder="Contoh: Gemilang" maxlength="100" required /></div><div><label for="artist">Penyanyi asal</label><input id="artist" name="artist" placeholder="Contoh: Jaclyn Victor" maxlength="100" required /></div><button class="primary" type="submit">Tambah lagu</button></form><div class="song-list">${person.songs.length ? person.songs.map((song, index) => `<article class="song-item"><span class="number">${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.artist)}</small></div><div class="actions"><button data-edit="${song.id}" aria-label="Edit ${escapeHtml(song.title)}">Edit</button><button data-delete="${song.id}" class="danger" aria-label="Padam ${escapeHtml(song.title)}">Padam</button></div></article>`).join("") : `<div class="empty"><span>♫</span><strong>Belum ada lagu</strong><p>Tambah lagu pertama anda menggunakan borang di atas.</p></div>`}</div></section><aside class="side-column"><section class="card attendance"><p class="step">KEHADIRAN</p><h2>Status anda</h2><label class="switch-row"><span><strong>Saya akan hadir</strong><small>Acara akan ditentukan bersama</small></span><input id="attendanceToggle" type="checkbox" ${attending ? "checked" : ""} /><i></i></label></section><section class="card schedule-card"><p class="step">CADANGAN ANDA</p><h2>Bila &amp; di mana?</h2><form id="preferenceForm"><label for="dashboardDate">Tarikh</label><input id="dashboardDate" name="preferredDate" type="date" value="${escapeHtml(person.preferredDate || "")}" required /><label for="dashboardTime">Masa</label><input id="dashboardTime" name="preferredTime" type="time" value="${escapeHtml(person.preferredTime || "")}" required /><label for="dashboardVenue">Tempat</label><input id="dashboardVenue" name="preferredVenue" value="${escapeHtml(person.preferredVenue || "")}" placeholder="Cadangan tempat" maxlength="120" required /><div class="current-choice"><small>PILIHAN SEMASA</small><strong>${escapeHtml(formatDate(person.preferredDate))}${person.preferredTime ? ` · ${escapeHtml(person.preferredTime)}` : ""}</strong><span>${escapeHtml(person.preferredVenue || "Belum ada tempat")}</span></div><button class="primary full" type="submit">Kemas kini cadangan</button></form></section><section class="info-card"><span class="note-icon">i</span><div><strong>Maklumat penting</strong><p>Pastikan tajuk lagu dan nama penyanyi tepat supaya urutan persembahan berjalan lancar.</p></div></section><button id="exportBtn" class="export-btn">Muat turun data JSON saya</button></aside></div>`;
}

async function saveAndRefresh(person, successMessage) {
  try { await persistRegistration(person); renderPortal(); toast(successMessage); }
  catch (error) { await fetchRegistration(staffId).catch(() => {}); renderPortal(); toast(error.message, "error"); }
}

function bindDashboard(person) {
  document.querySelector("#attendanceToggle").addEventListener("change", (event) => { person.attendance = event.target.checked ? "Hadir" : "Tidak Hadir"; saveAndRefresh(person, "Status kehadiran dikemas kini."); });
  document.querySelector("#preferenceForm").addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); person.preferredDate = form.get("preferredDate"); person.preferredTime = form.get("preferredTime"); person.preferredVenue = form.get("preferredVenue").trim(); saveAndRefresh(person, "Cadangan tarikh, masa dan tempat dikemas kini."); });
  document.querySelector("#songForm").addEventListener("submit", (event) => { event.preventDefault(); const form = new FormData(event.currentTarget); const id = form.get("songId"); const song = { id: id || crypto.randomUUID(), title: form.get("title").trim(), artist: form.get("artist").trim() }; const index = person.songs.findIndex((item) => item.id === id); if (index >= 0) person.songs[index] = song; else person.songs.push(song); saveAndRefresh(person, index >= 0 ? "Lagu berjaya dikemas kini." : "Lagu berjaya ditambah."); });
  document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => { const song = person.songs.find((item) => item.id === button.dataset.edit); const form = document.querySelector("#songForm"); form.songId.value = song.id; form.title.value = song.title; form.artist.value = song.artist; form.querySelector("button[type=submit]").textContent = "Simpan perubahan"; form.title.focus(); }));
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => { if (!confirm("Padam lagu ini daripada senarai?")) return; person.songs = person.songs.filter((item) => item.id !== button.dataset.delete); saveAndRefresh(person, "Lagu telah dipadam."); }));
  document.querySelector("#exportBtn").addEventListener("click", () => { const blob = new Blob([JSON.stringify(person, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `karaoke-${staffId}.json`; link.click(); URL.revokeObjectURL(url); });
}

async function start() {
  if (!staffId) return renderLogin();
  document.querySelector("#app").innerHTML = shell(`<section class="portal-head"><p class="eyebrow">MENGHUBUNGKAN DATABASE</p><h1>Sebentar <em>ya...</em></h1></section>`); bindLogout();
  try { await fetchRegistration(staffId); renderPortal(); }
  catch { sessionStorage.removeItem(SESSION_KEY); staffId = ""; renderLogin(); toast("Database belum tersedia. Sila cuba lagi selepas setup SQL selesai.", "error"); }
}

start();
