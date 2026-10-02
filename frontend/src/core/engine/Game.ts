
import { UIManager } from '../managers/UIManager';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';

/**
 * Lightweight ambient 3D background manager.
 * Initializes the Babylon.js engine and scene for visual atmosphere
 * (stadium lighting, ambient effects) while the quiz UI overlays on top.
 */
export class Game {
    private _uiManager: UIManager;
    private _saveManager: SaveManager;
    private _audioManager: AudioManager;

    constructor() {
        this._uiManager = new UIManager();
        this._saveManager = new SaveManager();
        this._audioManager = new AudioManager();
    }

    public async initialize(): Promise<void> {
        // Preload crucial audio assets in background
        this._audioManager.preloadAssets();
        // No 3D scene required for Gameshow UI
    }

    public get uiManager(): UIManager {
        return this._uiManager;
    }

    public get saveManager(): SaveManager {
        return this._saveManager;
    }

    public get audioManager(): AudioManager {
        return this._audioManager;
    }

}
