import { i18n } from '../../localization/i18n';

export class LogoutDialog {
    public static show(): Promise<boolean> {
        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(7, 27, 45, 0.85); /* Dark slate background */
                backdrop-filter: blur(8px);
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                box-sizing: border-box;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;

            const title = i18n.currentLocale === 'am' ? 'ከመለያ መውጣት' : (i18n.currentLocale === 'om' ? 'Herrega Keessaa Ba\'uu' : 'Log Out');
            const message = i18n.currentLocale === 'am' ? 'በእርግጥ ከኢትዮ ፋንታሲ መለያዎ መውጣት ይፈልጋሉ?' : (i18n.currentLocale === 'om' ? 'Dhuguma herrega Ethio Fantasy keessaa ba\'uu barbaadduu?' : 'Are you sure you want to log out of your Ethio Fantasy account?');
            const cancelText = i18n.currentLocale === 'am' ? 'ሰርዝ' : (i18n.currentLocale === 'om' ? 'HAQI' : 'Cancel');
            const logoutText = i18n.currentLocale === 'am' ? 'ውጣ' : (i18n.currentLocale === 'om' ? 'BA\'I' : 'Log Out');

            overlay.innerHTML = `
                <div style="
                    background: #ffffff;
                    border-radius: 16px;
                    padding: 32px 24px;
                    width: 100%;
                    max-width: 360px;
                    text-align: center;
                    box-shadow: 0 24px 48px rgba(0,0,0,0.4);
                    color: #1e293b;
                    font-family: 'Inter', system-ui, -apple-system, sans-serif;
                    transform: scale(0.95) translateY(10px);
                    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                ">
                    <div style="
                        width: 64px;
                        height: 64px;
                        background: rgba(239, 68, 68, 0.1);
                        color: #ef4444;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto 20px auto;
                    ">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                            <polyline points="16 17 21 12 16 7"></polyline>
                            <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                    </div>

                    <h3 style="margin: 0 0 12px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${title}</h3>
                    <p style="margin: 0 0 32px 0; font-size: 15px; color: #64748b; line-height: 1.6;">${message}</p>
                    
                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <!-- Primary Action (Safe): Cancel -->
                        <button id="dlg-cancel-btn" style="
                            padding: 16px;
                            background: #f1f5f9;
                            border: 1px solid #e2e8f0;
                            border-radius: 12px;
                            color: #334155;
                            font-size: 16px;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='#e2e8f0'" onmouseout="this.style.background='#f1f5f9'">${cancelText}</button>
                        
                        <!-- Secondary Action (Destructive): Logout -->
                        <button id="dlg-logout-btn" style="
                            padding: 16px;
                            background: transparent;
                            border: 1px solid rgba(239, 68, 68, 0.3);
                            border-radius: 12px;
                            color: #ef4444;
                            font-size: 16px;
                            font-weight: 700;
                            cursor: pointer;
                            transition: all 0.2s ease;
                        " onmouseover="this.style.background='rgba(239, 68, 68, 0.05)'" onmouseout="this.style.background='transparent'">${logoutText}</button>
                    </div>
                </div>
            `;

            document.body.appendChild(overlay);

            // Trigger enter animations
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                const dialog = overlay.firstElementChild as HTMLElement;
                if (dialog) {
                    dialog.style.transform = 'scale(1) translateY(0)';
                }
            });

            const closeDialog = (result: boolean) => {
                overlay.style.pointerEvents = 'none';
                overlay.style.opacity = '0';
                const dialog = overlay.firstElementChild as HTMLElement;
                if (dialog) {
                    dialog.style.transform = 'scale(0.95) translateY(10px)';
                }
                setTimeout(() => {
                    if (document.body.contains(overlay)) {
                        document.body.removeChild(overlay);
                    }
                    resolve(result);
                }, 300);
            };

            overlay.querySelector('#dlg-cancel-btn')?.addEventListener('click', () => closeDialog(false));
            overlay.querySelector('#dlg-logout-btn')?.addEventListener('click', () => closeDialog(true));
        });
    }
}
