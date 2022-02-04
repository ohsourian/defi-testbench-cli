import { ethers, Wallet } from 'ethers';
import { WKLAY } from '../types/Assets';
import assets from '../constants/assets';
import { iwklay } from '../constants/abis';

export async function depositTo(klay: string, signer: Wallet) {
  const wklay = <WKLAY>new ethers.Contract(assets.wklay, iwklay, signer);
  await wklay.deposit({ value: ethers.utils.parseEther(klay) });
}

export async function withdrawFrom() {}
