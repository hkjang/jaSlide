import { Module } from '@nestjs/common';
import { AdminPoliciesController } from './admin-policies.controller';
import { AdminPoliciesService } from './admin-policies.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [AdminPoliciesController],
    providers: [AdminPoliciesService],
    exports: [AdminPoliciesService],
})
export class AdminPoliciesModule { }
