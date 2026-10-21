/** Scroll-triggered section motion. Replays when the block re-enters (including scroll-up). */
export function useClickLabSectionReveal(
  target: Ref<HTMLElement | null | undefined>,
  options?: { threshold?: number | number[]; rootMargin?: string; once?: boolean },
) {
  let observer: IntersectionObserver | undefined;
  let onScroll: (() => void) | undefined;
  let lastY = 0;

  const indexStaggerChildren = (el: HTMLElement) => {
    el.querySelectorAll('[data-reveal-stagger]').forEach((group) => {
      Array.from(group.children).forEach((child, index) => {
        (child as HTMLElement).style.setProperty('--cl-i', String(index));
      });
    });
  };

  const play = (el: HTMLElement) => {
    el.classList.remove('cl-in-view');
    void el.offsetWidth;
    indexStaggerChildren(el);
    el.classList.add('cl-in-view');
  };

  onMounted(() => {
    const el = target.value;
    if (!el) return;

    el.classList.add('cl-scroll-reveal');

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      indexStaggerChildren(el);
      el.classList.add('cl-in-view');
      return;
    }

    lastY = window.scrollY;
    onScroll = () => {
      const y = window.scrollY;
      if (y < lastY - 3) {
        el.classList.add('cl-scroll-up');
        el.classList.remove('cl-scroll-down');
      } else if (y > lastY + 3) {
        el.classList.add('cl-scroll-down');
        el.classList.remove('cl-scroll-up');
      }
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          if (!el.classList.contains('cl-in-view')) play(el);
          if (options?.once) observer?.disconnect();
          return;
        }
        if (!options?.once && entry.intersectionRatio === 0) {
          el.classList.remove('cl-in-view');
        }
      },
      {
        threshold: Array.isArray(options?.threshold)
          ? options.threshold
          : [0, options?.threshold ?? 0.18],
        rootMargin: options?.rootMargin ?? '0px 0px -8% 0px',
      },
    );

    observer.observe(el);
  });

  onUnmounted(() => {
    observer?.disconnect();
    if (onScroll) window.removeEventListener('scroll', onScroll);
  });
}
