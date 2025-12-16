import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminSecurityPoliciesController } from './admin-security-policies.controller';
import { AdminSecurityPoliciesService } from './admin-security-policies.service';

@Module({
    imports: [PrismaModule],
    controllers: [AdminSecurityPoliciesController],
    providers: [AdminSecurityPoliciesService],
    exports: [AdminSecurityPoliciesService],
})
export class AdminSecurityPoliciesModule { }
