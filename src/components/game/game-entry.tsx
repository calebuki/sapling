"use client";

import dynamic from "next/dynamic";

// The island needs WebGL and browser audio, so it only renders on the client.
const loading = () => <div className="game-boot" role="status" />;
export const GameEntry = dynamic(() => import("./game").then((m) => m.Game), { ssr: false, loading });
export const GameTitleEntry = dynamic(() => import("./game").then((m) => m.GameTitleOnly), { ssr: false, loading });
