// Reveal `.animate` sections as they scroll into view, once each.
function animate() {
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
