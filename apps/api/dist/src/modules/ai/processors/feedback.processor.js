"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FeedbackProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FeedbackProcessor = void 0;
const bull_1 = require("@nestjs/bull");
const common_1 = require("@nestjs/common");
const ai_service_1 = require("../ai.service");
let FeedbackProcessor = FeedbackProcessor_1 = class FeedbackProcessor {
    constructor(aiService) {
        this.aiService = aiService;
        this.logger = new common_1.Logger(FeedbackProcessor_1.name);
    }
    async handleFeedbackGeneration(job) {
        this.logger.log(`Processing feedback job ${job.id} for record ${job.data.performanceRecordId}`);
        try {
            const feedback = await this.aiService.generateFeedback(job.data.performanceRecordId);
            this.logger.log(`Feedback job ${job.id} completed`);
            return { success: true, feedback };
        }
        catch (error) {
            this.logger.error(`Feedback job ${job.id} failed: ${error.message}`);
            throw error;
        }
    }
};
exports.FeedbackProcessor = FeedbackProcessor;
__decorate([
    (0, bull_1.Process)('generate-feedback'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FeedbackProcessor.prototype, "handleFeedbackGeneration", null);
exports.FeedbackProcessor = FeedbackProcessor = FeedbackProcessor_1 = __decorate([
    (0, bull_1.Processor)('feedback'),
    __metadata("design:paramtypes", [ai_service_1.AiService])
], FeedbackProcessor);
//# sourceMappingURL=feedback.processor.js.map