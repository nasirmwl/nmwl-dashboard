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
  /* No link shadows (heavy). pauseOnOutsideViewport off — fixed layers can confuse IntersectionObserver. */
  fpsLimit: 60,
  detectRetina: true,
  pauseOnBlur: true,
  pauseOnOutsideViewport: false,
  interactivity: {
    events: {
      resize: { enable: true, delay: 0.5 },
    },
  },
  particles: {
    color: {
      value: ["#d4ffd8", "#9effc0", "#7ef0a8", "#b8ffc9", "#8effd4"],
    },
    links: {
      blink: false,
      color: { value: "#9effc0" },
      consent: false,
      distance: 110,
      enable: true,
      opacity: 0.72,
      shadow: {
        enable: false,
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
      speed: { min: 0.15, max: 0.5 },
      straight: false,
    },
    number: {
      density: { enable: false },
      value: 117,
    },
    opacity: {
      value: { min: 0.62, max: 0.98 },
      animation: {
        enable: true,
        speed: 0.25,
        sync: false,
      },
    },
    rotate: { value: { min: 0, max: 360 }, direction: "random" },
    shape: { type: "circle" },
    size: {
      value: { min: 0.55, max: 1.85 },
      animation: {
        enable: true,
        speed: 1,
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
    opacity: { value: 0.62 },
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
    <div
      className="crt-particles pointer-events-none fixed inset-0 z-0 min-h-screen w-full"
      aria-hidden
    >
      <Particles
        id="crt-tsparticles"
        className="h-full min-h-screen w-full"
        options={options}
      />
    </div>
  );
}
