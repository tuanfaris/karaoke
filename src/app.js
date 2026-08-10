const STORAGE_KEY = "karak-karaoke-2026";
const SESSION_KEY = "karak-karaoke-session";
const EVENT_DATE = new Date("2026-08-15T11:00:00+08:00");

const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[char]));

function loadData() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { registrations: [] };
  } catch { return { registrations: [] }; }
}

let data = loadData();
let staffId = sessionStorage.getItem(SESSION_KEY) || "";
let toastTimer;

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function toast(message, type = "success") {
  const el = document.querySelector("#toast");
  if (!el) return;
  el.textContent = message;
  el.className = `toast show ${type}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.className = "toast", 2800);
}

function countdown() {
  const diff = EVENT_DATE - new Date();
  if (diff <= 0) return "Malam ini kita menyanyi!";
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  return `${days} hari · ${hours} jam lagi`;
}

function shell(content) {
  return `
    <div class="ambient one"></div><div class="ambient two"></div><div class="laser laser-a"></div><div class="laser laser-b"></div>
    <header class="topbar">
      <a class="brand" href="#" aria-label="KARAK Karaoke Night"><span class="brand-mark">K</span><span>KARAK<br><small>KARAOKE NIGHT</small></span></a>
      ${staffId ? `<button class="ghost" id="logoutBtn">Keluar</button>` : `<span class="date-chip">15 · 08 · 2026</span>`}
    </header>
    <main>${content}</main>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>`;
}

function renderLogin() {
  document.querySelector("#app").innerHTML = shell(`
    <section class="hero login-layout">
      <div class="hero-copy">
        <div class="live-badge"><span></span> KARAOKE · DISCO · GOOD VIBES</div>
        <p class="eyebrow">Sabtu · 8:00 malam</p>
        <h1>Own the<br><em>spotlight.</em></h1>
        <p class="lead">Satu pentas. Seribu memori. Daftar kehadiran dan pilih lagu untuk malam paling meriah tahun ini.</p>
        <div class="countdown"><span class="pulse"></span>${countdown()}</div>
        <div class="equalizer" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </div>
      <div class="login-card card">
        <div class="mic">🎤</div>
        <p class="step">LANGKAH PERTAMA</p>
        <h2>Masuk dengan Staff ID</h2>
        <p>Tiada kata laluan diperlukan. Staff ID anda digunakan untuk mencari pendaftaran.</p>
        <form id="loginForm">
          <label for="staffId">Staff ID</label>
          <div class="input-row"><input id="staffId" name="staffId" placeholder="Contoh: 12345" maxlength="20" autocomplete="username" required /><button type="submit">Teruskan <span>→</span></button></div>
          <small>Belum mendaftar? Anda akan dibawa ke borang pendaftaran.</small>
        </form>
      </div>
    </section>
    <section class="event-strip">
      <div><small>TARIKH</small><strong>15 Ogos 2026</strong></div>
      <div><small>MASA</small><strong>11:00 PAGI</strong></div>
      <div><small>ACARA</small><strong>Karaoke &amp; Santai</strong></div>
    </section>`);
  document.querySelector("#loginForm").addEventListener("submit", (event) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("staffId").trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,20}$/.test(value)) return toast("Masukkan Staff ID yang sah.", "error");
    staffId = value; sessionStorage.setItem(SESSION_KEY, staffId); renderPortal();
  });
}

function registration() { return data.registrations.find((item) => item.staffId === staffId); }

function renderPortal() {
  const person = registration();
  document.querySelector("#app").innerHTML = shell(person ? dashboard(person) : registrationForm());
  document.querySelector("#logoutBtn").addEventListener("click", () => { sessionStorage.removeItem(SESSION_KEY); staffId = ""; renderLogin(); });
  if (!person) bindRegistration(); else bindDashboard(person);
}

function registrationForm() {
  return `<section class="portal-head"><p class="eyebrow">SELAMAT DATANG</p><h1>Jom sertai <em>malam kita.</em></h1><p>Lengkapkan maklumat kehadiran anda. Anda boleh tambah lagu selepas mendaftar.</p></section>
    <section class="form-card card narrow">
      <div class="form-title"><span>01</span><div><h2>Daftar Kehadiran</h2><p>Staff ID: <strong>${escapeHtml(staffId)}</strong></p></div></div>
      <form id="registerForm">
        <label for="fullName">Nama</label><input id="fullName" name="fullName" placeholder="Nama" maxlength="80" required />
        <fieldset><legend>Kehadiran</legend><label class="choice"><input type="radio" name="attendance" value="Hadir" checked /><span><b>✓</b><strong>Ya, saya hadir</strong><small>Simpan tempat saya</small></span></label><label class="choice"><input type="radio" name="attendance" value="Tidak Hadir" /><span><b>×</b><strong>Tidak dapat hadir</strong><small>Kemas kini kemudian jika berubah</small></span></label></fieldset>
        <button class="primary full" type="submit">Simpan &amp; pilih lagu <span>→</span></button>
      </form>
    </section>`;
}

function bindRegistration() {
  document.querySelector("#registerForm").addEventListener("submit", (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget);
    data.registrations.push({ staffId, fullName: form.get("fullName").trim(), attendance: form.get("attendance"), songs: [], updatedAt: new Date().toISOString() });
    saveData(); renderPortal(); toast("Pendaftaran berjaya disimpan.");
  });
}

function dashboard(person) {
  const attending = person.attendance === "Hadir";
  const totalSongs = data.registrations.reduce((sum, item) => sum + item.songs.length, 0);
  return `<section class="dashboard-head"><div><p class="eyebrow">RUANG PESERTA</p><h1>Hai, ${escapeHtml(person.fullName.split(" ")[0])}! <span>👋</span></h1><p>Senarai lagu boleh dikemas kini pada bila-bila masa.</p></div><div class="status ${attending ? "yes" : "no"}"><span></span>${attending ? "Kehadiran disahkan" : "Tidak hadir"}</div></section>
    <section class="stats"><div><small>STAFF ID</small><strong>${escapeHtml(person.staffId)}</strong></div><div><small>LAGU ANDA</small><strong>${person.songs.length}</strong></div><div><small>JUMLAH PILIHAN</small><strong>${totalSongs}</strong></div></section>
    <div class="dashboard-grid">
      <section class="card song-panel"><div class="section-title"><div><p class="step">SENARAI PERSEMBAHAN</p><h2>Lagu pilihan saya</h2></div><span class="song-count">${person.songs.length} lagu</span></div>
        <form id="songForm" class="song-form"><input type="hidden" name="songId" /><div><label for="title">Tajuk lagu</label><input id="title" name="title" placeholder="Contoh: Gemilang" maxlength="100" required /></div><div><label for="artist">Penyanyi asal</label><input id="artist" name="artist" placeholder="Contoh: Jaclyn Victor" maxlength="100" required /></div><button class="primary" type="submit">Tambah lagu</button></form>
        <div class="song-list">${person.songs.length ? person.songs.map((song, index) => `<article class="song-item"><span class="number">${String(index + 1).padStart(2, "0")}</span><div><strong>${escapeHtml(song.title)}</strong><small>${escapeHtml(song.artist)}</small></div><div class="actions"><button data-edit="${song.id}" aria-label="Edit ${escapeHtml(song.title)}">Edit</button><button data-delete="${song.id}" class="danger" aria-label="Padam ${escapeHtml(song.title)}">Padam</button></div></article>`).join("") : `<div class="empty"><span>♫</span><strong>Belum ada lagu</strong><p>Tambah lagu pertama anda menggunakan borang di atas.</p></div>`}</div>
      </section>
      <aside class="side-column"><section class="card attendance"><p class="step">KEHADIRAN</p><h2>Status anda</h2><label class="switch-row"><span><strong>Saya akan hadir</strong><small>15 Ogos 2026</small></span><input id="attendanceToggle" type="checkbox" ${attending ? "checked" : ""} /><i></i></label></section>
        <section class="info-card"><span class="note-icon">i</span><div><strong>Maklumat penting</strong><p>Pastikan tajuk lagu dan nama penyanyi tepat supaya urutan persembahan berjalan lancar.</p></div></section>
        <button id="exportBtn" class="export-btn">Muat turun data JSON saya</button>
      </aside>
    </div>`;
}

function bindDashboard(person) {
  document.querySelector("#attendanceToggle").addEventListener("change", (e) => { person.attendance = e.target.checked ? "Hadir" : "Tidak Hadir"; person.updatedAt = new Date().toISOString(); saveData(); renderPortal(); toast("Status kehadiran dikemas kini."); });
  document.querySelector("#songForm").addEventListener("submit", (event) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); const id = form.get("songId");
    const payload = { id: id || crypto.randomUUID(), title: form.get("title").trim(), artist: form.get("artist").trim() };
    const index = person.songs.findIndex((song) => song.id === id);
    if (index >= 0) person.songs[index] = payload; else person.songs.push(payload);
    person.updatedAt = new Date().toISOString(); saveData(); renderPortal(); toast(index >= 0 ? "Lagu berjaya dikemas kini." : "Lagu berjaya ditambah.");
  });
  document.querySelectorAll("[data-edit]").forEach((button) => button.addEventListener("click", () => {
    const song = person.songs.find((item) => item.id === button.dataset.edit); const form = document.querySelector("#songForm");
    form.songId.value = song.id; form.title.value = song.title; form.artist.value = song.artist; form.querySelector("button[type=submit]").textContent = "Simpan perubahan"; form.title.focus();
  }));
  document.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => { if (!confirm("Padam lagu ini daripada senarai?")) return; person.songs = person.songs.filter((item) => item.id !== button.dataset.delete); saveData(); renderPortal(); toast("Lagu telah dipadam."); }));
  document.querySelector("#exportBtn").addEventListener("click", () => { const blob = new Blob([JSON.stringify(person, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = `karaoke-${staffId}.json`; link.click(); URL.revokeObjectURL(url); });
}

staffId ? renderPortal() : renderLogin();
