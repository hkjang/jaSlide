import { Test, TestingModule } from '@nestjs/testing';
import { PresentationsService } from './presentations.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('PresentationsService', () => {
    let service: PresentationsService;
    let prisma: jest.Mocked<PrismaService>;

    const mockPresentation = {
        id: 'pres-123',
        title: 'Test Presentation',
        description: 'A test presentation',
        userId: 'user-123',
        templateId: null,
        status: 'DRAFT' as const,
        sourceType: 'TEXT' as const,
        sourceContent: 'Test content',
        metadata: {},
        isPublic: false,
        shareToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        slides: [],
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PresentationsService,
                {
                    provide: PrismaService,
                    useValue: {
                        presentation: {
                            findMany: jest.fn(),
                            findUnique: jest.fn(),
                            create: jest.fn(),
                            update: jest.fn(),
                            delete: jest.fn(),
                        },
                        slide: {
                            createMany: jest.fn(),
                            deleteMany: jest.fn(),
                        },
                    },
                },
            ],
        }).compile();

        service = module.get<PresentationsService>(PresentationsService);
        prisma = module.get(PrismaService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('findAll', () => {
        it('should return all presentations for a user', async () => {
            (prisma.presentation.findMany as jest.Mock).mockResolvedValue([mockPresentation]);

            const result = await service.findAll('user-123');

            expect(result).toHaveLength(1);
            expect(result[0].title).toBe('Test Presentation');
            expect(prisma.presentation.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 'user-123' },
                }),
            );
        });
    });

    describe('findById', () => {
        it('should return a presentation by ID', async () => {
            (prisma.presentation.findUnique as jest.Mock).mockResolvedValue(mockPresentation);

            const result = await service.findById('pres-123');

            expect(result).toBeDefined();
            expect(result?.id).toBe('pres-123');
        });

        it('should return null if presentation not found', async () => {
            (prisma.presentation.findUnique as jest.Mock).mockResolvedValue(null);

            const result = await service.findById('unknown-id');

            expect(result).toBeNull();
        });
    });

    describe('create', () => {
        it('should create a new presentation', async () => {
            (prisma.presentation.create as jest.Mock).mockResolvedValue(mockPresentation);

            const result = await service.create('user-123', {
                title: 'Test Presentation',
                sourceType: 'TEXT',
            });

            expect(result).toBeDefined();
            expect(result.title).toBe('Test Presentation');
            expect(prisma.presentation.create).toHaveBeenCalled();
        });
    });

    describe('update', () => {
        it('should update a presentation', async () => {
            const updatedPresentation = { ...mockPresentation, title: 'Updated Title' };
            (prisma.presentation.update as jest.Mock).mockResolvedValue(updatedPresentation);

            const result = await service.update('pres-123', { title: 'Updated Title' });

            expect(result.title).toBe('Updated Title');
            expect(prisma.presentation.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'pres-123' },
                    data: { title: 'Updated Title' },
                }),
            );
        });
    });

    describe('delete', () => {
        it('should delete a presentation', async () => {
            (prisma.presentation.delete as jest.Mock).mockResolvedValue(mockPresentation);

            await service.delete('pres-123');

            expect(prisma.presentation.delete).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'pres-123' },
                }),
            );
        });
    });
});
