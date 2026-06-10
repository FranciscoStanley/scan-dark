import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DATABASE_CONFIG, DATABASE_SYNC } from '@scandark/config';
import { JwtAuthModule } from '@scandark/nest-auth';
import { DeviceDiscoveryController } from './presentation/controllers/device-discovery.controller';
import { NETWORK_DEVICE_REPOSITORY } from './domain/repositories/network-device.repository';
import { TypeOrmNetworkDeviceRepository } from './infrastructure/persistence/typeorm-network-device.repository';
import { NetworkDeviceOrmEntity } from './infrastructure/persistence/network-device.orm-entity';
import {
  FingerprintDeviceUseCase,
  ListDevicesUseCase,
  ListDevicesByScanUseCase,
} from './application/use-cases/device-discovery.use-cases';

@Module({
  imports: [
    JwtAuthModule,
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: DATABASE_CONFIG.URL,
      entities: [NetworkDeviceOrmEntity],
      synchronize: DATABASE_SYNC,
      logging: process.env.NODE_ENV === 'development',
    }),
    TypeOrmModule.forFeature([NetworkDeviceOrmEntity]),
  ],
  controllers: [DeviceDiscoveryController],
  providers: [
    { provide: NETWORK_DEVICE_REPOSITORY, useClass: TypeOrmNetworkDeviceRepository },
    {
      provide: FingerprintDeviceUseCase,
      useFactory: (repo: TypeOrmNetworkDeviceRepository) => new FingerprintDeviceUseCase(repo),
      inject: [NETWORK_DEVICE_REPOSITORY],
    },
    {
      provide: ListDevicesUseCase,
      useFactory: (repo: TypeOrmNetworkDeviceRepository) => new ListDevicesUseCase(repo),
      inject: [NETWORK_DEVICE_REPOSITORY],
    },
    {
      provide: ListDevicesByScanUseCase,
      useFactory: (repo: TypeOrmNetworkDeviceRepository) => new ListDevicesByScanUseCase(repo),
      inject: [NETWORK_DEVICE_REPOSITORY],
    },
  ],
})
export class AppModule {}
