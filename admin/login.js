document.addEventListener("DOMContentLoaded", () => {
  redirectIfAuthenticated();

  const form = document.getElementById("login-form");
  const errorEl = document.querySelector(".login-error");

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = form.email.value.trim();
    const password = form.password.value;

    if (login(email, password)) {
      window.location.href = "index.html";
    } else {
      errorEl.textContent = "Invalid email or password. Please try again.";
      errorEl.classList.add("visible");
    }
  });
});
