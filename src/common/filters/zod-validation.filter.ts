import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { ZodValidationException } from 'nestjs-zod';

@Catch(ZodValidationException)
export class ZodValidationFilter implements ExceptionFilter {
  catch(exception: ZodValidationException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const errorResponse = {
      error: {
        code: 'VALIDATION_ERROR',
        msg: 'Invalid data submitted',
      },
    };

    response.status(HttpStatus.BAD_REQUEST).json(errorResponse);
  }
}
