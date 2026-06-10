import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domain/entities/user.entity';
import { IUserRepository } from '../../domain/repositories/user.repository';
import { UserOrmEntity } from './user.orm-entity';

@Injectable()
export class TypeOrmUserRepository implements IUserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly repository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? this.toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? this.toDomain(entity) : null;
  }

  async save(user: User): Promise<User> {
    const plain = user.toPlain();
    const orm = this.repository.create({
      id: plain.id,
      email: plain.email,
      passwordHash: user.passwordHash,
      name: plain.name,
      role: plain.role,
      isActive: plain.isActive,
    });
    const saved = await this.repository.save(orm);
    return this.toDomain(saved);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return (await this.repository.count({ where: { email } })) > 0;
  }

  private toDomain(entity: UserOrmEntity): User {
    return User.reconstitute(
      entity.id,
      {
        email: entity.email,
        passwordHash: entity.passwordHash,
        name: entity.name,
        role: entity.role,
        isActive: entity.isActive,
      },
      entity.createdAt,
      entity.updatedAt,
    );
  }
}
