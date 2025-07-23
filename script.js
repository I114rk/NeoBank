const API_URL = 'http://localhost:3000'; // Твой сервер Node.js, замени на реальный адрес

const app = document.getElementById('app');

let currentUser = null;

function setPage(page) {
  window.history.pushState({}, '', `index.html?=${page}`);
  renderPage(page);
}

function getPageFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const page = params.toString().split('=')[1] || 'main';
  return page;
}

function showMessage(text, color = 'red') {
  const div = document.createElement('div');
  div.className = 'message';
  div.style.color = color;
  div.textContent = text;
  app.prepend(div);
  setTimeout(() => div.remove(), 3000);
}

async function apiPost(url, data) {
  const res = await fetch(API_URL + url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    credentials: 'include',
  });
  return await res.json();
}

async function apiGet(url) {
  const res = await fetch(API_URL + url, { credentials: 'include' });
  return await res.json();
}

function saveUserToLocal(user) {
  localStorage.setItem('bank_user', JSON.stringify(user));
}

function loadUserFromLocal() {
  const str = localStorage.getItem('bank_user');
  if (!str) return null;
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

async function loadUserInfo() {
  if (!currentUser) return;
  const data = await apiGet(`/user_info?user_id=${currentUser.id}`);
  if (data.error) {
    currentUser = null;
    saveUserToLocal(null);
    setPage('login');
  } else {
    currentUser = { ...currentUser, ...data };
    saveUserToLocal(currentUser);
  }
}

function renderLogin() {
  app.innerHTML = `
    <h1>Вход в NeoBank</h1>
    <input id="login-username" placeholder="Имя пользователя" />
    <input id="login-pass" type="password" placeholder="Пароль" />
    <button id="btn-login" class="primary">Войти</button>
    <p>Нет аккаунта? <a href="#" id="link-register">Зарегистрироваться</a></p>
  `;

  document.getElementById('btn-login').onclick = async () => {
    const username = document.getElementById('login-username').value.trim();
    const pass = document.getElementById('login-pass').value.trim();
    if (!username || !pass) return showMessage('Введите имя пользователя и пароль');
    const result = await apiPost('/login', { username, pass });
    if (result.error) {
      showMessage(result.error);
    } else {
      currentUser = { id: result.id, username: result.username };
      await loadUserInfo();
      setPage('main');
    }
  };

  document.getElementById('link-register').onclick = e => {
    e.preventDefault();
    setPage('register');
  };
}

function renderRegister() {
  app.innerHTML = `
    <h1>Регистрация в NeoBank</h1>
    <input id="reg-username" placeholder="Имя пользователя" />
    <input id="reg-pass" type="password" placeholder="Пароль" />
    <button id="btn-register" class="primary">Зарегистрироваться</button>
    <p>Уже есть аккаунт? <a href="#" id="link-login">Войти</a></p>
  `;

  document.getElementById('btn-register').onclick = async () => {
    const username = document.getElementById('reg-username').value.trim();
    const pass = document.getElementById('reg-pass').value.trim();
    if (!username || !pass) return showMessage('Введите имя пользователя и пароль');

    const result = await apiPost('/register', { username, pass, id: null });
    if (result.error) {
      showMessage(result.error);
    } else {
      currentUser = { id: result.id, username: result.username };
      await loadUserInfo();
      setPage('main');
    }
  };

  document.getElementById('link-login').onclick = e => {
    e.preventDefault();
    setPage('login');
  };
}

function formatCurrency(amount) {
  return amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' });
}

function renderMain() {
  app.innerHTML = `
    <h1>Баланс: ${formatCurrency(currentUser.balance)}</h1>
    <p>Добро пожаловать, <b>${currentUser.username}</b>!</p>
    <button id="btn-logout" class="primary">Выйти</button>
    <p>Здесь будет основная информация и быстрый перевод (в будущем)</p>
  `;

  document.getElementById('btn-logout').onclick = () => {
    currentUser = null;
    saveUserToLocal(null);
    setPage('login');
  };
}

function renderPage(page) {
  if (!currentUser && page !== 'login' && page !== 'register') {
    setPage('login');
    return;
  }

  switch (page) {
    case 'login':
      renderLogin();
      break;
    case 'register':
      renderRegister();
      break;
    case 'main':
    default:
      renderMain();
      break;
  }
}

// Кнопки меню
document.querySelectorAll('.bottom-bar button').forEach(btn => {
  btn.onclick = () => {
    setPage(btn.dataset.page);
  };
});

window.addEventListener('popstate', () => {
  renderPage(getPageFromUrl());
});

// При загрузке
(async () => {
  currentUser = loadUserFromLocal();
  if (currentUser) {
    await loadUserInfo();
    renderPage(getPageFromUrl());
  } else {
    setPage('login');
  }
})();
