import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { getAddress } from '@ethersproject/address';

type GasFeeResponse = {
  estimatedGasMatic: string;
  estimatedGasUsd: string;
  gasPriceGwei: string;
  note: string;
};

type GasFee = {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
};

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function transferFrom(address from, address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
] as const;

@Injectable()
export class UsdcTokenService {
  private readonly logger = new Logger(UsdcTokenService.name);
  private readonly provider?: StaticJsonRpcProvider;
  private readonly serverWallet?: Wallet;
  private readonly funderAddress?: string;
  private readonly usdcAddress?: string;
  private readonly usdcContract?: Contract;
  private readonly rpcUrl?: string;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('polymarket.rpcUrl');
    const privateKey = this.configService.get<string>('polymarket.walletPrivateKey');

    this.funderAddress = this.configService.get<string>('polymarket.funderAddress');
    this.usdcAddress = this.configService.get<string>('polymarket.usdcAddress') || '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359';
    this.rpcUrl = rpcUrl;

    if (!rpcUrl || !privateKey) {
      // This service is used by the trading stack; allow the app to boot (e.g. Swagger generation)
      // even when trading env vars are not configured.
      this.logger.warn('UsdcTokenService not fully configured (missing POLYMARKET_RPC_URL or POLYMARKET_WALLET_PRIVATE_KEY). USDC methods will throw until configured.');
      return;
    }

