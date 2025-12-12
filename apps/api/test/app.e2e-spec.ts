import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('API E2E Tests', () => {
    let app: INestApplication;
    let prisma: PrismaService;
    let authToken: string;
    let testUserId: string;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true }));
        await app.init();

        prisma = app.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        // Cleanup test data
        if (testUserId) {
            await prisma.user.delete({ where: { id: testUserId } }).catch(() => { });
        }
        await app.close();
    });

    describe('Health Check', () => {
        it('GET /health should return healthy status', () => {
            return request(app.getHttpServer())
                .get('/health')
                .expect(200)
                .expect((res) => {
                    expect(res.body).toHaveProperty('status');
                });
        });

        it('GET /health/live should return ok', () => {
            return request(app.getHttpServer())
                .get('/health/live')
                .expect(200)
                .expect((res) => {
                    expect(res.body.status).toBe('ok');
                });
        });
    });

    describe('Authentication', () => {
        const testUser = {
            email: `test-${Date.now()}@example.com`,
            password: 'TestPassword123!',
            name: 'E2E Test User',
        };

        it('POST /auth/register should create a new user', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/register')
                .send(testUser)
                .expect(201);

            expect(response.body).toHaveProperty('accessToken');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.email).toBe(testUser.email);

            authToken = response.body.accessToken;
            testUserId = response.body.user.id;
        });

        it('POST /auth/login should authenticate user', async () => {
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({
                    email: testUser.email,
                    password: testUser.password,
                })
                .expect(200);

            expect(response.body).toHaveProperty('accessToken');
            authToken = response.body.accessToken;
        });

        it('GET /auth/me should return current user', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/me')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.email).toBe(testUser.email);
        });

        it('should reject requests without auth token', () => {
            return request(app.getHttpServer())
                .get('/presentations')
                .expect(401);
        });
    });

    describe('Presentations', () => {
        let presentationId: string;

        it('POST /presentations should create a new presentation', async () => {
            const response = await request(app.getHttpServer())
                .post('/presentations')
                .set('Authorization', `Bearer ${authToken}`)
                .send({
                    title: 'E2E Test Presentation',
                    sourceType: 'TEXT',
                    sourceContent: 'Test content for E2E testing',
                })
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe('E2E Test Presentation');
            presentationId = response.body.id;
        });

        it('GET /presentations should return user presentations', async () => {
            const response = await request(app.getHttpServer())
                .get('/presentations')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
            expect(response.body.length).toBeGreaterThan(0);
        });

        it('GET /presentations/:id should return specific presentation', async () => {
            const response = await request(app.getHttpServer())
                .get(`/presentations/${presentationId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.id).toBe(presentationId);
        });

        it('PATCH /presentations/:id should update presentation', async () => {
            const response = await request(app.getHttpServer())
                .patch(`/presentations/${presentationId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({ title: 'Updated E2E Presentation' })
                .expect(200);

            expect(response.body.title).toBe('Updated E2E Presentation');
        });

        it('DELETE /presentations/:id should delete presentation', async () => {
            await request(app.getHttpServer())
                .delete(`/presentations/${presentationId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Verify deletion
            await request(app.getHttpServer())
                .get(`/presentations/${presentationId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('Templates', () => {
        it('GET /templates should return available templates', async () => {
            const response = await request(app.getHttpServer())
                .get('/templates')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Credits', () => {
        it('GET /credits/balance should return user balance', async () => {
            const response = await request(app.getHttpServer())
                .get('/credits/balance')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('balance');
            expect(typeof response.body.balance).toBe('number');
        });

        it('GET /credits/history should return transaction history', async () => {
            const response = await request(app.getHttpServer())
                .get('/credits/history')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('Assets', () => {
        it('GET /assets should return user assets', async () => {
            const response = await request(app.getHttpServer())
                .get('/assets')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });
});
