document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorMsg = document.getElementById("errorMsg");

  if (username && password) {
    localStorage.setItem("username", username);
    window.location.href = "recipes.html";
  } else {
    errorMsg.textContent = "Please fill in both fields.";
  }
});
