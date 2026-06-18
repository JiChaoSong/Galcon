import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { Prisma } from '@prisma/client'
import type { Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = '服务器内部错误'

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      message =
        typeof res === 'string'
          ? res
          : (res as any).message ?? res
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025':
          status = HttpStatus.NOT_FOUND
          message = '资源不存在'
          break
        case 'P2002':
          status = HttpStatus.CONFLICT
          message = '数据冲突，可能已存在重复记录'
          break
        default:
          this.logger.error(`Prisma error ${exception.code}:`, exception.message)
          message = '数据库异常'
      }
    } else {
      this.logger.error('Unhandled exception:', exception)
    }

    response.status(status).json({
      code: status,
      message: Array.isArray(message) ? message : [message],
      timestamp: new Date().toISOString(),
    })
  }
}
