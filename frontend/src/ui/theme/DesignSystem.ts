export interface ButtonProps {
    id?: string;
    text: string;
    variant?: 'primary' | 'secondary';
    icon?: string;
    fullWidth?: boolean;
    className?: string;
    disabled?: boolean;
    dataAttrs?: string;
}

export interface CardProps {
    id?: string;
    content: string;
    borderColor?: string;
    padding?: string;
    className?: string;
}

export interface BadgeProps {
    text: string;
    variant?: 'live' | 'rank' | 'division' | 'minute' | 'gold';
    icon?: string;
}

export interface ProfileProps {
    username: string;
    xp: number;
    coins?: number;
    streakCount?: number;
    rankName: string;
    rankIcon: string;
    divisionName: string;
    divisionBadge: string;
    level: number;
    levelProgressPercent: number;
}

export interface HeaderProps {
    title: string;
    subtitle?: string;
    badgeText?: string;
    rightText?: string;
}

export class DesignSystem {
    /**
     * Reusable FDS Header Bar
     */
    public static Header(props: HeaderProps): string {
        return `
            <div class="tv-broadcast-header">
                <div style="display: flex; align-items: center; gap: var(--fds-space-12);">
                    <span class="tv-live-badge">
                        <span class="tv-live-dot"></span> ${props.badgeText || 'LIVE BROADCAST HD'}
                    </span>
                    <span class="tv-channel-logo">ETHIO TELECOM <span>SPORTS HD</span></span>
                </div>
                ${props.rightText ? `
                    <div style="font-family: var(--fds-font-mono); font-weight: 800; font-size: var(--fds-font-xs); color: var(--fds-gold-primary);">
                        ${props.rightText}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Reusable FDS Button Component
     */
    public static Button(props: ButtonProps): string {
        const variantClass = props.variant === 'secondary' ? 'ethio-btn-secondary' : 'ethio-btn-primary';
        const widthStyle = props.fullWidth ? 'width: 100%;' : '';
        const idAttr = props.id ? `id="${props.id}"` : '';
        const disabledAttr = props.disabled ? 'disabled' : '';
        const dataAttrs = props.dataAttrs ? props.dataAttrs : '';

        return `
            <button ${idAttr} ${dataAttrs} ${disabledAttr} class="ethio-btn ${variantClass} ${props.className || ''}" style="${widthStyle}">
                ${props.icon ? `<span style="font-size: 1.1em;">${props.icon}</span>` : ''}
                ${props.text}
            </button>
        `;
    }

    /**
     * Reusable FDS Card Component
     */
    public static Card(props: CardProps): string {
        const borderStyle = props.borderColor ? `border-color: ${props.borderColor};` : '';
        const paddingStyle = props.padding ? `padding: ${props.padding};` : 'padding: var(--fds-space-24);';
        const idAttr = props.id ? `id="${props.id}"` : '';

        return `
            <div ${idAttr} class="glass-card fds-card ${props.className || ''}" style="${paddingStyle} ${borderStyle}">
                ${props.content}
            </div>
        `;
    }

    /**
     * Reusable FDS Badge Component
     */
    public static Badge(props: BadgeProps): string {
        if (props.variant === 'live') {
            return `
                <span class="tv-live-badge">
                    <span class="tv-live-dot"></span> ${props.text}
                </span>
            `;
        }
        if (props.variant === 'minute') {
            return `<span class="tv-minute-badge">${props.text}</span>`;
        }

        return `
            <span class="fds-badge" style="background: rgba(255, 213, 79, 0.12); border: 1px solid var(--fds-gold-primary); color: var(--fds-gold-primary); padding: 4px 10px; border-radius: var(--radius-sm); font-size: var(--fds-font-xs); font-weight: 800;">
                ${props.icon ? `${props.icon} ` : ''}${props.text}
            </span>
        `;
    }

    /**
     * Reusable FDS Profile Component
     */
    public static Profile(props: ProfileProps): string {
        return `
            <div class="glass-card" style="padding: var(--fds-space-16); border-color: var(--fds-gold-primary);">
                <div style="display: flex; justify-content: space-between; align-items: center; gap: var(--fds-space-16);">
                    <div style="display: flex; align-items: center; gap: var(--fds-space-16);">
                        <div style="
                            width: 48px;
                            height: 48px;
                            border-radius: 50%;
                            background: var(--fds-gold-gradient);
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 24px;
                            font-weight: bold;
                            color: #000;
                            box-shadow: 0 0 14px var(--fds-gold-glow);
                        ">⚽</div>
                        <div>
                            <div style="display: flex; align-items: center; gap: var(--fds-space-8);">
                                <span style="font-weight: 900; font-size: var(--fds-font-md); color: white;">${props.username}</span>
                                <span class="rank-badge">${props.rankIcon} ${props.rankName}</span>
                            </div>
                            <div style="font-size: var(--fds-font-xs); color: var(--fds-gold-primary); font-weight: 800; margin-top: 2px;">
                                ${props.divisionBadge} ${props.divisionName}
                            </div>
                        </div>
                    </div>

                    <div style="text-align: right;">
                        <div style="font-size: var(--fds-font-xs); color: var(--fds-gold-primary); font-weight: 900; font-family: var(--fds-font-mono);">
                            LVL ${props.level} (${props.xp} XP)
                        </div>
                        <div style="width: 140px; height: 6px; background: rgba(255,255,255,0.15); border-radius: 3px; overflow: hidden; margin-top: 4px;">
                            <div class="tv-progress-fill" style="width: ${props.levelProgressPercent}%; height: 100%; background: var(--fds-gold-gradient);"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Reusable FDS Input Field
     */
    public static Input(id: string, placeholder: string, value: string = '', type: string = 'text'): string {
        return `
            <input id="${id}" type="${type}" placeholder="${placeholder}" value="${value}" class="fds-input" />
        `;
    }

    /**
     * Reusable FDS Progress Bar Component
     */
    public static ProgressBar(percent: number, color: string = 'var(--fds-gold-gradient)'): string {
        return `
            <div style="width: 100%; height: 8px; background: rgba(255,255,255,0.15); border-radius: 4px; overflow: hidden;">
                <div class="tv-progress-fill" style="width: ${Math.min(Math.max(percent, 0), 100)}%; height: 100%; background: ${color};"></div>
            </div>
        `;
    }

    /**
     * Reusable FDS Text Component
     */
    public static Text(text: string, options?: { size?: string, weight?: string, color?: string, margin?: string, align?: string, family?: string }): string {
        const sizeStyle = options?.size ? `font-size: ${options.size};` : '';
        const weightStyle = options?.weight ? `font-weight: ${options.weight};` : '';
        const colorStyle = options?.color ? `color: ${options.color};` : '';
        const marginStyle = options?.margin ? `margin: ${options.margin};` : '';
        const alignStyle = options?.align ? `text-align: ${options.align};` : '';
        const familyStyle = options?.family ? `font-family: ${options.family};` : '';
        
        return `<div style="${sizeStyle} ${weightStyle} ${colorStyle} ${marginStyle} ${alignStyle} ${familyStyle}">${text}</div>`;
    }

    /**
     * Reusable FDS Flex Container
     */
    public static Flex(content: string, options?: { direction?: 'row'|'column', gap?: string, align?: string, justify?: string, wrap?: boolean, margin?: string }): string {
        const dir = options?.direction === 'column' ? 'flex-direction: column;' : 'flex-direction: row;';
        const gap = options?.gap ? `gap: ${options.gap};` : '';
        const align = options?.align ? `align-items: ${options.align};` : 'align-items: center;';
        const justify = options?.justify ? `justify-content: ${options.justify};` : '';
        const wrap = options?.wrap ? 'flex-wrap: wrap;' : '';
        const margin = options?.margin ? `margin: ${options.margin};` : '';
        return `<div style="display: flex; ${dir} ${gap} ${align} ${justify} ${wrap} ${margin}">${content}</div>`;
    }

    /**
     * Reusable FDS Grid Container
     */
    public static Grid(content: string, options?: { minWidth?: string, gap?: string, margin?: string }): string {
        const minWidth = options?.minWidth || '280px';
        const gap = options?.gap ? `gap: ${options.gap};` : 'gap: var(--fds-space-16);';
        const margin = options?.margin ? `margin: ${options.margin};` : '';
        return `<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(${minWidth}, 1fr)); ${gap} ${margin}">${content}</div>`;
    }

