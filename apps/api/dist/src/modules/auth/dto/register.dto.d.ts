export declare const RoleValues: readonly ["ADMIN", "INSTRUCTOR", "STUDENT", "PARENT", "FINANCIAL", "MANAGER", "VISITOR"];
export declare class RegisterDto {
    email: string;
    password: string;
    role: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth?: Date;
    gender?: string;
}
export declare class RegisterVisitorDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
}
