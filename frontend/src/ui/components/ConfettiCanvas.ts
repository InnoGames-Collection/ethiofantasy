/**
 * High-performance 60 FPS Canvas-based Confetti & Sparkle particle system for football goal celebrations and reward unlocks.
 */
export class ConfettiCanvas {
    private static _canvas: HTMLCanvasElement | null = null;
    private static _ctx: CanvasRenderingContext2D | null = null;
    private static _particles: Particle[] = [];
    private static _animId: number | null = null;

    public static burst(x?: number, y?: number, count: number = 60, colors: string[] = ['#FFD54F', '#00C853', '#3B82F6', '#FFFFFF', '#FF4500']): void {
        this._init();

        const canvasX = x ?? (window.innerWidth / 2);
        const canvasY = y ?? (window.innerHeight / 3);

        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 12 + 4;
            this._particles.push({
                x: canvasX,
                y: canvasY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 3,
                size: Math.random() * 8 + 4,
                color: colors[Math.floor(Math.random() * colors.length)],
                alpha: 1,
                rotation: Math.random() * 360,
                rotSpeed: (Math.random() - 0.5) * 15,
                shape: Math.random() > 0.4 ? 'rect' : 'circle'
            });
        }

        if (!this._animId) {
            this._loop();
        }
    }

    private static _init(): void {
        if (!this._canvas) {
            this._canvas = document.createElement('canvas');
            this._canvas.id = 'confetti-canvas';
            this._canvas.style.position = 'fixed';
            this._canvas.style.top = '0';
            this._canvas.style.left = '0';
            this._canvas.style.width = '100vw';
            this._canvas.style.height = '100vh';
            this._canvas.style.pointerEvents = 'none';
            this._canvas.style.zIndex = '9999';
            document.body.appendChild(this._canvas);
        }

        this._canvas.width = window.innerWidth;
        this._canvas.height = window.innerHeight;
        this._ctx = this._canvas.getContext('2d');
    }

    private static _loop(): void {
        if (!this._ctx || !this._canvas) return;

        this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

        for (let i = this._particles.length - 1; i >= 0; i--) {
            const p = this._particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.25; // gravity
            p.vx *= 0.98; // drag
            p.rotation += p.rotSpeed;
            p.alpha -= 0.015;

            if (p.alpha <= 0 || p.y > window.innerHeight) {
                this._particles.splice(i, 1);
                continue;
            }

            this._ctx.save();
            this._ctx.globalAlpha = p.alpha;
            this._ctx.translate(p.x, p.y);
            this._ctx.rotate((p.rotation * Math.PI) / 180);
            this._ctx.fillStyle = p.color;

            if (p.shape === 'rect') {
                this._ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 1.5);
            } else {
                this._ctx.beginPath();
                this._ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                this._ctx.fill();
            }

            this._ctx.restore();
        }

        if (this._particles.length > 0) {
            this._animId = requestAnimationFrame(() => this._loop());
        } else {
            this._animId = null;
        }
    }
}

interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    alpha: number;
    rotation: number;
    rotSpeed: number;
    shape: 'rect' | 'circle';
}
