import { Module } from '@nestjs/common';
import { NetworkScanModule } from './network-scan.module';

@Module({
  imports: [NetworkScanModule],
})
export class AppModule {}
