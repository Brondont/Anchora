import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OfferFactory", (m) => {
  // this is the wallet you change for you default user admin wallet address
  const initialAdmin = "0x689575C7d4a565a9c30d5D03C01B8bbfb27aeF7E";

  // Pass it straight into the constructor
  const OfferFactory = m.contract("OfferFactory", [initialAdmin]);

  return { OfferFactory };
});
