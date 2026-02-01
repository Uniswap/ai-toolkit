import { http, createConfig } from 'wagmi';
import { baseSepolia } from 'wagmi/chains';
import { injected, metaMask, coinbaseWallet } from 'wagmi/connectors';

export const config = createConfig({
  chains: [baseSepolia],
  connectors: [injected(), metaMask(), coinbaseWallet({ appName: 'TEST_Token CCA' })],
  transports: {
    [baseSepolia.id]: http(),
  },
});

declare module 'wagmi' {
  interface Register {
    config: typeof config;
  }
}
