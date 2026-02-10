import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract } from '@ethersproject/contracts';
import { Wallet } from '@ethersproject/wallet';
import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { getAddress } from '@ethersproject/address';

const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
] as const;

@Injectable()
export class CeloCusdService {
  private readonly logger = new Logger(CeloCusdService.name);
  private readonly provider?: StaticJsonRpcProvider;
  private readonly wallet?: Wallet;
  private readonly cusdAddress?: string;
  private readonly cusdContract?: Contract;

  constructor(private readonly configService: ConfigService) {
    const rpcUrl = this.configService.get<string>('celo.rpcUrl');
    const privateKey = this.configService.get<string>('celo.serverPrivateKey');
    const cusdTokenAddress = this.configService.get<string>('celo.cusdTokenAddress');

    this.cusdAddress = cusdTokenAddress;

    if (!rpcUrl || !privateKey || !cusdTokenAddress) {
      this.logger.warn('CeloCusdService not fully configured (missing CELO_RPC_URL, CELO_SERVER_PRIVATE_KEY, or CELO_CUSD_TOKEN_ADDRESS). cUSD methods will throw until configured.');
      return;
    }

    // Celo mainnet chainId = 42220 (used for EIP-155 signing). RPC could also point to Alfajores (44787)
    this.provider = new StaticJsonRpcProvider(rpcUrl);
    this.wallet = new Wallet(privateKey, this.provider);
    this.cusdContract = new Contract(cusdTokenAddress, ERC20_ABI, this.provider);
  }

  private requireConfigured() {
    if (!this.provider || !this.wallet || !this.cusdContract || !this.cusdAddress) {
      throw new Error('Celo cUSD service not configured');
    }
    return {
      provider: this.provider,
      wallet: this.wallet,
      cusdContract: this.cusdContract,
      cusdAddress: this.cusdAddress,
    };
  }

  getServerWalletAddress(): string {
    return this.requireConfigured().wallet.address;
  }

  async getBalance(address: string): Promise<string> {
    const { cusdContract } = this.requireConfigured();
    const checksum = getAddress(address);
    const bal = await cusdContract.balanceOf(checksum);
    const decimals = await cusdContract.decimals();
    return (Number(bal) / 10 ** decimals).toString();
  }

  async transferToReserve(reserveAddress: string, amountCusd: string): Promise<string> {
    const { cusdContract, wallet } = this.requireConfigured();

    const checksumTo = getAddress(reserveAddress);

    const decimals = await cusdContract.decimals();
    const amountWei = BigInt(Math.floor(parseFloat(amountCusd) * 10 ** decimals));

    if (amountWei <= 0n) {
      throw new Error('Amount must be > 0');
    }

    const contractWithSigner = cusdContract.connect(wallet);

    this.logger.log(`Transferring ${amountCusd} cUSD to reserve ${checksumTo} from ${wallet.address}`);
    const tx = await contractWithSigner.transfer(checksumTo, amountWei);

    this.logger.log(`cUSD transfer tx: ${tx.hash}`);
    await tx.wait();
    return tx.hash;
  }
}