    this.provider = new StaticJsonRpcProvider(rpcUrl, { name: 'matic', chainId: 137 });
    this.serverWallet = new Wallet(privateKey, this.provider);
    this.usdcContract = new Contract(this.usdcAddress, ERC20_ABI, this.provider);
  }

  private requireConfigured() {
    if (!this.provider || !this.serverWallet || !this.usdcContract || !this.funderAddress || !this.usdcAddress || !this.rpcUrl) {
      throw new Error('USDC service not configured');
    }
    return {
      provider: this.provider,
      serverWallet: this.serverWallet,
      usdcContract: this.usdcContract,
      funderAddress: this.funderAddress,
      usdcAddress: this.usdcAddress,
      rpcUrl: this.rpcUrl,
    };
  }

  async getBalance(address: string): Promise<string> {
    const { usdcContract } = this.requireConfigured();
    try {
      const checksumAddress = getAddress(address);
      const balance = await usdcContract.balanceOf(checksumAddress);
      const decimals = await usdcContract.decimals();
      const balanceFormatted = (Number(balance) / 10 ** decimals).toString();
      return balanceFormatted;
    } catch (error) {
      this.logger.error(`Failed to get USDC balance for ${address}: ${(error as Error).message}`);
      throw error;
    }
  }

  async getAllowance(userAddress: string): Promise<string> {
    const { usdcContract, serverWallet } = this.requireConfigured();
    try {
      const allowance = await usdcContract.allowance(userAddress, serverWallet.address);
      const decimals = await usdcContract.decimals();
      return (Number(allowance) / 10 ** decimals).toString();
    } catch (error) {
      this.logger.error(`Failed to get USDC allowance for ${userAddress}: ${(error as Error).message}`);
      throw error;
    }
  }

  async getServerWalletMaticBalance(): Promise<string> {
    const { provider, serverWallet } = this.requireConfigured();
    try {
      const balance = await provider.getBalance(serverWallet.address);

      const balanceFormatted = (Number(balance) / 10 ** 18).toString();

      this.logger.debug(`Server wallet MATIC balance: ${balanceFormatted} MATIC (${balance.toString()} wei)`);
      return balanceFormatted;
    } catch (error) {
      this.logger.error(`Failed to get server wallet MATIC balance: ${(error as Error).message}`);
      throw error;
    }
  }

  private async getGasPrices(): Promise<GasFee> {
    const { provider } = this.requireConfigured();
    const feeData = await provider.getFeeData();

    const minPriorityFee = BigInt('25000000000');
    const minBaseFee = BigInt('30000000000');

    const networkPriorityFee = feeData.maxPriorityFeePerGas ? BigInt(feeData.maxPriorityFeePerGas.toString()) : null;
    const networkBaseFee = feeData.maxFeePerGas ? BigInt(feeData.maxFeePerGas.toString()) : null;

    const maxPriorityFeePerGas = networkPriorityFee && networkPriorityFee > minPriorityFee ? networkPriorityFee : minPriorityFee;

    const maxFeePerGas = networkBaseFee && networkBaseFee > minBaseFee ? networkBaseFee : maxPriorityFeePerGas + minBaseFee;

    return {
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
  }

  async transferFromUser(userAddress: string, amount: string): Promise<string> {
    const { usdcContract, serverWallet, funderAddress } = this.requireConfigured();
    try {
      const maticBalance = await this.getServerWalletMaticBalance();

      const minMaticRequired = 0.01;

      if (parseFloat(maticBalance) < minMaticRequired) {
        throw new Error(`Server wallet has insufficient MATIC for gas fees. Current balance: ${maticBalance} MATIC. Please fund the server wallet address: ${serverWallet.address}`);
      }

      const decimals = await usdcContract.decimals();
      const amountWei = BigInt(Math.floor(parseFloat(amount) * 10 ** decimals));

      const allowance = await usdcContract.allowance(userAddress, serverWallet.address);
      if (allowance < amountWei) {
        throw new Error(`Insufficient allowance. User has approved ${allowance.toString()}, but need ${amountWei.toString()}`);
      }

      const { maxFeePerGas, maxPriorityFeePerGas } = await this.getGasPrices();

      const contractWithSigner = usdcContract.connect(serverWallet);
      const tx = await contractWithSigner.transferFrom(userAddress, funderAddress, amountWei, {
        maxFeePerGas,
        maxPriorityFeePerGas,
      });

      this.logger.log(`Transferring ${amount} USDC from ${userAddress} to ${funderAddress}. Tx: ${tx.hash}`);

      const receipt = await tx.wait();
      this.logger.log(`Transfer completed. Block: ${receipt.blockNumber}`);

      return tx.hash;
    } catch (error) {
      const errorMessage = (error as Error).message;
      this.logger.error(`Failed to transfer USDC from ${userAddress}: ${errorMessage}`);

      if (errorMessage.includes('insufficient funds') || errorMessage.includes('INSUFFICIENT_FUNDS')) {
        throw new Error(
          `Server wallet has insufficient MATIC for gas fees. Please fund the server wallet address ${serverWallet.address} with MATIC (Polygon's native token) to pay for transaction gas fees.`,
        );
      }

      throw error;
    }
  }

  getFunderAddress(): string {
    return this.requireConfigured().funderAddress;
  }

  getServerWalletAddress(): string {
    return this.requireConfigured().serverWallet.address;
  }

  getUsdcAddress(): string {
    return this.requireConfigured().usdcAddress;
  }

  getRpcUrl(): string {
    return this.requireConfigured().rpcUrl;
  }

  async estimateGasFees(): Promise<GasFeeResponse> {
    try {
      const { maxFeePerGas } = await this.getGasPrices();

      const estimatedGasLimit = BigInt('65000');
      const estimatedTotalGas = maxFeePerGas * estimatedGasLimit;

      const estimatedGasMatic = (Number(estimatedTotalGas) / 10 ** 18).toFixed(6);

      const maticPriceUsd = 0.1;
      const estimatedGasUsd = (parseFloat(estimatedGasMatic) * maticPriceUsd).toFixed(4);

      const gasPriceGwei = (Number(maxFeePerGas) / 10 ** 9).toFixed(2);

      return {
        estimatedGasMatic,
        estimatedGasUsd,
        gasPriceGwei,
        note: 'Gas fees are included in the order amount. This is an estimate.',
      };
    } catch (error) {
      this.logger.error(`Failed to estimate gas fees: ${(error as Error).message}`);
      return {
        estimatedGasMatic: '0.003',
        estimatedGasUsd: '0.0003',
        gasPriceGwei: '55.00',
        note: 'Gas fees are included in the order amount. Estimated values shown.',
      };
    }
  }
}
