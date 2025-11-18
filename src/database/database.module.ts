
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

const dbProvider = {
  provide: 'DATABASE_POOL',
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const pool = new Pool({
      connectionString: configService.get<string>('DATABASE_URL'),
      max: 20, // Maximum pool size
      min: 2, // Minimum pool size
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection cannot be established
      maxUses: 7500, // Close and replace a connection after it has been used 7500 times
      statement_timeout: 30000, // Terminate any statement that takes more than 30 seconds
      query_timeout: 30000, // Query timeout (30 seconds)
      keepAlive: true, // Enable TCP keep-alive
      keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10 seconds
    });

    // Handle pool errors
    pool.on('error', (err, client) => {
      console.error('Unexpected error on idle client', err);
    });

    return pool;
  },
};

@Module({
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DatabaseModule {}
