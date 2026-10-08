import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UserModule } from './user/user.module.js';
import { TasksModule } from './task/task.module.js';
import { TaskListsModule } from './task-list/task-list.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';
import authConfig from './config/auth.config.js';
import { DatabaseModule } from './database.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { APP_FILTER } from '@nestjs/core';
import { Controller, Get } from '@nestjs/common';
import { ApiResponseDto } from './common/dto/api-response.dto.js';
import { Public } from './auth/decorators/public.decorator.js';

@Controller()
export class HealthController {
  @Public()
  @Get('health')
  health() {
    return ApiResponseDto.success('Service is healthy');
  }
}
@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60000'), // 60 secondes par défaut
        limit: parseInt(process.env.THROTTLE_LIMIT || '100'), // 100 requêtes par défaut
      },
    ]),
    AuthModule,
    UserModule,
    TasksModule,
    TaskListsModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
