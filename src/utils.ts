import type { Server } from 'bun';
import type { HydratedDocument, InferSchemaType } from 'mongoose';
import { config } from '.';
import { userSchema } from './models';
import type { GoogleUser } from './types';

export function isValidUrl(string: string): boolean {
    try {
        new URL(string);
    } catch (_) {
        return false;
    }
    return true;
}

export function getIP(request: Request, server: Server | null): string {
    return toIPv4(request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || server?.requestIP(request)?.address || 'unknown');
}

export function toIPv4(ip: string): string {
    const prefix = '::ffff:';
    if (ip.startsWith(prefix)) return ip.slice(prefix.length);
    return ip;
}

export type UserT = InferSchemaType<typeof userSchema>;
export function oidcUserAllowed(user: HydratedDocument<UserT> | GoogleUser | null | undefined): boolean {
    return (
        (user &&
            config.googleOIDC.allowedUsers.length > 0 &&
            (config.googleOIDC.allowedUsers.includes(user.sub) || config.googleOIDC.allowedUsers.includes(user.email))) ||
        false
    );
}
