import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let prismaService: any;
    let jwtService: jest.Mocked<JwtService>;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: '$2b$10$hashedpassword',
        creditsRemaining: 100,
        role: 'USER' as const,
        image: null,
        status: 'ACTIVE' as const,
        preferences: {},
        organizationId: null,
        lastLoginAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        prismaService = {
            user: {
                findUnique: jest.fn(),
                create: jest.fn(),
            },
            account: {
                findUnique: jest.fn(),
                create: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: PrismaService,
                    useValue: prismaService,
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
                        verify: jest.fn(),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        jwtService = module.get(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('login', () => {
        it('should return access token and user data for valid credentials', async () => {
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

            const result = await service.login({
                email: 'test@example.com',
                password: 'password123',
            });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('user');
            expect(result.accessToken).toBe('mock-jwt-token');
            expect(result.user.email).toBe('test@example.com');
        });

        it('should throw UnauthorizedException if user not found', async () => {
            prismaService.user.findUnique.mockResolvedValue(null);

            await expect(
                service.login({
                    email: 'unknown@example.com',
                    password: 'password123',
                }),
            ).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password is invalid', async () => {
            prismaService.user.findUnique.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

            await expect(
                service.login({
                    email: 'test@example.com',
                    password: 'wrongpassword',
                }),
            ).rejects.toThrow(UnauthorizedException);
        });
    });

    describe('register', () => {
        it('should create a new user and return token', async () => {
            prismaService.user.findUnique.mockResolvedValue(null);
            prismaService.user.create.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'hash').mockImplementation(() => Promise.resolve('hashedpassword'));

            const result = await service.register({
                email: 'new@example.com',
                password: 'password123',
                name: 'New User',
            });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('user');
            expect(prismaService.user.create).toHaveBeenCalled();
        });

        it('should throw ConflictException if email already exists', async () => {
            prismaService.user.findUnique.mockResolvedValue(mockUser);

            await expect(
                service.register({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                }),
            ).rejects.toThrow(ConflictException);
        });
    });
});
