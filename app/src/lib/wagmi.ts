import { http, createConfig } from "wagmi";
import { base, baseSepolia, hardhat } from "wagmi/chains";
import { coinbaseWallet, injected, walletConnect } from "wagmi/connectors";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID!;

export const wagmiConfig = createConfig({
  chains: [baseSepolia, base, hardhat],
  connectors: [
    injected(),
    coinbaseWallet({ appName: "CockroachConnect" }),
    walletConnect({ projectId }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [base.id]: http(),
    [hardhat.id]: http("http://127.0.0.1:8545"),
  },
  ssr: true,
});
