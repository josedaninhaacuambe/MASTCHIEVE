export declare class RecordPerformanceDto {
    studentId: string;
    sessionId?: string;
    instructorId?: string;
    technique?: number;
    stamina?: number;
    speed?: number;
    coordination?: number;
    breathing?: number;
    turns?: number;
    startDive?: number;
    instructorNotes?: string;
}
export declare class ReviewFeedbackDto {
    instructorNotes: string;
    approve: boolean;
}
