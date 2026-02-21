/**
 * Chat Utilities - Shared across chat components
 */

// Function to generate text avatar from username
export function generateTextAvatar(username: string) {
    if (!username) return '';
    const nameParts = username.split(' ');
    if (nameParts.length >= 2) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return username.substring(0, 2).toUpperCase();
}

// Function to generate consistent color from string
export function stringToColor(string: string) {
    if (!string) return '#ccc';
    let hash = 0;
    for (let i = 0; i < string.length; i++) {
        hash = string.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xff;
        color += `00${value.toString(16)}`.slice(-2);
    }
    return color;
}
