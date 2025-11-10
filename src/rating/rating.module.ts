import { Module } from '@nestjs/common';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  controllers: [RatingController],
  providers: [RatingService],
  imports: [DatabaseModule],
})
export class RatingModule {}
