export declare enum ClassLevel {
    BEGINNER = "BEGINNER",
    ELEMENTARY = "ELEMENTARY",
    INTERMEDIATE = "INTERMEDIATE",
    ADVANCED = "ADVANCED",
    COMPETITIVE = "COMPETITIVE"
}
export declare class CreateClassDto {
    name: string;
    level: ClassLevel;
    maxStudents: number;
    description?: string;
    poolLane?: string;
    instructorId: string;
}
export declare class CreateSessionDto {
    sessionDate: string;
    startTime?: string;
    endTime?: string;
    topic?: string;
}
