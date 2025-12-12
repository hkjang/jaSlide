import { Module } from '@nestjs/common';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { StorageService } from './storage.service';
import { ChartService } from './chart.service';
import { BrandingService } from './branding.service';

@Module({
    controllers: [AssetsController],
    providers: [AssetsService, StorageService, ChartService, BrandingService],
    exports: [AssetsService, StorageService, ChartService, BrandingService],
})
export class AssetsModule { }


