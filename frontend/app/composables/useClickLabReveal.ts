/** Adds `cl-in-view` when element enters viewport (respects reduced motion). */
export function useClickLabReveal(
  target: Ref<HTMLElement | null | undefined>,
  options?: { threshold?: number | number[]; rootMargin?: string; once?: boolean },
) {
  let observer: IntersectionObserver | undefined;

  onMounted(() => {
    const el = target.value;
    if (!el) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.classList.add('cl-in-view');
      return;
    }

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          if (!el.classList.contains('cl-in-view')) {
            void el.offsetWidth;
            el.classList.add('cl-in-view');
          }
          if (options?.once !== false) observer?.disconnect();
          return;
        }
        if (options?.once === false && entry.intersectionRatio === 0) {
          el.classList.remove('cl-in-view');
        }
      },
      {
        threshold: Array.isArray(options?.threshold)
          ? options.threshold
          : [0, options?.threshold ?? 0.12],
        rootMargin: options?.rootMargin ?? '0px 0px -8% 0px',
      },
    );

    observer.observe(el);
  });

  onUnmounted(() => observer?.disconnect());
}
