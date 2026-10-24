const THEME_KEY = "theme"
const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

function storedTheme() {
  const value = localStorage.getItem(THEME_KEY)
  return value === "light" || value === "dark" ? value : null
}

function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark")
}

// Swap themes without animating every colour on the page at once
function applyThemeInstantly(theme) {
  const css = document.createElement("style")
  css.appendChild(
    document.createTextNode(
      `* {
           -webkit-transition: none !important;
           -moz-transition: none !important;
           -o-transition: none !important;
           -ms-transition: none !important;
           transition: none !important;
        }`,
    ),
  )
  document.head.appendChild(css)
  applyTheme(theme)
  window.getComputedStyle(css).opacity
  document.head.removeChild(css)
}

// Only an explicit click is remembered; otherwise the site follows the OS
function changeTheme() {
  const theme = document.documentElement.classList.contains("dark") ? "light" : "dark"
  applyThemeInstantly(theme)
  localStorage.setItem(THEME_KEY, theme)
}

function preloadTheme() {
  applyTheme(storedTheme() ?? (mediaQuery.matches ? "dark" : "light"))
}

mediaQuery.addEventListener("change", (event) => {
  if (!storedTheme()) applyThemeInstantly(event.matches ? "dark" : "light")
})

function initializeThemeButtons() {
  for (const id of ["header-theme-button", "drawer-theme-button"]) {
    const button = document.getElementById(id)
    if (button && !button.dataset.themeBound) {
      button.dataset.themeBound = "true"
      button.addEventListener("click", changeTheme)
    }
  }
}

document.addEventListener("DOMContentLoaded", initializeThemeButtons)
document.addEventListener("astro:after-swap", () => {
  preloadTheme()
  initializeThemeButtons()
})

preloadTheme()
