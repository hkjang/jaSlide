import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { PrismaService } from '../../../prisma/prisma.service';

export interface OidcConfig {
    issuer: string;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    scope?: string;
}

export interface OidcTokenResponse {
    access_token: string;
    id_token: string;
    token_type: string;
    expires_in: number;
    refresh_token?: string;
}

export interface OidcUserInfo {
    sub: string;
    email: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
    family_name?: string;
    picture?: string;
}

@Injectable()
export class OidcService {
    private readonly logger = new Logger(OidcService.name);
    private discoveryCache: Map<string, any> = new Map();

    constructor(
        private configService: ConfigService,
        private jwtService: JwtService,
        private prisma: PrismaService,
    ) { }

    /**
     * Get OIDC configuration for an organization
     */
    async getOrgOidcConfig(organizationId: string): Promise<OidcConfig | null> {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
            select: { brandSettings: true },
        });

        const settings = org?.brandSettings as any;
        if (!settings?.oidc?.issuer) {
            return null;
        }

        return {
            issuer: settings.oidc.issuer,
            clientId: settings.oidc.clientId,
            clientSecret: settings.oidc.clientSecret,
            redirectUri: settings.oidc.redirectUri ||
                `${this.configService.get('APP_URL')}/api/auth/sso/callback`,
            scope: settings.oidc.scope || 'openid email profile',
        };
    }

    /**
     * Get OIDC discovery document
     */
    async getDiscoveryDocument(issuer: string): Promise<any> {
        const cacheKey = issuer;
        if (this.discoveryCache.has(cacheKey)) {
            return this.discoveryCache.get(cacheKey);
        }

        const discoveryUrl = `${issuer.replace(/\/$/, '')}/.well-known/openid-configuration`;

        try {
            const response = await axios.get(discoveryUrl);
            this.discoveryCache.set(cacheKey, response.data);
            return response.data;
        } catch (error) {
            this.logger.error(`Failed to fetch OIDC discovery document from ${discoveryUrl}`, error);
            throw new UnauthorizedException('Failed to connect to identity provider');
        }
    }

    /**
     * Generate authorization URL
     */
    async getAuthorizationUrl(
        config: OidcConfig,
        state: string,
        nonce: string,
    ): Promise<string> {
        const discovery = await this.getDiscoveryDocument(config.issuer);

        const params = new URLSearchParams({
            client_id: config.clientId,
            redirect_uri: config.redirectUri,
            response_type: 'code',
            scope: config.scope || 'openid email profile',
            state,
            nonce,
        });

        return `${discovery.authorization_endpoint}?${params.toString()}`;
    }

    /**
     * Exchange authorization code for tokens
     */
    async exchangeCode(
        config: OidcConfig,
        code: string,
    ): Promise<OidcTokenResponse> {
        const discovery = await this.getDiscoveryDocument(config.issuer);

        try {
            const response = await axios.post(
                discovery.token_endpoint,
                new URLSearchParams({
                    grant_type: 'authorization_code',
                    client_id: config.clientId,
                    client_secret: config.clientSecret,
                    code,
                    redirect_uri: config.redirectUri,
                }).toString(),
                {
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                },
            );

            return response.data;
        } catch (error: any) {
            this.logger.error('Failed to exchange OIDC code', error.response?.data || error.message);
            throw new UnauthorizedException('Failed to authenticate with identity provider');
        }
    }

    /**
     * Get user info from OIDC provider
     */
    async getUserInfo(
        config: OidcConfig,
        accessToken: string,
    ): Promise<OidcUserInfo> {
        const discovery = await this.getDiscoveryDocument(config.issuer);

        try {
            const response = await axios.get(discovery.userinfo_endpoint, {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                },
            });

            return response.data;
        } catch (error) {
            this.logger.error('Failed to get OIDC user info', error);
            throw new UnauthorizedException('Failed to get user information');
        }
    }

    /**
     * Validate ID token
     */
    async validateIdToken(
        config: OidcConfig,
        idToken: string,
        nonce: string,
    ): Promise<any> {
        try {
            // For production, you should verify the JWT signature using the provider's JWKS
            const decoded = this.jwtService.decode(idToken, { complete: true }) as any;

            if (!decoded) {
                throw new Error('Invalid ID token');
            }

            const payload = decoded.payload;

            // Verify issuer
            if (payload.iss !== config.issuer) {
                throw new Error('Invalid issuer');
            }

            // Verify audience
            if (payload.aud !== config.clientId) {
                throw new Error('Invalid audience');
            }

            // Verify nonce
            if (payload.nonce !== nonce) {
                throw new Error('Invalid nonce');
            }

            // Verify expiration
            if (payload.exp < Math.floor(Date.now() / 1000)) {
                throw new Error('Token expired');
            }

            return payload;
        } catch (error) {
            this.logger.error('Failed to validate ID token', error);
            throw new UnauthorizedException('Invalid ID token');
        }
    }

    /**
     * Handle SSO login and create/update user
     */
    async handleSsoLogin(
        organizationId: string,
        userInfo: OidcUserInfo,
    ): Promise<{ user: any; token: string }> {
        // Find or create user
        let user = await this.prisma.user.findUnique({
            where: { email: userInfo.email },
        });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    email: userInfo.email,
                    name: userInfo.name || userInfo.given_name || 'SSO User',
                    image: userInfo.picture,
                    password: '', // SSO users don't have passwords
                    // emailVerified handled via provider
                },
            });

            // Link to organization
            await this.prisma.user.update({
                where: { id: user.id },
                data: { organizationId },
            });
        }

        // Generate JWT
        const token = this.jwtService.sign({
            sub: user.id,
            email: user.email,
            name: user.name,
        });

        return { user, token };
    }
}
