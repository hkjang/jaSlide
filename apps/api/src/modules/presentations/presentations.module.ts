import { Module } from '@nestjs/common';
import { PresentationsController } from './presentations.controller';
import { PresentationsService } from './presentations.service';
import { PresentationsGateway } from './presentations.gateway';

@Module({
    controllers: [PresentationsController],
    providers: [PresentationsService, PresentationsGateway],
    exports: [PresentationsService],
})
export class PresentationsModule { }

