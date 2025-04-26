import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { FeedbackProvider } from "./FeedbackAlertContext";
import { Config, DAppProvider } from "@usedapp/core";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

const dappConfig: Config = {
  readOnlyChainId: 31337,
  readOnlyUrls: {
    31337: "http://localhost:8545",
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
