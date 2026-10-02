export class ConfirmDialog {
    public static show(
        title: string,
        message: string,
        confirmLabel: string = 'CONFIRM',
        cancelLabel: string = 'CANCEL'
    ): Promise<boolean> {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.background = 'rgba(2, 6, 23, 0.85)';
            overlay.style.backdropFilter = 'blur(12px)';
            overlay.style.zIndex = '9999';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.padding = '20px';
            overlay.style.boxSizing = 'border-box';

            overlay.innerHTML = `
                <div style="
                    background: rgba(30, 41, 59, 0.95);
                    border: 1px solid rgba(255, 213, 79, 0.3);
                    border-radius: 20px;
                    padding: 28px;
                    width: 100%;
                    max-width: 400px;
                    text-align: center;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                    color: white;
                    font-family: system-ui, -apple-system, sans-serif;
                ">
                    <h3 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #FFD54F;">${title}</h3>
                    <p style="margin: 0 0 24px 0; font-size: 14px; color: #94A3B8; line-height: 1.5;">${message}</p>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                        <button id="dlg-cancel-btn" style="
                            padding: 12px;
                            background: rgba(255,255,255,0.08);
                            border: 1px solid rgba(255,255,255,0.15);
                            border-radius: 10px;
                            color: white;
                            font-weight: bold;
                            cursor: pointer;
                        ">${cancelLabel}</button>
                        
                        <button id="dlg-confirm-btn" style="
                            padding: 12px;
                            background: linear-gradient(135deg, #FFD54F 0%, #FFA500 100%);
                            border: none;
                            border-radius: 10px;
                            color: #0F172A;
                            font-weight: bold;
                            cursor: pointer;
                        ">${confirmLabel}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            overlay.querySelector('#dlg-cancel-btn')?.addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });

            overlay.querySelector('#dlg-confirm-btn')?.addEventListener('click', () => {
                overlay.remove();
                resolve(true);
            });
        });
    }
}
