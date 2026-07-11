const AUTH_KEY = "diyla-admin-session";
const ADMIN_EMAIL = "admin@diylahome.com";
const ADMIN_PASSWORD = "admin123";

function isAuthenticated() {
  try {
    const session = JSON.parse(sessionStorage.getItem(AUTH_KEY));
    return session && session.email === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

function login(email, password) {
  if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    sessionStorage.setItem(
      AUTH_KEY,
      JSON.stringify({ email, loggedInAt: Date.now() })
    );
    return true;
  }
  return false;
}

function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}

function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function redirectIfAuthenticated() {
  if (isAuthenticated()) {
    window.location.href = "index.html";
  }
}