    /**
     * Reusable FDS Dialog Component
     */
    public static Dialog(title: string, content: string, footer: string): string {
        return `
            <div class="glass-card" style="
                width: 100%;
                max-width: 480px;
                padding: var(--fds-space-32) var(--fds-space-24);
                text-align: center;
                border-color: var(--fds-gold-primary);
                box-shadow: 0 20px 60px rgba(0,0,0,0.85);
            ">
                <h2 style="font-size: var(--fds-font-xl); font-weight: 900; color: white; margin: 0 0 var(--fds-space-16) 0;">${title}</h2>
                <div style="margin-bottom: var(--fds-space-24);">${content}</div>
                <div>${footer}</div>
            </div>
        `;
    }

    /**
     * Reusable FDS Loading State (Fallback)
     */
    public static LoadingState(_message?: string, _compact?: boolean): string {
        return this.SkeletonList(4); // Default to a list skeleton if not explicitly overridden
    }

    /**
     * SKELETON PLACEHOLDERS
     * Replaces spinners with premium shimmer blocks matching final layouts.
     */
    public static SkeletonList(count: number = 5): string {
        return `
            <div style="display: flex; flex-direction: column; gap: 12px; padding: 16px;">
                ${Array(count).fill(0).map(() => `
                    <div class="glass-card skeleton-shimmer" style="height: 72px; width: 100%;"></div>
                `).join('')}
            </div>
        `;
    }

