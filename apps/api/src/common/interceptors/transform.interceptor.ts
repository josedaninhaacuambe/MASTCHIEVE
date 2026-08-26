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
        const payload = isPreWrapped ? data.data : data;

        const response: any = {
          success: true,
          data: payload,
          message: isPreWrapped ? data.message : undefined,
          meta: isPreWrapped ? data.meta : undefined,
        };

        /*
         * Compatibilidade temporária com builds antigos do frontend.
         *
         * Novo frontend:
         *   response.data.data.user
         *
         * Frontend antigo:
         *   response.data.user
         *
         * Não altera JWT, utilizador ou autenticação.
         */
        if (
          payload &&
          typeof payload === 'object' &&
          payload.user &&
          payload.accessToken
        ) {
          response.user = payload.user;
          response.accessToken = payload.accessToken;

          if (payload.refreshToken) {
            response.refreshToken = payload.refreshToken;
          }
        }

        return response;
      }),
    );
  }
}
