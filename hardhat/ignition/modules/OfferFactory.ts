import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

export default buildModule("OfferFactory", (m) => {
  const OfferFactory = m.contract("OfferFactory");

  m.call(
    OfferFactory,
    "grantRole",
    [
      "0x0000000000000000000000000000000000000000000000000000000000000000", // admin hash
      "0x689575C7d4a565a9c30d5D03C01B8bbfb27aeF7E", // wallet address to give admin to
    ],
    {
      after: [OfferFactory],
      id: "GrantAdminRole",
    }
  );

  return { OfferFactory };
});
