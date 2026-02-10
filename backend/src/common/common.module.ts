import { Module, Global } from '@nestjs/common';
import { RedisModule } from './redis/redis.module';
import { LoggerModule } from './logger/logger.module';
import { IdempotencyService } from './services/idempotency.service';
import { SignatureValidationService } from './services/signature-validation.service';
import { UsdcTokenService } from './services/usdc-token.service';
import { CeloCusdService } from './services/celo-cusd.service';
import { IdempotencyInterceptor } from './interceptors/idempotency.interceptor';

@Global()
@Module({
  imports: [RedisModule, LoggerModule],
  providers: [IdempotencyService, SignatureValidationService, UsdcTokenService, CeloCusdService, IdempotencyInterceptor],
  exports: [RedisModule, LoggerModule, IdempotencyService, SignatureValidationService, UsdcTokenService, CeloCusdService, IdempotencyInterceptor],
})
export class CommonModule {}
