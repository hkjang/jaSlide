import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface EncryptedData {
    iv: string;
    encryptedData: string;
    authTag: string;
}

@Injectable()
export class EncryptionService {
    private readonly logger = new Logger(EncryptionService.name);
    private readonly algorithm = 'aes-256-gcm';
    private readonly keyLength = 32; // 256 bits
    private readonly ivLength = 16; // 128 bits
    private readonly tagLength = 16; // 128 bits
    private encryptionKey: Buffer;

    constructor(private configService: ConfigService) {
        const key = this.configService.get<string>('ENCRYPTION_KEY');

        if (key) {
            // Use provided key (should be 32 bytes base64 encoded)
            this.encryptionKey = Buffer.from(key, 'base64');
        } else {
            // Generate a key for development (not secure for production)
            this.encryptionKey = crypto.scryptSync(
                'development-secret-key',
                'salt',
                this.keyLength,
            );
            this.logger.warn('Using development encryption key. Set ENCRYPTION_KEY for production!');
        }
    }

    /**
     * Encrypt data using AES-256-GCM
     */
    encrypt(plaintext: string): EncryptedData {
        const iv = crypto.randomBytes(this.ivLength);

        const cipher = crypto.createCipheriv(
            this.algorithm,
            this.encryptionKey,
            iv,
            { authTagLength: this.tagLength },
        );

        let encrypted = cipher.update(plaintext, 'utf8', 'hex');
        encrypted += cipher.final('hex');

        const authTag = cipher.getAuthTag();

        return {
            iv: iv.toString('hex'),
            encryptedData: encrypted,
            authTag: authTag.toString('hex'),
        };
    }

    /**
     * Decrypt data using AES-256-GCM
     */
    decrypt(encryptedData: EncryptedData): string {
        const iv = Buffer.from(encryptedData.iv, 'hex');
        const authTag = Buffer.from(encryptedData.authTag, 'hex');

        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.encryptionKey,
            iv,
            { authTagLength: this.tagLength },
        );

        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    }

    /**
     * Encrypt JSON object
     */
    encryptObject<T extends object>(data: T): EncryptedData {
        return this.encrypt(JSON.stringify(data));
    }

    /**
     * Decrypt to JSON object
     */
    decryptObject<T extends object>(encryptedData: EncryptedData): T {
        const decrypted = this.decrypt(encryptedData);
        return JSON.parse(decrypted) as T;
    }

    /**
     * Hash data using SHA-256 (one-way)
     */
    hash(data: string): string {
        return crypto
            .createHash('sha256')
            .update(data)
            .digest('hex');
    }

    /**
     * Hash with HMAC for verification
     */
    hmac(data: string, key?: string): string {
        const hmacKey = key || this.encryptionKey.toString('hex');
        return crypto
            .createHmac('sha256', hmacKey)
            .update(data)
            .digest('hex');
    }

    /**
     * Verify HMAC
     */
    verifyHmac(data: string, expectedHmac: string, key?: string): boolean {
        const computedHmac = this.hmac(data, key);
        return crypto.timingSafeEqual(
            Buffer.from(computedHmac),
            Buffer.from(expectedHmac),
        );
    }

    /**
     * Generate a secure random token
     */
    generateSecureToken(length: number = 32): string {
        return crypto.randomBytes(length).toString('hex');
    }

    /**
     * Encrypt sensitive field for storage
     */
    encryptField(value: string): string {
        const encrypted = this.encrypt(value);
        return `${encrypted.iv}:${encrypted.encryptedData}:${encrypted.authTag}`;
    }

    /**
     * Decrypt sensitive field from storage
     */
    decryptField(encryptedValue: string): string {
        const [iv, encryptedData, authTag] = encryptedValue.split(':');
        return this.decrypt({ iv, encryptedData, authTag });
    }

    /**
     * Encrypt file buffer
     */
    encryptBuffer(buffer: Buffer): { encrypted: Buffer; iv: Buffer; authTag: Buffer } {
        const iv = crypto.randomBytes(this.ivLength);

        const cipher = crypto.createCipheriv(
            this.algorithm,
            this.encryptionKey,
            iv,
            { authTagLength: this.tagLength },
        );

        const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return { encrypted, iv, authTag };
    }

    /**
     * Decrypt file buffer
     */
    decryptBuffer(encrypted: Buffer, iv: Buffer, authTag: Buffer): Buffer {
        const decipher = crypto.createDecipheriv(
            this.algorithm,
            this.encryptionKey,
            iv,
            { authTagLength: this.tagLength },
        );

        decipher.setAuthTag(authTag);

        return Buffer.concat([decipher.update(encrypted), decipher.final()]);
    }

    /**
     * Generate encryption key (for setup)
     */
    static generateKey(): string {
        return crypto.randomBytes(32).toString('base64');
    }
}
