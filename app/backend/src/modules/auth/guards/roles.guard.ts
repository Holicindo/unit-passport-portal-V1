import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    if (!user || !user.role) {
      return false;
    }

    // SUPER_ADMIN has full access to all roles
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // ADMIN has access to any ADMIN required endpoint
    if (user.role === UserRole.ADMIN && requiredRoles.includes(UserRole.ADMIN)) {
      return true;
    }

    // PARTNER and MECHANIC can access technician/partner endpoints
    if (
      (user.role === UserRole.PARTNER || user.role === UserRole.MECHANIC) &&
      (requiredRoles.includes(UserRole.PARTNER) || requiredRoles.includes(UserRole.MECHANIC))
    ) {
      return true;
    }

    return requiredRoles.some((role) => user.role === role);
  }
}

