"use client";

import type { ISourceOptions } from "@tsparticles/engine";
import Particles, { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useEffect, useMemo, useState } from "react";

const cyberOptions = {
  fullScreen: false,
  background: {
    color: { value: "transparent" },
  },
  fpsLimit: 60,
  detectRetina: true,
  interactivity: {
    events: {
      resize: { enable: true, delay: 0.5 },
    },
  },
  particles: {
    color: {
      value: ["#5ee397", "#9effc0", "#4a9e6a", "#2d6b45"],
    },
    links: {
      blink: true,
      color: { value: "#2d6b45" },
      consent: false,
      distance: 110,
      enable: true,
      opacity: 0.28,
      shadow: {
        blur: 4,
        color: { value: "#5ee397" },
        enable: true,
      },
      triangles: { enable: false },
      width: 0.6,
    },
    move: {
      attract: { enable: false },
      direction: "none",
      enable: true,
      outModes: { default: "bounce" },
      random: true,
      speed: { min: 0.15, max: 0.55 },
      straight: false,
    },
    number: {
      density: { enable: true, width: 900, height: 900 },
      value: 52,
    },
    opacity: {
      value: { min: 0.2, max: 0.65 },
      animation: {
        enable: true,
        speed: 0.35,
        sync: false,
      },
    },
    rotate: { value: { min: 0, max: 360 }, direction: "random" },
    shape: { type: "circle" },
    size: {
      value: { min: 0.4, max: 1.6 },
      animation: {
        enable: true,
        speed: 1.2,
        sync: false,
      },
    },
  },
};

const reducedMotionOptions = {
  ...cyberOptions,
  interactivity: {
    events: { resize: { enable: true } },
  },
  particles: {
    ...cyberOptions.particles,
    move: { enable: false },
    number: { value: 28, density: { enable: true, width: 1200, height: 1200 } },
    opacity: { value: 0.35 },
    rotate: { value: 0 },
    size: { value: 1 },
  },
};

export default function ParticleBackground() {
  const [ready, setReady] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => setReady(true));
  }, []);

  const options: ISourceOptions = useMemo(
    () => (reduceMotion ? reducedMotionOptions : cyberOptions) as ISourceOptions,
    [reduceMotion],
  );

  if (!ready) return null;

  return (
    <div className="crt-particles pointer-events-none fixed inset-0 z-0" aria-hidden>
      <Particles
        id="crt-tsparticles"
        className="h-full w-full"
        options={options}
      />
    </div>
  );
}
