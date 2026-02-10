import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumberString, IsOptional } from 'class-validator';

export class SettleReserveDto {
  @ApiPropertyOptional({ description: 'Minimum net USDC delta required before reserving (default 1.0)' })
  @IsOptional()
  @IsNumberString()
  minDeltaUsdc?: string;

  @ApiPropertyOptional({ description: 'Max cUSD to send to reserve in this call (default = delta)' })
  @IsOptional()
  @IsNumberString()
  maxAmountCusd?: string;

  @ApiPropertyOptional({ description: 'Override reserve address for this call (default = agent.reserveAddress or CELO_RESERVE_ADDRESS)' })
  @IsOptional()
  reserveAddress?: string;
}
