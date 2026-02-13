
export interface NavItemConfig {
    href?: string;
    matcher?: { type: 'startsWith' | 'equals'; href: string };
    disabled?: boolean;
    external?: boolean;
}

export function isNavItemActive({
    disabled,
    external,
    href,
    matcher,
    pathname,
}: NavItemConfig & { pathname: string }): boolean {
    if (disabled || external || !href) {
        return false;
    }

    if (matcher) {
        if (matcher.type === 'equals') {
            return pathname === matcher.href;
        }

        return pathname.startsWith(matcher.href);
    }

    return pathname === href;
}
