import { IsBoolean, IsOptional, IsString, IsIn, IsEthereumAddress } from 'class-validator';

export class CreateAgentDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  strategyType?: string;

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  riskLevel?: 'low' | 'medium' | 'high';

  @IsOptional()
  @IsString()
  personality?: string;

  @IsOptional()
  @IsBoolean()
  tradingEnabled?: boolean;

  @IsOptional()
  @IsEthereumAddress()
  reserveAddress?: string;
}
