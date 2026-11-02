// Reveal `.animate` sections as they scroll into view, once each.

// The CSS only hides `.animate` sections under html.reveal, which this script sets while it runs.
// With JavaScript off, blocked or failing, the class never appears and every section is simply shown.
const REVEAL_CLASS = "reveal"

document.documentElement.classList.add(REVEAL_CLASS)

// A view-transition swap replaces the <html> attributes with the new page's, so mark the
// incoming page before the swap; it is never painted without the class
document.addEventListener("astro:before-swap", (event) => {
  event.newDocument.documentElement.classList.add(REVEAL_CLASS)
})

function animate() {
  document.documentElement.classList.add(REVEAL_CLASS)

  const elements = document.querySelectorAll(".animate:not(.show)")
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches

  if (reduceMotion || !("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("show"))
    return
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("show")
          observer.unobserve(entry.target)
        }
      })
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0.05 },
  )

  elements.forEach((element) => observer.observe(element))
}

document.addEventListener("DOMContentLoaded", animate)
document.addEventListener("astro:after-swap", animate)
