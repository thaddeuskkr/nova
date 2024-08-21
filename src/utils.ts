import crypto from 'node:crypto';

const charsets = {
    numbers: '0123456789',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    symbols: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~',
};

export function generatePassword(length: number, charset: ('numbers' | 'lowercase' | 'uppercase' | 'symbols')[]): string {
    let charsetString = '';
    for (const set of charset) charsetString += charsets[set];
    const charsetLength = charsetString.length;
    let password = '';
    while (length--) password += charsetString[crypto.randomInt(charsetLength)];
    return password;
}
