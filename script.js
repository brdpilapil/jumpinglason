const ITEMS_PER_PAGE = 6;

let allProjects = [];
let filteredProjects = [];
let currentPage = 1;

// --- Elements ---
const galleryEl = document.getElementById("gallery");
const searchInput = document.getElementById("search-input");
const spinner = document.getElementById("spinner");
const errorContainer = document.getElementById("error-container");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const pageInfo = document.getElementById("page-info");
const contactForm = document.getElementById("contact-form");
const userSearchForm = document.getElementById("user-search-form");
const usernameInput = document.getElementById("username-input");

// --- Gallery Logic (Only runs on gallery.html) ---
if (galleryEl) {
  // Add a type guard inside fetchProjects
  async function fetchProjects(username = "brdpilapil") {
    // If an Event object is passed from an event listener, default to 'octocat'
    if (typeof username !== "string") {
      username = "octocat";
    }

    spinner.style.display = "block";
    errorContainer.textContent = "";
    galleryEl.innerHTML = "";
    searchInput.value = "";
    searchInput.disabled = true;

    try {
      const response = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated`,
      );

      if (response.status === 404) {
        throw new Error(`GitHub user "${username}" was not found.`);
      }
      if (!response.ok) {
        throw new Error(`Failed to fetch data (Status: ${response.status})`);
      }

      const data = await response.json();

      if (data.length === 0) {
        errorContainer.textContent = `User "${username}" has no public repositories.`;
        return;
      }

      allProjects = data;
      filteredProjects = data;
      currentPage = 1;
      searchInput.disabled = false;
      renderGallery();
    } catch (error) {
      errorContainer.textContent = error.message;
    } finally {
      spinner.style.display = "none";
    }
  }

  // Update DOMContentLoaded to use an arrow function call
  if (galleryEl) {
    document.addEventListener("DOMContentLoaded", () =>
      fetchProjects("brdpilapil"),
    );
  }

  // Handle Username Search Form Submit
  if (userSearchForm) {
    userSearchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const targetUser = usernameInput.value.trim();
      if (targetUser) {
        fetchProjects(targetUser);
      }
    });
  }

  function renderGallery() {
    galleryEl.innerHTML = "";
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const projectsToDisplay = filteredProjects.slice(
      startIndex,
      startIndex + ITEMS_PER_PAGE,
    );

    if (projectsToDisplay.length === 0) {
      galleryEl.innerHTML = "<p>No projects found.</p>";
      updatePaginationControls();
      return;
    }

    projectsToDisplay.forEach((repo) => {
      const card = document.createElement("article");
      card.className = "project-card";
      const bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];
      const isBookmarked = bookmarks.includes(repo.id);

      card.innerHTML = `
        <h3>${repo.name}</h3>
        <p>${repo.description || "No description provided."}</p>
        <div class="card-actions">
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="btn">View Repo</a>
          <button class="bookmark-btn ${isBookmarked ? "bookmarked" : ""}" data-id="${repo.id}">
            ${isBookmarked ? "Unbookmark" : "Bookmark"}
          </button>
        </div>
      `;
      galleryEl.appendChild(card);
    });

    updatePaginationControls();
    attachBookmarkListeners();
  }

  function updatePaginationControls() {
    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE) || 1;
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages;
  }

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) {
      currentPage--;
      renderGallery();
    }
  });

  nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) {
      currentPage++;
      renderGallery();
    }
  });

  searchInput.addEventListener("input", (e) => {
    const searchTerm = e.target.value.toLowerCase();
    filteredProjects = allProjects.filter((project) =>
      project.name.toLowerCase().includes(searchTerm),
    );
    currentPage = 1;
    renderGallery();
  });

  function attachBookmarkListeners() {
    const buttons = document.querySelectorAll(".bookmark-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const repoId = parseInt(e.target.dataset.id);
        let bookmarks = JSON.parse(localStorage.getItem("bookmarks")) || [];

        if (bookmarks.includes(repoId)) {
          bookmarks = bookmarks.filter((id) => id !== repoId);
          e.target.textContent = "Bookmark";
          e.target.classList.remove("bookmarked");
        } else {
          bookmarks.push(repoId);
          e.target.textContent = "Unbookmark";
          e.target.classList.add("bookmarked");
        }
        localStorage.setItem("bookmarks", JSON.stringify(bookmarks));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", fetchProjects);
}

// --- Contact Form Logic (Only runs on about.html) ---
if (contactForm) {
  contactForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const phoneInput = document.getElementById("phone");
    const errorMsg = document.getElementById("phone-error");
    const successMsg = document.getElementById("form-success");
    const phPhoneRegex = /^(09|\+639)\d{9}$/;

    if (!phPhoneRegex.test(phoneInput.value)) {
      errorMsg.textContent =
        "Please enter a valid PH phone number (e.g., 09171234567 or +639171234567).";
      successMsg.textContent = "";
    } else {
      errorMsg.textContent = "";
      successMsg.textContent = "Message sent successfully!";
      contactForm.reset();
      setTimeout(() => (successMsg.textContent = ""), 3000);
    }
  });
}
