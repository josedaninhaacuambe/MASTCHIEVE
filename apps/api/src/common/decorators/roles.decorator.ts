import { SetMetadata } from '@nestjs/common';

export type AppRole =
  | 'ADMIN'
  | 'INSTRUCTOR'
  | 'STUDENT'
  | 'PARENT'
  | 'FINANCIAL'
  | 'MANAGER'
  | 'VISITOR'
  | 'GESTOR_RH'
  | 'SUPER_ADMIN'
  | 'ASSISTENTE_ADMIN';
export const ROLES_KEY = 'roles';
export const Roles = (...roles: AppRole[]) => SetMetadata(ROLES_KEY, roles);
