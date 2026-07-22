import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user || !user.rol) {
      throw new ForbiddenException('No tiene permisos asignados.');
    }

    const hasRole = requiredRoles.some((role) => user.rol.toLowerCase() === role.toLowerCase());

    if (!hasRole) {
      throw new ForbiddenException(`Requiere rol de [${requiredRoles.join(', ')}] para realizar esta acción.`);
    }

    return true;
  }
}
