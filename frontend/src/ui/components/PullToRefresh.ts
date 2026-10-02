import { CacheManager } from '../../core/cache/CacheManager';
export class PullToRefresh {
    /**
     * Attach pull-to-refresh behavior to a container element.
     */
    public static attach(container: HTMLElement, onRefresh: () => Promise<void>): void {
        let startY = 0;
        let currentY = 0;
        let isPulling = false;

        const spinner = document.createElement('div');
        spinner.className = 'pull-to-refresh-indicator';
        spinner.style.cssText = `
            position: absolute;
            top: -50px;
            left: 50%;
            transform: translateX(-50%);
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: top 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s, transform 0.2s;
            opacity: 0;
            pointer-events: none;
        `;
        
        // Standard Material circular SVG spinner
        spinner.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00C853" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
            </svg>
        `;
        
        container.style.position = 'relative';
        container.appendChild(spinner);

        container.addEventListener('touchstart', (e) => {
            // Guard: Disable Pull-to-Refresh during active quiz
            if (CacheManager.getInstance().isQuizActive) return;

            if (container.scrollTop <= 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });

        container.addEventListener('touchmove', (e) => {
            if (!isPulling || CacheManager.getInstance().isQuizActive) return;
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;

            if (diff > 0 && container.scrollTop <= 0) {
                const pullDistance = Math.min(diff * 0.45, 75);
                spinner.style.top = `${pullDistance - 42}px`;
                spinner.style.opacity = `${Math.min(pullDistance / 50, 1)}`;
                
                // Spin SVG based on pull distance
                const svg = spinner.querySelector('svg');
                if (svg) svg.style.transform = `rotate(${pullDistance * 4}deg)`;
            }
        }, { passive: true });

        container.addEventListener('touchend', async () => {
            if (!isPulling || CacheManager.getInstance().isQuizActive) return;
            isPulling = false;
            const diff = currentY - startY;

            if (diff > 110 && container.scrollTop <= 0) {
                spinner.style.top = '16px';
                
                // Add infinite spinning animation
                const svg = spinner.querySelector('svg');
                if (svg) {
                    svg.style.transition = 'transform 1s linear';
                    svg.style.transform = 'rotate(1080deg)';
                }
                
                const savedScroll = container.scrollTop;

                try {
                    await onRefresh();
                    container.scrollTop = savedScroll;
                } catch (err) {
                    console.error('[PullToRefresh] Refresh failed:', err);
                }
            }
            
            // Restore state and clean up
            spinner.style.pointerEvents = 'none';
            spinner.style.top = '-50px';
            spinner.style.opacity = '0';
            const svg = spinner.querySelector('svg');
            if (svg) {
                svg.style.transition = 'none';
                svg.style.transform = 'rotate(0deg)';
            }
            startY = 0;
            currentY = 0;
        });
    }
}
