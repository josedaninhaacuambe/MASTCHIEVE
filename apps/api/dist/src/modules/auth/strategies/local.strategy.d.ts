import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
declare const LocalStrategy_base: new (...args: any[]) => Strategy;
export declare class LocalStrategy extends LocalStrategy_base {
    private authService;
    constructor(authService: AuthService);
    validate(email: string, password: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        email: string;
        password: string;
        role: string;
        lastLoginAt: Date | null;
        refreshToken: string | null;
        updatedAt: Date;
    }>;
}
export {};
