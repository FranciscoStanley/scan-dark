import { existsSync, readFileSync, statSync } from 'fs';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { FIREWALL_LOG_CONFIG } from '@scandark/config';
import { IngestFirewallLogsUseCase } from '../../application/use-cases/threat-detection.use-cases';

@Injectable()
export class FirewallLogWatcher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(FirewallLogWatcher.name);
  private timer?: NodeJS.Timeout;
  private filePosition = 0;
  private watching = false;

  constructor(private readonly ingestLogs: IngestFirewallLogsUseCase) {}

  onModuleInit(): void {
    if (!FIREWALL_LOG_CONFIG.ENABLED) {
      this.logger.log('Firewall log ingestion disabled');
      return;
    }

    if (!FIREWALL_LOG_CONFIG.PATH) {
      this.logger.warn('FIREWALL_LOG_ENABLED=true but FIREWALL_LOG_PATH is empty');
      return;
    }

    this.watching = true;
    this.timer = setInterval(() => this.poll(), FIREWALL_LOG_CONFIG.POLL_MS);
    this.logger.log(`Watching firewall log: ${FIREWALL_LOG_CONFIG.PATH}`);
    this.poll();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  isWatching(): boolean {
    return this.watching;
  }

  private async poll(): Promise<void> {
    const path = FIREWALL_LOG_CONFIG.PATH;
    if (!path || !existsSync(path)) return;

    try {
      const stats = statSync(path);
      if (stats.size < this.filePosition) {
        this.filePosition = 0;
      }

      if (stats.size === this.filePosition) return;

      const buffer = readFileSync(path);
      const chunk = buffer.subarray(this.filePosition).toString('utf8');
      this.filePosition = stats.size;

      const lines = chunk
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter((line) => line.length > 0 && !line.startsWith('#') && !line.startsWith('//'));
      if (lines.length === 0) return;

      await this.ingestLogs.execute({ lines });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.ingestLogs.recordError(message);
      this.logger.warn(`Firewall log poll failed: ${message}`);
    }
  }
}
