import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { GuidesModule } from './modules/guides/guides.module';
import { UsersModule } from './modules/users/users.module';
import { HelpRequestsModule } from './modules/help-requests/help-requests.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { ConfigModule } from './shared/config/config.module';
import { LoggerModule } from './shared/logging/logger.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule,
    HealthModule,
    AuthModule,
    CategoriesModule,
    GuidesModule,
    HelpRequestsModule,
    LessonsModule,
    UsersModule,
  ],
})
export class AppModule {}
