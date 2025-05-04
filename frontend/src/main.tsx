import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { FeedbackProvider } from "./FeedbackAlertContext";
import { Config, DAppProvider, Chain } from "@usedapp/core";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const HARDHAT_URL = import.meta.env.VITE_ETH_NETWORK;

const hardhatChain: Chain = {
  chainId: 31337,
  chainName: "Hardhat",
  isTestChain: true,
  isLocalChain: true,
  multicallAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Hardhat default first account
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
  getExplorerAddressLink: (_: string) => "",
  getExplorerTransactionLink: (_: string) => "",
};

const dappConfig: Config = {
  readOnlyChainId: hardhatChain.chainId,
  readOnlyUrls: {
    [hardhatChain.chainId]: HARDHAT_URL,
  },
  networks: [hardhatChain],
  notifications: {
    expirationPeriod: 1000,
    checkInterval: 1000,
  },
};

root.render(
  <React.StrictMode>
    <DAppProvider config={dappConfig}>
      <BrowserRouter>
        <FeedbackProvider>
          <App />
        </FeedbackProvider>
      </BrowserRouter>
    </DAppProvider>
  </React.StrictMode>
);
