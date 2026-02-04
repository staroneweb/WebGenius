import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role, RoleName } from '../entities/role.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
  ) {}

  async initializeDefaultRoles() {
    const roles = [
      {
        name: RoleName.USER,
        permissions: ['read:own', 'write:own'],
      },
      {
        name: RoleName.ADMIN,
        permissions: ['read:all', 'write:all', 'delete:all', 'manage:subscriptions', 'manage:users'],
      },
      {
        name: RoleName.SUPERADMIN,
        permissions: ['read:all', 'write:all', 'delete:all', 'manage:subscriptions', 'manage:users', 'manage:roles', 'manage:system'],
      },
    ];

    for (const roleData of roles) {
      const existingRole = await this.roleRepository.findOne({
        where: { name: roleData.name },
      });
      if (!existingRole) {
        const role = this.roleRepository.create(roleData);
        await this.roleRepository.save(role);
      }
    }
  }

  async getAllRoles() {
    return this.roleRepository.find();
  }
}

