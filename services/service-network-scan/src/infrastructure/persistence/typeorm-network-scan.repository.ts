import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NetworkScan, ScanResults } from '../../domain/entities/network-scan.entity';
import { INetworkScanRepository } from '../../domain/repositories/network-scan.repository';
import { NetworkScanOrmEntity } from './network-scan.orm-entity';

@Injectable()
export class TypeOrmNetworkScanRepository implements INetworkScanRepository {
  constructor(
    @InjectRepository(NetworkScanOrmEntity)
    private readonly repository: Repository<NetworkScanOrmEntity>,
  ) {}

  async findById(id: string): Promise<NetworkScan | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByUserId(userId: string): Promise<NetworkScan[]> {
    const entities = await this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entities.map((e) => this.toDomain(e));
  }

  async save(scan: NetworkScan): Promise<NetworkScan> {
    const plain = scan.toPlain();
    const orm = this.repository.create({
      id: plain.id,
      name: plain.name,
      type: plain.type,
      targetNetwork: plain.targetNetwork,
      cidr: plain.cidr,
      ports: plain.ports,
      status: plain.status,
      progress: plain.progress,
      results: plain.results as Record<string, unknown> | undefined,
      errorMessage: plain.errorMessage,
      userId: plain.userId,
    });
    const saved = await this.repository.save(orm);
    return this.toDomain(saved);
  }

  private toDomain(entity: NetworkScanOrmEntity): NetworkScan {
    return NetworkScan.reconstitute(
      entity.id,
      {
        name: entity.name,
        type: entity.type,
        targetNetwork: entity.targetNetwork,
        cidr: entity.cidr,
        ports: entity.ports,
        status: entity.status,
        progress: entity.progress,
        results: entity.results as ScanResults | undefined,
        errorMessage: entity.errorMessage,
        userId: entity.userId,
      },
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
