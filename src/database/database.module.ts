
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

const dbProvider = {
  provide: 'DATABASE_POOL',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    return new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
    });
  },
};

@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DatabaseModule {}
