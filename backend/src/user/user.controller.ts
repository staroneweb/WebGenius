import { Controller, Get, Put, Body, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../entities/user.entity';

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  async getProfile(@CurrentUser() user: User) {
    const userId = (user as any)._id?.toString() || (user as any).id?.toString();
    const fullUser = await this.userService.findById(userId);
    const { password, ...result } = fullUser;
    return { ...result, id: (fullUser as any)._id?.toString() || (fullUser as any).id?.toString() };
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateData: Partial<User>,
  ) {
    const userId = (user as any)._id?.toString() || (user as any).id?.toString();
    const updated = await this.userService.updateProfile(userId, updateData);
    return { ...updated, id: (updated as any)._id?.toString() || (updated as any).id?.toString() };
  }
}

