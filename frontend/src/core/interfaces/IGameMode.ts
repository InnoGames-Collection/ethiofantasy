import { UIManager } from '../managers/UIManager';

export interface GameModeMetadata {
    id: string;
    name: string;
    description: string;
    icon?: string;
}

export interface IGameMode {
    readonly metadata: GameModeMetadata;

    /**
     * Called when the game mode is loaded and mounted to the UI.
     */
    initialize(uiManager: UIManager): Promise<void>;

    /**
     * Called when gameplay begins or resumes.
     */
    start(): void;

    /**
     * Called on every frame tick (if active).
     */
    update(deltaTime: number): void;

    /**
     * Called when the game is paused.
     */
    pause?(): void;

    /**
     * Called when exiting the game mode to clean up listeners and timers.
     */
    destroy(): void;
}
