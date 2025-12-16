import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

export interface LoginPolicyDto {
    maxFailedAttempts?: number;
    lockoutDurationMinutes?: number;
    sessionTimeoutMinutes?: number;
    requireMfaForAdmin?: boolean;
}

export interface PasswordPolicyDto {
    minLength?: number;
    requireUppercase?: boolean;
    requireLowercase?: boolean;
    requireNumbers?: boolean;
    requireSpecialChars?: boolean;
    expirationDays?: number;
    preventReuse?: number;
}

export interface MfaPolicyDto {
    enabled?: boolean;
    requiredForRoles?: string[];
    methods?: string[];
    gracePeriodDays?: number;
}

export interface IpPolicyDto {
    enabled?: boolean;
    allowedIps?: string[];
    blockedIps?: string[];
    allowPrivateNetworks?: boolean;
}

@Injectable()
export class AdminSecurityPoliciesService {
    constructor(private prisma: PrismaService) { }

    // ===============================
    // Login Policy Management
    // ===============================

    async getLoginPolicy() {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'security.login' },
        });
        return policy?.value || this.getDefaultLoginPolicy();
    }

    async updateLoginPolicy(dto: LoginPolicyDto) {
        const policy = await this.prisma.systemPolicy.upsert({
            where: { key: 'security.login' },
            create: {
                category: 'security',
                key: 'security.login',
                value: { ...this.getDefaultLoginPolicy(), ...dto },
                description: 'Login security policy',
            },
            update: {
                value: { ...this.getDefaultLoginPolicy(), ...dto },
            },
        });

        await this.createAuditLog('UPDATE', 'LOGIN_POLICY', dto);
        return policy.value;
    }

    private getDefaultLoginPolicy(): LoginPolicyDto {
        return {
            maxFailedAttempts: 5,
            lockoutDurationMinutes: 30,
            sessionTimeoutMinutes: 60,
            requireMfaForAdmin: true,
        };
    }

    // ===============================
    // Password Policy Management
    // ===============================

    async getPasswordPolicy() {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'security.password' },
        });
        return policy?.value || this.getDefaultPasswordPolicy();
    }

    async updatePasswordPolicy(dto: PasswordPolicyDto) {
        const policy = await this.prisma.systemPolicy.upsert({
            where: { key: 'security.password' },
            create: {
                category: 'security',
                key: 'security.password',
                value: { ...this.getDefaultPasswordPolicy(), ...dto },
                description: 'Password security policy',
            },
            update: {
                value: { ...this.getDefaultPasswordPolicy(), ...dto },
            },
        });

        await this.createAuditLog('UPDATE', 'PASSWORD_POLICY', dto);
        return policy.value;
    }

    private getDefaultPasswordPolicy(): PasswordPolicyDto {
        return {
            minLength: 8,
            requireUppercase: true,
            requireLowercase: true,
            requireNumbers: true,
            requireSpecialChars: false,
            expirationDays: 90,
            preventReuse: 5,
        };
    }

    // ===============================
    // MFA Policy Management
    // ===============================

    async getMfaPolicy() {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'security.mfa' },
        });
        return policy?.value || this.getDefaultMfaPolicy();
    }

    async updateMfaPolicy(dto: MfaPolicyDto) {
        const policy = await this.prisma.systemPolicy.upsert({
            where: { key: 'security.mfa' },
            create: {
                category: 'security',
                key: 'security.mfa',
                value: { ...this.getDefaultMfaPolicy(), ...dto },
                description: 'MFA security policy',
            },
            update: {
                value: { ...this.getDefaultMfaPolicy(), ...dto },
            },
        });

        await this.createAuditLog('UPDATE', 'MFA_POLICY', dto);
        return policy.value;
    }

    async getMfaStatus() {
        const [totalUsers, mfaEnabled] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.user.count({ where: { mfaEnabled: true } }),
        ]);

        const byRole = await this.prisma.user.groupBy({
            by: ['role'],
            _count: { id: true },
            where: { mfaEnabled: true },
        });

        return {
            totalUsers,
            mfaEnabledCount: mfaEnabled,
            mfaEnabledPercent: totalUsers > 0 ? (mfaEnabled / totalUsers) * 100 : 0,
            byRole: byRole.map(r => ({ role: r.role, count: r._count.id })),
        };
    }

    private getDefaultMfaPolicy(): MfaPolicyDto {
        return {
            enabled: true,
            requiredForRoles: ['ADMIN', 'SYSTEM_ADMIN'],
            methods: ['totp', 'email'],
            gracePeriodDays: 7,
        };
    }

    // ===============================
    // IP Access Policy Management
    // ===============================

    async getIpPolicy() {
        const policy = await this.prisma.systemPolicy.findUnique({
            where: { key: 'security.ip' },
        });
        return policy?.value || this.getDefaultIpPolicy();
    }

    async updateIpPolicy(dto: IpPolicyDto) {
        const policy = await this.prisma.systemPolicy.upsert({
            where: { key: 'security.ip' },
            create: {
                category: 'security',
                key: 'security.ip',
                value: { ...this.getDefaultIpPolicy(), ...dto },
                description: 'IP access policy',
            },
            update: {
                value: { ...this.getDefaultIpPolicy(), ...dto },
            },
        });

        await this.createAuditLog('UPDATE', 'IP_POLICY', dto);
        return policy.value;
    }

    async addAllowedIp(ip: string) {
        const current = await this.getIpPolicy() as IpPolicyDto;
        const allowedIps = [...(current.allowedIps || []), ip];
        return this.updateIpPolicy({ ...current, allowedIps });
    }

    async removeAllowedIp(ip: string) {
        const current = await this.getIpPolicy() as IpPolicyDto;
        const allowedIps = (current.allowedIps || []).filter(i => i !== ip);
        return this.updateIpPolicy({ ...current, allowedIps });
    }

    async addBlockedIp(ip: string) {
        const current = await this.getIpPolicy() as IpPolicyDto;
        const blockedIps = [...(current.blockedIps || []), ip];
        return this.updateIpPolicy({ ...current, blockedIps });
    }

    async removeBlockedIp(ip: string) {
        const current = await this.getIpPolicy() as IpPolicyDto;
        const blockedIps = (current.blockedIps || []).filter(i => i !== ip);
        return this.updateIpPolicy({ ...current, blockedIps });
    }

    private getDefaultIpPolicy(): IpPolicyDto {
        return {
            enabled: false,
            allowedIps: [],
            blockedIps: [],
            allowPrivateNetworks: true,
        };
    }

    // ===============================
    // Audit Logging
    // ===============================

    private async createAuditLog(action: string, resource: string, details?: any) {
        await this.prisma.auditLog.create({
            data: {
                action,
                resource,
                details,
            },
        });
    }
}
