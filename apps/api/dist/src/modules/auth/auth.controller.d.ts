import { AuthService } from './auth.service';
import { RegisterDto, RegisterVisitorDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    registerVisitor(dto: RegisterVisitorDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    googleAuth(credential: string): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    refresh(user: any): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    logout(userId: string): Promise<void>;
    me(user: any): any;
}
