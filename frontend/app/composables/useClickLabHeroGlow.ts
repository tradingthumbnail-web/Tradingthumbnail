/** Cursor-following ambient glow for hero (fine pointer only). */
export function useClickLabHeroGlow(sectionRef: Ref<HTMLElement | null | undefined>) {
  const active = ref(false);
  let onMove: ((e: PointerEvent) => void) | undefined;

  onMounted(() => {
    const section = sectionRef.value;
    if (!section) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    active.value = !reduced && !coarse;

    if (!active.value) return;

    onMove = (e: PointerEvent) => {
      const rect = section.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      section.style.setProperty('--cl-glow-x', `${x}%`);
      section.style.setProperty('--cl-glow-y', `${y}%`);
    };

    section.addEventListener('pointermove', onMove, { passive: true });
  });

  onUnmounted(() => {
    const section = sectionRef.value;
    if (section && onMove) {
      section.removeEventListener('pointermove', onMove);
    }
  });

  return { active };
}
