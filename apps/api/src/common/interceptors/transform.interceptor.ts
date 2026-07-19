import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: Record<string, any>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    return next.handle().pipe(
      map((data) => {
        if (data && typeof data === 'object' && 'success' in data) return data;
        const isPreWrapped = data && typeof data === 'object' && Array.isArray(data.data);
        return {
          success: true,
          data: isPreWrapped ? data.data : data,
          message: isPreWrapped ? data.message : undefined,
          meta: isPreWrapped ? data.meta : undefined,
        };
      }),
    );
  }
}
