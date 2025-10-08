document.addEventListener("DOMContentLoaded", () => {
  const user = localStorage.getItem("username");
  const userDisplay = document.getElementById("usernameDisplay");
  const logoutBtn = document.getElementById("logoutBtn");

  if (!user) {
    window.location.href = "index.html";
    return;
  }

  userDisplay.textContent = user;

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("username");
    window.location.href = "index.html";
  });

    // --- Dropdown filter listener (frontend only) ---
  const cuisineSelect = document.getElementById("cuisineSelect");

  cuisineSelect.addEventListener("change", (e) => {
    const selectedCuisine = e.target.value;
    console.log("Selected cuisine:", selectedCuisine);

    // nanti temenmu bisa isi logic filter di sini
    // contoh placeholder:
    // filterRecipes(selectedCuisine);
  });

});
