import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { UserModule } from './user/user.module';
import { TasksModule } from './task/task.module';
import { TaskListsModule } from './task-list/task-list.module';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import authConfig from './config/auth.config';
import { PrismaService } from './prisma.service';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { Controller, Get } from '@nestjs/common';
import { ApiResponseDto } from './common/dto/api-response.dto';
import { Public } from './auth/decorators/public.decorator';

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
    PrismaService,
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
})
export class AppModule {}
