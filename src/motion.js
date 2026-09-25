import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);
let context;
let off = false;
try {
  off = localStorage.getItem("nr-motion") === "off";
} catch {}
export function motion() {
  context?.revert();
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.documentElement.classList.toggle("motion-off", off || reduced);
  document.querySelector("#motion-toggle").textContent =
    off || reduced ? "Enable motion" : "Pause motion";
  document
    .querySelector("#motion-toggle")
    .setAttribute("aria-pressed", String(off || reduced));
  if (off || reduced) return;
  context = gsap.context(() => {
    if (document.querySelector(".hero")) {
      gsap.from(".hero-copy > *", {
        y: 35,
        opacity: 0,
        duration: 0.9,
        stagger: 0.12,
        ease: "power3.out",
      });
      gsap.to(".hero-copy", {
        yPercent: -18,
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
      gsap.to(".hero-art img", {
        yPercent: 12,
        scale: 1.06,
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }
    gsap.utils.toArray(".floating-line").forEach((el, i) =>
      gsap.fromTo(
        el,
        { xPercent: i % 2 ? -12 : 8 },
        {
          xPercent: i % 2 ? 8 : -12,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        },
      ),
    );
    gsap.utils.toArray(".product-grid").forEach((grid) => {
      const cards = grid.querySelectorAll(".product-card");
      if (cards.length)
        gsap.from(cards, {
          y: 38,
          opacity: 0,
          stagger: 0.09,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: { trigger: grid, start: "top 93%", once: true },
        });
    });
    gsap.utils.toArray(".reveal").forEach((el) =>
      gsap.from(el, {
        y: 45,
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        scrollTrigger: { trigger: el, start: "top 94%", once: true },
      }),
    );
    gsap.utils.toArray(".parallax img").forEach((el) =>
      gsap.fromTo(
        el,
        { yPercent: -5 },
        {
          yPercent: 5,
          ease: "none",
          scrollTrigger: {
            trigger: el.parentElement,
            start: "top bottom",
            end: "bottom top",
            scrub: 1,
          },
        },
      ),
    );
    if (document.querySelector(".scroll-progress"))
      gsap.fromTo(
        ".scroll-progress",
        { scaleX: 0 },
        {
          scaleX: 1,
          ease: "none",
          scrollTrigger: { start: 0, end: "max", scrub: 0.2 },
        },
      );
  });
  ScrollTrigger.refresh();
}
export function setupMotion() {
  document.querySelector("#motion-toggle").addEventListener("click", () => {
    off = !off;
    try {
      localStorage.setItem("nr-motion", off ? "off" : "on");
    } catch {}
    motion();
  });
  matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
    "change",
    motion,
  );
}
