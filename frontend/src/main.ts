import './style.css';
import './ui/theme/BroadcastStyles.css';
import './ui/theme/DesignSystem.css';
import { bootstrapFootballLeague } from './core/engine/Bootstrap';

async function bootstrap() {
    try {
        await bootstrapFootballLeague();
    } catch (err: any) {
        console.error(err);
        const errorDiv = document.createElement('div');
        errorDiv.style.color = 'red';
        errorDiv.style.position = 'absolute';
        errorDiv.style.top = '10px';
        errorDiv.style.left = '10px';
        errorDiv.style.backgroundColor = 'white';
        errorDiv.style.padding = '10px';
        errorDiv.style.fontFamily = 'monospace';
        errorDiv.innerText = `Runtime Error: ${err.message || err}\n\nStack: ${err.stack || ''}`;
        document.body.appendChild(errorDiv);
    }
}

window.addEventListener('error', (event) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '10px';
    errorDiv.style.left = '10px';
    errorDiv.style.backgroundColor = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.zIndex = '999999';
    errorDiv.innerText = `Global Error: ${event.message}\nAt: ${event.filename}:${event.lineno}`;
    document.body.appendChild(errorDiv);
});

window.addEventListener('unhandledrejection', (event) => {
    const errorDiv = document.createElement('div');
    errorDiv.style.color = 'red';
    errorDiv.style.position = 'absolute';
    errorDiv.style.top = '100px';
    errorDiv.style.left = '10px';
    errorDiv.style.backgroundColor = 'white';
    errorDiv.style.padding = '10px';
    errorDiv.style.fontFamily = 'monospace';
    errorDiv.style.zIndex = '999999';
    errorDiv.innerText = `Unhandled Promise Rejection: ${event.reason}`;
    document.body.appendChild(errorDiv);
});

bootstrap().catch(console.error);

