/**
 * Utility for rolling number transitions (e.g. 0 -> 1,250 XP/Points)
 * Smoothly interpolates text content over a specified duration.
 */
export class RollingCounter {
    public static animate(
        element: HTMLElement,
        startVal: number,
        endVal: number,
        durationMs: number = 1200,
        formatter: (val: number) => string = (val) => Math.round(val).toLocaleString()
    ): void {
        const startTime = performance.now();

        const step = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / durationMs, 1);
            
            // Cubic ease-out: 1 - (1 - t)^3
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentVal = startVal + (endVal - startVal) * easeOut;

            element.textContent = formatter(currentVal);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                element.textContent = formatter(endVal);
            }
        };

        requestAnimationFrame(step);
    }
}
