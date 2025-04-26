import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OfferFactory", (m) => {
  const OfferFactory = m.contract("OfferFactory");

  return { OfferFactory };
});
