import { NestFactory } from '@nestjs/core'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'
import { HttpExceptionFilter } from './common/http-exception.filter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter())

  // CORS：允许前端开发服务器
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
  })

  // 全局前缀
  app.setGlobalPrefix('api')

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('GEO Workbench API')
    .setDescription('GEO 诊断工作台后端接口')
    .setVersion('0.1')
    .build()
  const doc = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, doc)

  const port = process.env.PORT || 3000
  await app.listen(port)
  console.log(`Server running on http://localhost:${port}`)
  console.log(`Swagger docs: http://localhost:${port}/api/docs`)
}
bootstrap()
