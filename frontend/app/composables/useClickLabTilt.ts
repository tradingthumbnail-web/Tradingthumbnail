/** Lightweight 3D tilt on pointer move (disabled for reduced motion / coarse pointer). */
export function useClickLabTilt(maxDeg = 7) {
  const root = ref<HTMLElement | null>(null);
  const enabled = ref(false);

  onMounted(() => {
    const el = root.value;
    if (!el) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    enabled.value = !reduced && !coarse;
  });

  function onPointerMove(e: PointerEvent) {
    const el = root.value;
    if (!el || !enabled.value) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    const rotateY = x * maxDeg * 2;
    const rotateX = -y * maxDeg * 2;
    el.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateZ(0)`;
  }

  function onPointerLeave() {
    const el = root.value;
    if (!el) return;
    el.style.transform = 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)';
  }

  return { root, onPointerMove, onPointerLeave, enabled };
}
