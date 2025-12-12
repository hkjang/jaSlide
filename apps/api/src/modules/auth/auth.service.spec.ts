import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

describe('AuthService', () => {
    let service: AuthService;
    let usersService: jest.Mocked<UsersService>;
    let jwtService: jest.Mocked<JwtService>;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        password: '$2b$10$hashedpassword',
        creditsRemaining: 100,
        role: 'USER' as const,
        preferences: {},
        organizationId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                {
                    provide: UsersService,
                    useValue: {
                        findByEmail: jest.fn(),
                        create: jest.fn(),
                    },
                },
                {
                    provide: JwtService,
                    useValue: {
                        sign: jest.fn().mockReturnValue('mock-jwt-token'),
                    },
                },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('test-secret'),
                    },
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
        usersService = module.get(UsersService);
        jwtService = module.get(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('validateUser', () => {
        it('should return user data if credentials are valid', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

            const result = await service.validateUser('test@example.com', 'password123');

            expect(result).toBeDefined();
            expect(result?.email).toBe('test@example.com');
            expect(result?.password).toBeUndefined();
        });

        it('should return null if user not found', async () => {
            usersService.findByEmail.mockResolvedValue(null);

            const result = await service.validateUser('unknown@example.com', 'password123');

            expect(result).toBeNull();
        });

        it('should return null if password is invalid', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);
            jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

            const result = await service.validateUser('test@example.com', 'wrongpassword');

            expect(result).toBeNull();
        });
    });

    describe('login', () => {
        it('should return access token and user data', async () => {
            const result = await service.login(mockUser);

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('user');
            expect(result.accessToken).toBe('mock-jwt-token');
            expect(jwtService.sign).toHaveBeenCalled();
        });
    });

    describe('register', () => {
        it('should create a new user and return token', async () => {
            usersService.findByEmail.mockResolvedValue(null);
            usersService.create.mockResolvedValue(mockUser);

            const result = await service.register({
                email: 'new@example.com',
                password: 'password123',
                name: 'New User',
            });

            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('user');
            expect(usersService.create).toHaveBeenCalled();
        });

        it('should throw if email already exists', async () => {
            usersService.findByEmail.mockResolvedValue(mockUser);

            await expect(
                service.register({
                    email: 'test@example.com',
                    password: 'password123',
                    name: 'Test User',
                }),
            ).rejects.toThrow();
        });
    });
});
