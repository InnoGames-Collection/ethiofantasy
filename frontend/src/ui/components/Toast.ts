export type ToastType = 'success' | 'info' | 'warning' | 'error';

export class Toast {
    public static show(message: string, type: ToastType = 'info', durationMs: number = 3000): void {
        const existingContainer = document.getElementById('toast-container');
        let container = existingContainer;

        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.style.position = 'fixed';
            container.style.bottom = '30px';
            container.style.left = '50%';
            container.style.transform = 'translateX(-50%)';
            container.style.zIndex = '99999';
            container.style.display = 'flex';
            container.style.flexDirection = 'column';
            container.style.gap = '10px';
            container.style.pointerEvents = 'none';
            document.body.appendChild(container);
        }

        const el = document.createElement('div');
        const icon = type === 'success' ? '✅' : type === 'warning' ? '⚠️' : type === 'error' ? '❌' : '⚽';
        const borderColor = type === 'success' ? '#00C853' : type === 'warning' ? '#F59E0B' : type === 'error' ? '#EF4444' : '#FFD54F';

        el.style.background = 'rgba(7, 27, 45, 0.92)';
        el.style.border = `1px solid ${borderColor}`;
        el.style.borderRadius = '14px';
        el.style.padding = '12px 20px';
        el.style.color = 'white';
        el.style.fontFamily = 'system-ui, -apple-system, sans-serif';
        el.style.fontWeight = 'bold';
        el.style.fontSize = '14px';
        el.style.boxShadow = `0 10px 30px rgba(0,0,0,0.5)`;
        el.style.backdropFilter = 'blur(12px)';
        el.style.transition = 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
        el.style.pointerEvents = 'none';
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';

        el.innerHTML = `<span style="margin-right: 8px;">${icon}</span> ${message}`;
        container.appendChild(el);

        requestAnimationFrame(() => {
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
        });

        setTimeout(() => {
            el.style.pointerEvents = 'none';
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            setTimeout(() => el.remove(), 300);
        }, durationMs);
    }
}
