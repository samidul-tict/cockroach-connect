"use client";

import { ConnectButton as RainbowConnectButton } from "@rainbow-me/rainbowkit";

export function ConnectButton() {
  return (
    <RainbowConnectButton
      accountStatus="avatar"
      chainStatus="icon"
      showBalance={false}
    />
  );
}