    public static SkeletonProfile(): string {
        return `
            <div style="padding: 24px 16px;">
                <div class="glass-card skeleton-shimmer" style="height: 120px; width: 100%; margin-bottom: 24px;"></div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                    <div class="glass-card skeleton-shimmer" style="height: 80px;"></div>
                    <div class="glass-card skeleton-shimmer" style="height: 80px;"></div>
                    <div class="glass-card skeleton-shimmer" style="height: 80px;"></div>
                    <div class="glass-card skeleton-shimmer" style="height: 80px;"></div>
                </div>
                <div class="glass-card skeleton-shimmer" style="height: 200px; width: 100%;"></div>
            </div>
        `;
    }

    public static SkeletonCardGrid(count: number = 4): string {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; padding: 16px;">
                ${Array(count).fill(0).map(() => `
                    <div class="glass-card skeleton-shimmer" style="height: 140px; width: 100%;"></div>
                `).join('')}
            </div>
        `;
    }

    public static SkeletonCard(height: number = 160): string {
        return `
            <div class="glass-card skeleton-shimmer" style="height: ${height}px; width: 100%;"></div>
        `;
    }

    /**
     * Reusable FDS Empty State
     */
    public static EmptyState(icon: string, title: string, subtitle?: string): string {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px 24px; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.8; filter: grayscale(0.5);">${icon}</div>
                <div style="font-size: 16px; font-weight: 900; color: white; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">${title}</div>
                ${subtitle ? `<div style="font-size: 13px; color: #94A3B8; font-weight: 600; line-height: 1.5; max-width: 280px;">${subtitle}</div>` : ''}
            </div>
        `;
    }

    /**
     * Reusable FDS Error State
     */
    public static ErrorState(onRetryActionId: string = 'btn-error-retry'): string {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px 24px; text-align: center; border: 1px dashed rgba(239, 68, 68, 0.3); border-radius: 16px; background: rgba(239, 68, 68, 0.05);">
                <div style="font-size: 32px; margin-bottom: 12px;">⚠️</div>
                <div style="font-size: 15px; font-weight: 900; color: white; margin-bottom: 16px;">Something went wrong.</div>
                ${this.Button({ id: onRetryActionId, text: 'Try Again', variant: 'secondary', className: 'error-retry-btn' })}
            </div>
        `;
    }
}
