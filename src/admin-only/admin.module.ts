import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [PrismaModule],
})
export class AdminModule {}
