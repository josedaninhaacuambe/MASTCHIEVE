export declare enum ModuleLevel {
    BEGINNER = "BEGINNER",
    ELEMENTARY = "ELEMENTARY",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED",
    COMPETITIVE = "COMPETITIVE"
}
export declare class CreateSwimmingModuleDto {
    name: string;
    description?: string;
    level: ModuleLevel;
    order: number;
    skills?: string[];
}
export declare class UpdateProgressDto {
    status: string;
    notes?: string;
}
