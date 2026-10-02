export class UIManager {
    private _container: HTMLElement;

    constructor() {
        let uiRoot = document.getElementById('ui-root');
        if (!uiRoot) {
            uiRoot = document.createElement('div');
            uiRoot.id = 'ui-root';
            uiRoot.style.position = 'absolute';
            uiRoot.style.top = '0';
            uiRoot.style.left = '0';
            uiRoot.style.width = '100%';
            uiRoot.style.height = '100%';
            uiRoot.style.pointerEvents = 'none';
            uiRoot.style.fontFamily = 'system-ui, -apple-system, sans-serif';
            document.body.appendChild(uiRoot);
        }
        this._container = uiRoot;
    }

    public get container(): HTMLElement {
        return this._container;
    }

    public clear(): void {
        this._container.innerHTML = '';
        
        // Trigger subtle page transition
        this._container.classList.remove('page-transition-enter');
        void this._container.offsetWidth; // Force reflow
        this._container.classList.add('page-transition-enter');
    }
}
