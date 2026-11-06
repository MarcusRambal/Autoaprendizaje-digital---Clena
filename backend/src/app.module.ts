import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { ConfigModule } from './shared/config/config.module';
import { LoggerModule } from './shared/logging/logger.module';

@Module({
  imports: [ConfigModule, LoggerModule, HealthModule, AuthModule],
})
export class AppModule {}
