/// Inkwell frontend - connected to the Express + MongoDB backend
const API = 'http://127.0.0.1:5000/api';
const get = (k, d) => JSON.parse(localStorage.getItem(k) || d);
const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const $ = id => document.getElementById(id);
const token = localStorage.getItem('token');
const user = token ? get('user', 'null') : null;
const page = document.body.dataset.page;

// One helper for every backend call
async function api(path, method = 'GET', body) {
  try {
    const res = await fetch(API + path, {
      method,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: 'Bearer ' + token } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    return { ok: false, status: 0, data: { message: 'Cannot reach the server. Is the backend running?' } };
  }
}

function logout() {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  location.href = 'index.html';
}

function show(el, text, ok) { el.textContent = text; el.classList.toggle('ok', !!ok); }
function esc(s) { const d = document.createElement('div'); d.textContent = s; return d.innerHTML; }

// Convert a blog from the backend into the shape the page expects
const fmtDate = d => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
const norm = b => ({
  id: b._id,
  title: b.title,
  content: b.content,
  category: b.category || 'Tech',
  author: b.author ? b.author.name : 'Unknown',
  authorId: b.author ? b.author._id : null,
  date: fmtDate(b.createdAt),
});

const dlg = document.createElement('dialog'); document.body.append(dlg);
dlg.addEventListener('click', e => { if (e.target === dlg || e.target.classList.contains('close')) dlg.close(); });
function openPost(p) {
  dlg.innerHTML = `<button class="close" aria-label="Close">×</button><span class="tag ${esc(p.category).toLowerCase()}">${esc(p.category)}</span>
    <h2>${esc(p.title)}</h2><small>${esc(p.author)} · ${esc(p.date)}</small><div class="body">${esc(p.content).replace(/\n/g, '<br>')}</div>`;
  dlg.showModal();
}
function renderPosts(list, box, mine) {
  if (!list.length) { box.innerHTML = '<div class="empty"><h3>Nothing here yet</h3><p>Your first post is a few lines away.</p><a class="btn" href="create-blog.html">Write a post</a></div>'; return; }
  box.innerHTML = list.map(p => `<article class="post ${esc(p.category).toLowerCase()}" data-id="${p.id}" tabindex="0" role="button" aria-label="Read ${esc(p.title)}">
    <span class="tag">${esc(p.category)}</span><h3>${esc(p.title)}</h3>
    <p>${esc(p.content.slice(0, 110))}${p.content.length > 110 ? '…' : ''}</p>
    <div class="meta"><span>${esc(p.author)} · ${esc(p.date)} · ${Math.max(1, Math.round(p.content.split(/\s+/).length / 200))} min read</span>
    ${mine ? `<button class="del" data-del="${p.id}">Delete</button>` : ''}</div></article>`).join('');
  const open = el => { const a = el.closest('.post'); if (a) openPost(list.find(p => p.id == a.dataset.id)); };
  box.onclick = async e => {
    const d = e.target.closest('[data-del]');
    if (!d) return open(e.target);
    if (!confirm('Delete this post? This cannot be undone.')) return;
    const r = await api('/blogs/' + d.dataset.del, 'DELETE');
    if (!r.ok) return alert(r.data.message || 'Could not delete the post.');
    location.reload();
  };
  box.onkeydown = e => { if (e.key === 'Enter' && e.target.classList.contains('post')) open(e.target); };
}

// nav: highlight current page, swap auth links
const file = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('nav a').forEach(a => { if (a.getAttribute('href') === file) a.setAttribute('aria-current', 'page'); });
const lg = document.querySelector('nav a[href="login.html"]'), rg = document.querySelector('nav a[href="register.html"]');
if (user) {
  lg.style.display = 'none'; rg.textContent = 'Log out'; rg.href = '#';
  rg.onclick = e => { e.preventDefault(); logout(); };
} else {
  document.querySelectorAll('nav a[href="dashboard.html"],nav a[href="create-blog.html"]').forEach(a => a.style.display = 'none');
}

// show/hide password
document.querySelectorAll('input[type=password]').forEach(i => {
  const w = document.createElement('div'); w.className = 'pw'; i.before(w); w.append(i);
  const b = document.createElement('button'); b.type = 'button'; b.textContent = 'Show'; b.setAttribute('aria-label', 'Show or hide password');
  b.onclick = () => { const h = i.type === 'password'; i.type = h ? 'text' : 'password'; b.textContent = h ? 'Hide' : 'Show'; };
  w.append(b);
});

const sample = [{ id: 's1', title: 'Getting started with HTML', category: 'Tech', author: 'Inkwell team', date: '1 Jan 2026', content: 'Every web page starts with a few tags. Learn the ones you will use every day.' }];

// ---------- HOME: all blogs from the backend ----------
if (page === 'home') {
  (async () => {
    const r = await api('/blogs');
    const posts = r.ok ? r.data.map(norm) : [];
    renderPosts([...posts, ...sample], $('posts'), false);
  })();
}

// ---------- REGISTER ----------
if (page === 'register') $('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const name = $('name').value.trim(), email = $('email').value.trim().toLowerCase(), pw = $('password').value;
  if (!name || !email.includes('@')) return show($('msg'), 'Enter your name and a valid email.');
  if (pw.length < 6) return show($('msg'), 'Password must be at least 6 characters.');
  if (pw !== $('confirm').value) return show($('msg'), 'Passwords do not match.');
  const r = await api('/auth/register', 'POST', { name, email, password: pw });
  if (!r.ok) return show($('msg'), r.data.message || 'Registration failed.');
  show($('msg'), 'Account created. Redirecting to log in…', true);
  setTimeout(() => location.href = 'login.html', 900);
});

// ---------- LOGIN ----------
if (page === 'login') $('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const email = $('email').value.trim().toLowerCase(), pw = $('password').value;
  const r = await api('/auth/login', 'POST', { email, password: pw });
  if (!r.ok) return show($('msg'), r.data.message || 'Email or password is incorrect.');
  localStorage.setItem('token', r.data.token);
  set('user', r.data.user);
  location.href = 'dashboard.html';
});

if (page === 'dashboard' || page === 'create') {
  if (!user) location.href = 'login.html';
}

// ---------- DASHBOARD: my blogs ----------
if (page === 'dashboard' && user) {
  $('hello').textContent = `Hi, ${user.name}`;
  $('logout').addEventListener('click', logout);
  (async () => {
    const r = await api('/blogs');
    const mine = r.ok ? r.data.map(norm).filter(b => b.authorId === user.id) : [];
    $('count').textContent = mine.length;
    renderPosts(mine, $('posts'), true);
  })();
}

// ---------- CREATE BLOG ----------
if (page === 'create' && user) $('blogForm').addEventListener('submit', async e => {
  e.preventDefault();
  const title = $('title').value.trim(), content = $('content').value.trim();
  if (!title || !content) return show($('msg'), 'Add a title and some content.');
  const r = await api('/blogs', 'POST', { title, content, category: $('category').value });
  if (r.status === 401) return logout();
  if (!r.ok) return show($('msg'), r.data.message || 'Could not publish the post.');
  show($('msg'), 'Published. Opening your dashboard…', true);
  setTimeout(() => location.href = 'dashboard.html', 800);
});
