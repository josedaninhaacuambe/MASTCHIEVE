export declare class EmailService {
    private readonly logger;
    private transporter;
    constructor();
    sendPaymentReminder(to: string, studentName: string, amount: number, dueDate: string): Promise<void>;
    sendFeedbackReady(to: string, studentName: string, feedbackPreview: string): Promise<void>;
    sendWelcome(to: string, firstName: string, role: string): Promise<void>;
}
