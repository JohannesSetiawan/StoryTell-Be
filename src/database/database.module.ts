import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
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
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
        synchronize: false, // Never use synchronize in production
        logging: process.env.NODE_ENV === 'development',
        entities: [], // Using raw queries through Pool
        migrations: ['dist/migrations/**/*.js'],
        migrationsRun: false, // Don't auto-run migrations
        extra: {
          max: 20,
          min: 2,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
          statement_timeout: 30000,
          query_timeout: 30000,
        },
      }),
    }),
  ],
  providers: [dbProvider],
  exports: [dbProvider],
})
export class DatabaseModule {}