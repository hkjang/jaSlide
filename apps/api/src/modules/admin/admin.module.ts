import { Module } from '@nestjs/common';
import { AdminUsersModule } from './users/admin-users.module';
import { AdminOrganizationsModule } from './organizations/admin-organizations.module';
import { AdminRolesModule } from './roles/admin-roles.module';
import { AdminCreditsModule } from './credits/admin-credits.module';
import { AdminTemplatesModule } from './templates/admin-templates.module';
import { AdminModelsModule } from './models/admin-models.module';
import { AdminPromptsModule } from './prompts/admin-prompts.module';
import { AdminAssetsModule } from './assets/admin-assets.module';
import { AdminJobsModule } from './jobs/admin-jobs.module';
import { AdminDocumentsModule } from './documents/admin-documents.module';
import { AdminPoliciesModule } from './policies/admin-policies.module';
import { AdminLogsModule } from './logs/admin-logs.module';
import { AdminOperationsModule } from './operations/admin-operations.module';
import { AdminAlertsModule } from './alerts/admin-alerts.module';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminDashboardService } from './admin-dashboard.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [
        PrismaModule,
        AdminUsersModule,
        AdminOrganizationsModule,
        AdminRolesModule,
        AdminCreditsModule,
        AdminTemplatesModule,
        AdminModelsModule,
        AdminPromptsModule,
        AdminAssetsModule,
        AdminJobsModule,
        AdminDocumentsModule,
        AdminPoliciesModule,
        AdminLogsModule,
        AdminOperationsModule,
        AdminAlertsModule,
    ],
    controllers: [AdminDashboardController],
    providers: [AdminDashboardService],
})
export class AdminModule { }
