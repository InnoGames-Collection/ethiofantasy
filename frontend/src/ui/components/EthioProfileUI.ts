export class EthioProfileUI {
    /**
     * Renders a standardized Profile/Account card with a glass surface.
     */
    public static renderCard(contentHtml: string, title?: string): string {
        return `
            <div class="ethio-profile-group">
                ${title ? `<div class="ethio-profile-group-title">${title}</div>` : ''}
                <div class="ethio-profile-card">
                    ${contentHtml}
                </div>
            </div>
        `;
    }

    /**
     * Renders a fully clickable navigation row.
     */
    public static renderNavRow(
        icon: string, 
        title: string, 
        actionId: string, 
        description?: string, 
        showChevron: boolean = true, 
        badgeId?: string,
        isLast: boolean = false
    ): string {
        return `
            <div class="ethio-nav-row profile-menu-tile" data-action="${actionId}" style="${isLast ? 'border-bottom: none;' : ''}">
                <div class="ethio-nav-icon">
                    ${icon}
                </div>
                <div class="ethio-nav-content">
                    <div class="ethio-nav-title">${title}</div>
                    ${description ? `<div class="ethio-nav-desc">${description}</div>` : ''}
                </div>
                ${badgeId ? `<div id="${badgeId}" class="ethio-nav-badge" style="display: none;"></div>` : ''}
                ${showChevron ? `<div class="ethio-nav-chevron">❯</div>` : ''}
            </div>
        `;
    }

    /**
     * Renders a standardized action button.
     * variant can be: 'primary', 'secondary', 'destructive', 'gold'
     */
    public static renderButton(
        id: string, 
        label: string, 
        variant: 'primary' | 'secondary' | 'destructive' | 'gold' = 'primary',
        icon?: string
    ): string {
        return `
            <button id="${id}" class="ethio-profile-btn ethio-profile-btn-${variant}">
                ${icon ? `<span style="margin-right: 8px;">${icon}</span>` : ''}
                ${label}
            </button>
        `;
    }
}
