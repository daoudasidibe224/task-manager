import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import authConfig from './config/auth.config';
import { PrismaService } from './prisma.service';
import { Controller } from '@nestjs/common';

@Controller()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [authConfig],
    }),
  ],
  controllers: [],
  providers: [PrismaService],
})
export class AppModule {}
