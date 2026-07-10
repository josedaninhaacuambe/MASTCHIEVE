export declare enum AttendanceStatus {
    PRESENT = "PRESENT",
    ABSENT = "ABSENT",
    LATE = "LATE",
    EXCUSED = "EXCUSED"
}
export declare class AttendanceRecordDto {
    studentId: string;
    status: AttendanceStatus;
    notes?: string;
}
export declare class BulkAttendanceDto {
    records: AttendanceRecordDto[];
}
