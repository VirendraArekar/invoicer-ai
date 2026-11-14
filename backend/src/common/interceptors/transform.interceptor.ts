import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    // If response is a Stream (e.g. PDF download, CSV export), don't transform
    const res = context.switchToHttp().getResponse();
    if (res.getHeader && (res.getHeader('content-type') === 'application/pdf' || res.getHeader('content-type') === 'text/csv')) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        // If data is already in standard ApiResponse format or Buffer/Stream, return as is
        if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
          return data;
        }
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
