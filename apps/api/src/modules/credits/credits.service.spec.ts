import { Test, TestingModule } from '@nestjs/testing';
import { CreditsService } from './credits.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('CreditsService', () => {
    let service: CreditsService;
    let prisma: jest.Mocked<PrismaService>;

    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        creditsRemaining: 100,
    };

    const mockTransaction = {
        id: 'tx-123',
        userId: 'user-123',
        amount: -10,
        type: 'USAGE' as const,
        description: 'AI Generation',
        referenceId: 'job-123',
        referenceType: 'generation',
        balance: 90,
        createdAt: new Date(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreditsService,
                {
                    provide: PrismaService,
                    useValue: {
                        user: {
                            findUnique: jest.fn(),
                            update: jest.fn(),
                        },
                        creditTransaction: {
                            create: jest.fn(),
                            findMany: jest.fn(),
                        },
                        $transaction: jest.fn().mockImplementation((callback) => callback(prisma)),
                    },
                },
            ],
        }).compile();

        service = module.get<CreditsService>(CreditsService);
        prisma = module.get(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getBalance', () => {
        it('should return user credit balance', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.getBalance('user-123');

            expect(result).toBe(100);
        });

        it('should return 0 if user not found', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await service.getBalance('unknown-id');

            expect(result).toBe(0);
        });
    });

    describe('hasEnoughCredits', () => {
        it('should return true if user has enough credits', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.hasEnoughCredits('user-123', 50);

            expect(result).toBe(true);
        });

        it('should return false if user does not have enough credits', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            const result = await service.hasEnoughCredits('user-123', 150);

            expect(result).toBe(false);
        });
    });

    describe('deductCredits', () => {
        it('should deduct credits and create transaction', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
            (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, creditsRemaining: 90 });
            (prisma.creditTransaction.create as jest.Mock).mockResolvedValue(mockTransaction);

            const result = await service.deductCredits(
                'user-123',
                10,
                'AI Generation',
                'job-123',
                'generation',
            );

            expect(result).toBeDefined();
            expect(result.amount).toBe(-10);
        });

        it('should throw if user does not have enough credits', async () => {
            (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

            await expect(
                service.deductCredits('user-123', 150, 'Big task'),
            ).rejects.toThrow();
        });
    });

    describe('addCredits', () => {
        it('should add credits and create transaction', async () => {
            (prisma.user.update as jest.Mock).mockResolvedValue({ ...mockUser, creditsRemaining: 150 });
            (prisma.creditTransaction.create as jest.Mock).mockResolvedValue({
                ...mockTransaction,
                amount: 50,
                type: 'PURCHASE',
                balance: 150,
            });

            const result = await service.addCredits('user-123', 50, 'PURCHASE', 'Credit purchase');

            expect(result).toBeDefined();
            expect(result.amount).toBe(50);
        });
    });

    describe('getTransactionHistory', () => {
        it('should return transaction history', async () => {
            (prisma.creditTransaction.findMany as jest.Mock).mockResolvedValue([mockTransaction]);

            const result = await service.getTransactionHistory('user-123');

            expect(result).toHaveLength(1);
            expect(result[0].type).toBe('USAGE');
        });
    });
});
