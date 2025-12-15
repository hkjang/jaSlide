import { Test, TestingModule } from '@nestjs/testing';
import { PresentationsService } from './presentations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { SourceType } from './dto/presentations.dto';

describe('PresentationsService', () => {
    let service: PresentationsService;
    let prisma: any;

    const mockPresentation = {
        id: 'pres-123',
        title: 'Test Presentation',
        description: 'A test presentation',
        userId: 'user-123',
        templateId: null,
        status: 'DRAFT' as const,
        sourceType: SourceType.TEXT,
        sourceContent: 'Test content',
        metadata: {},
        isPublic: false,
        shareToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        slides: [],
        template: null,
        _count: { slides: 0 },
        user: { id: 'user-123', name: 'Test User', email: 'test@example.com' },
    };

    beforeEach(async () => {
        prisma = {
            presentation: {
                findMany: jest.fn(),
                findUnique: jest.fn(),
                create: jest.fn(),
                update: jest.fn(),
                delete: jest.fn(),
                count: jest.fn(),
            },
            slide: {
                createMany: jest.fn(),
                deleteMany: jest.fn(),
            },
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PresentationsService,
                {
                    provide: PrismaService,
                    useValue: prisma,
                },
            ],
        }).compile();

        service = module.get<PresentationsService>(PresentationsService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all presentations for a user', async () => {
            prisma.presentation.findMany.mockResolvedValue([mockPresentation]);
            prisma.presentation.count.mockResolvedValue(1);

            const result = await service.findAll('user-123');

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toBe('Test Presentation');
            expect(result.total).toBe(1);
            expect(prisma.presentation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 'user-123' },
                }),
            );
        });
    });

    describe('findById', () => {
        it('should return a presentation by ID', async () => {
            prisma.presentation.findUnique.mockResolvedValue(mockPresentation);

            const result = await service.findById('pres-123', 'user-123');

            expect(result).toBeDefined();
            expect(result.id).toBe('pres-123');
        });

        it('should throw NotFoundException if presentation not found', async () => {
            prisma.presentation.findUnique.mockResolvedValue(null);

            await expect(service.findById('unknown-id', 'user-123')).rejects.toThrow(NotFoundException);
        });

        it('should throw ForbiddenException if not owner and not public', async () => {
            prisma.presentation.findUnique.mockResolvedValue(mockPresentation);

            await expect(service.findById('pres-123', 'other-user')).rejects.toThrow(ForbiddenException);
        });
    });

    describe('create', () => {
        it('should create a new presentation', async () => {
            prisma.presentation.create.mockResolvedValue(mockPresentation);

            const result = await service.create('user-123', {
                title: 'Test Presentation',
                sourceType: SourceType.TEXT,
                content: 'Test content',
            });

            expect(result).toBeDefined();
            expect(result.title).toBe('Test Presentation');
            expect(prisma.presentation.create).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update a presentation', async () => {
            prisma.presentation.findUnique.mockResolvedValue({ userId: 'user-123' });
            const updatedPresentation = { ...mockPresentation, title: 'Updated Title' };
            prisma.presentation.update.mockResolvedValue(updatedPresentation);

            const result = await service.update('pres-123', 'user-123', { title: 'Updated Title' });

            expect(result.title).toBe('Updated Title');
            expect(prisma.presentation.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'pres-123' },
                }),
            );
        });
    });

    describe('delete', () => {
        it('should delete a presentation', async () => {
            prisma.presentation.findUnique.mockResolvedValue({ userId: 'user-123' });
            prisma.presentation.delete.mockResolvedValue(mockPresentation);

            await service.delete('pres-123', 'user-123');

            expect(prisma.presentation.delete).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'pres-123' },
                }),
            );
        });
    });
});
