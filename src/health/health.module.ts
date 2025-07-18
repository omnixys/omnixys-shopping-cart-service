import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller.js';
import { KafkaIndicator } from './kafka.indicator.js';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [
        ConfigModule.forRoot({
            envFilePath: '.health.env',
            isGlobal: true,
        }),
        TerminusModule,
        TypeOrmModule,
    ],
    controllers: [HealthController],
    providers: [KafkaIndicator],
})
export class HealthModule {}
