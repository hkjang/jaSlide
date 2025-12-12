import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto, RegisterDto, AuthResponse } from './dto/auth.dto';

@Injectable()
export class AuthService {
    constructor(
        private prisma: PrismaService,
        private jwtService: JwtService,
    ) { }

    async register(dto: RegisterDto): Promise<AuthResponse> {
        // Check if user exists
        const existingUser = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (existingUser) {
            throw new ConflictException('User with this email already exists');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(dto.password, 10);

        // Create user
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                name: dto.name,
                password: hashedPassword,
                creditsRemaining: 100, // Default free credits
            },
        });

        // Generate token
        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                creditsRemaining: user.creditsRemaining,
            },
            accessToken: token,
        };
    }

    async login(dto: LoginDto): Promise<AuthResponse> {
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });

        if (!user || !user.password) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isPasswordValid = await bcrypt.compare(dto.password, user.password);

        if (!isPasswordValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                creditsRemaining: user.creditsRemaining,
            },
            accessToken: token,
        };
    }

    async validateOAuthUser(profile: {
        email: string;
        name?: string;
        image?: string;
        provider: string;
        providerAccountId: string;
    }): Promise<AuthResponse> {
        let user = await this.prisma.user.findUnique({
            where: { email: profile.email },
        });

        if (!user) {
            // Create new user
            user = await this.prisma.user.create({
                data: {
                    email: profile.email,
                    name: profile.name,
                    image: profile.image,
                    creditsRemaining: 100,
                    accounts: {
                        create: {
                            type: 'oauth',
                            provider: profile.provider,
                            providerAccountId: profile.providerAccountId,
                        },
                    },
                },
            });
        } else {
            // Link account if not already linked
            const existingAccount = await this.prisma.account.findUnique({
                where: {
                    provider_providerAccountId: {
                        provider: profile.provider,
                        providerAccountId: profile.providerAccountId,
                    },
                },
            });

            if (!existingAccount) {
                await this.prisma.account.create({
                    data: {
                        userId: user.id,
                        type: 'oauth',
                        provider: profile.provider,
                        providerAccountId: profile.providerAccountId,
                    },
                });
            }
        }

        const token = this.generateToken(user.id, user.email);

        return {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                creditsRemaining: user.creditsRemaining,
            },
            accessToken: token,
        };
    }

    private generateToken(userId: string, email: string): string {
        return this.jwtService.sign({ sub: userId, email });
    }

    async validateToken(token: string): Promise<{ userId: string; email: string } | null> {
        try {
            const payload = this.jwtService.verify(token);
            return { userId: payload.sub, email: payload.email };
        } catch {
            return null;
        }
    }
}
