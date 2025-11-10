import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [DatabaseModule],
})
export class AdminModule {}
