// src/stores/noiseStore.ts
import { create } from "zustand";

interface NoiseData {
  timestamp: number;
  noise_level: number;
  wind_speed: number;
  wind_direction: number;
  power_out: number;
  rotor_speed: number;
  pitch_angle: number;
}

type NoiseMode = "monitoring" | "prediction";

interface NoiseState {
  latest: NoiseData | null;
  history: NoiseData[];
  mode: NoiseMode;
  setMode: (mode: NoiseMode) => void;
  addData: (data: NoiseData) => void;
}

export const useNoiseStore = create<NoiseState>((set) => ({
  latest: null,
  history: [],
  mode: "monitoring",
  setMode: (mode) => set(() => ({ mode })),
  addData: (data: NoiseData) =>
    set((state) => ({
      latest: data,
      history: [...state.history.slice(-49), data], // keep last 50 points
    })),
}));
