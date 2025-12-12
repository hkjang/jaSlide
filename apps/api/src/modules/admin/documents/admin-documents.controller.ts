import { Controller, Get, Delete, Param, Query, UseGuards } from '@nestjs/common';
import { AdminDocumentsService } from './admin-documents.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { AdminDocumentFilterDto } from '../dto';

@Controller('admin/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminDocumentsController {
    constructor(private documentsService: AdminDocumentsService) { }

    @Get()
    async findAll(@Query() filter: AdminDocumentFilterDto) {
        return this.documentsService.findAll(filter);
    }

    @Get(':id')
    async findById(@Param('id') id: string) {
        return this.documentsService.findById(id);
    }

    @Delete(':id')
    async delete(@Param('id') id: string) {
        return this.documentsService.delete(id);
    }
}
