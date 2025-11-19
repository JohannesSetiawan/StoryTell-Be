import { Module } from '@nestjs/common';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
