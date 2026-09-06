<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Payme World - Inloggen</title>
</head>
<body>
  <h1>Payme World</h1>
  <h2>Inloggen</h2>

  <form id="loginForm">
    <label>Telefoonnummer:</label><br>
    <input type="text" id="phone" placeholder="Bijv: 06 12345678" required><br><br>

    <label>Wachtwoord:</label><br>
    <input type="password" id="password" placeholder="Wachtwoord" required><br><br>

    <button type="submit">Inloggen</button>
  </form>

  <p>Nog geen account? <a href="register.html">Registreer hier</a></p>

  <script>
    const API_BASE = "https://payme-world.onrender.com";

    document.getElementById("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();

      const phone = document.getElementById("phone").value.trim();
      const password = document.getElementById("password").value.trim();

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, password })
        });

        const data = await res.json();

        if (!res.ok) {
          alert(data.error || "Onjuiste telefoon of wachtwoord");
          return;
        }

        localStorage.setItem("token", data.token);
        window.location.href = "dashboard.html";
      } catch (err) {
        alert("Er ging iets mis bij het inloggen.");
      }
    });
  </script>
</body>
</html>
