// Dashboard page script: admin/login.html
  const form = document.getElementById("loginForm");
  const errorBox = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorBox.style.display = "none";
    btn.disabled = true;
    btn.textContent = "Signing in…";

    try {
      const res = await fetch("/api/auth?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: document.getElementById("email").value,
          password: document.getElementById("password").value,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        errorBox.textContent = data.error || "Sign in failed.";
        errorBox.style.display = "block";
        btn.disabled = false;
        btn.textContent = "Sign In";
        return;
      }
      location.href = "/admin/index.html";
    } catch {
      errorBox.textContent = "Something went wrong. Please try again.";
      errorBox.style.display = "block";
      btn.disabled = false;
      btn.textContent = "Sign In";
    }
  });
