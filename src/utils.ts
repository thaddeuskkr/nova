import type { Server } from 'bun';

export function isValidUrl(string: string): boolean {
    try {
        new URL(string);
    } catch (_) {
        return false;
    }
    return true;
}

export function getIP(request: Request, server: Server | null): string {
    return toIPv4(request.headers.get('x-forwarded-for') || server?.requestIP(request)?.address || 'unknown');
}

export function toIPv4(ip: string): string {
    const prefix = '::ffff:';
    if (ip.startsWith(prefix)) return ip.slice(prefix.length);
    return ip;
}
