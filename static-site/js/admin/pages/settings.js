// Dashboard page script: admin/settings.html
  (async () => {
    const session = await AdminShell.init({ active: "settings" });
    if (!session) return;
    document.getElementById("newUsername").value = session.email;

    document.getElementById("settingsForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorBox = document.getElementById("settingsError");
      const successBox = document.getElementById("settingsSuccess");
      errorBox.style.display = "none";
      successBox.style.display = "none";
      try {
        await API.post("/api/auth?action=credentials", {
          currentPassword: document.getElementById("currentPassword").value,
          newUsername: document.getElementById("newUsername").value,
          newPassword: document.getElementById("newPassword").value,
        });
        successBox.style.display = "block";
        document.getElementById("currentPassword").value = "";
        document.getElementById("newPassword").value = "";
      } catch (err) {
        errorBox.textContent = err.message || "Failed to update credentials.";
        errorBox.style.display = "block";
      }
    });
  })();
