import {MiddlewareConsumer, Module, NestModule} from '@nestjs/common';
import {ConfigModule} from '@nestjs/config';
import {APP_GUARD} from '@nestjs/core';
import {AccessTokenGuard} from './auth/access-token.guard';
import {AuthModule} from './auth/auth.module';
import {ProblemDetailsFilter} from './common/filters/problem-details.filter';
import {RequestContextMiddleware} from './common/middleware/request-context.middleware';
import {GlobalModule} from './global/global.module';
import {RavenDbModule} from './infrastructure/ravendb/ravendb.module';
import {LocationModule} from './location/location.module';
import {PartModule} from './part/part.module';
import {SystemHealthModule} from './ping/systemhealth.module';
import {UserModule} from './user/user.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    RavenDbModule,

    // Feature Modules
    AuthModule,
    GlobalModule,
    SystemHealthModule,
    UserModule,
    LocationModule,
    PartModule,
  ],
  controllers: [],
  providers: [
    ProblemDetailsFilter,
    // Apply AccessTokenGuard globally to all routes
    {
      provide: APP_GUARD,
      useClass: AccessTokenGuard,
    },
  ],
})
export class AppModule implements NestModule {
  public configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
