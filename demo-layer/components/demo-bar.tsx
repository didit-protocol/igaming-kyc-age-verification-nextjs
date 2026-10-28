"use client";

import type { DemoBrand, StepId } from "@/lib/didit/config";

import * as React from "react";
import { Check, RotateCw } from "lucide-react";

import { DiditRing } from "./icons";

import { STEPS } from "@/lib/didit/config";

export interface DemoBarProps {
  demo: { id: string; industry: string; brand: DemoBrand };
  step: StepId;
  done: ReadonlySet<StepId>;
  onStep(step: StepId): void;
  onConsole(): void;
  onRestart(): void;
}

/**
 * The bar above the app, on design system v4: the colour Didit lockup, the
 * app's name, the five steps as a segmented control (the
 * current one raised, the finished ones ticked), the Demo status, the
 * "Console view" button and restart.
 */
export function DemoBar({
  demo,
  step,
  done,
  onStep,
  onConsole,
  onRestart,
}: DemoBarProps) {
  const [stepsMenu, setStepsMenu] = React.useState(false);
  const stepsRef = React.useRef<HTMLDivElement>(null);
  const index = STEPS.findIndex((item) => item.id === step);

  React.useEffect(() => {
    if (!stepsMenu) return;
    const close = (event: MouseEvent) => {
      if (!stepsRef.current?.contains(event.target as Node))
        setStepsMenu(false);
    };

    document.addEventListener("mousedown", close);

    return () => document.removeEventListener("mousedown", close);
  }, [stepsMenu]);

  return (
    <header className="dx-bar dd">
      <img
        alt="Didit"
        className="dx-logo"
        src="/brand/didit-lockup-colour.png"
      />
      <span aria-hidden className="dx-sep" />
      <span className="dx-center">Reference app</span>
      <div className="dx-switch">
        <button aria-disabled="true" style={{ cursor: "default" }} type="button">
          <span className="dx-bm" style={{ background: demo.brand.mark }}>
            {demo.brand.initial}
          </span>
          {demo.brand.name} <em>{demo.industry}</em>
        </button>
      </div>
      <nav aria-label="Demo steps" className="dx-steps">
        <span className="dx-track">
          {STEPS.map((item, index) => {
            const on = item.id === step;
            const finished = !on && done.has(item.id);

            return (
              <button
                key={item.id}
                aria-current={on ? "step" : undefined}
                className={`dx-step${on ? " is-on" : ""}${finished ? " is-done" : ""}`}
                type="button"
                onClick={() => onStep(item.id)}
              >
                <span className="n">
                  {finished ? (
                    <Check aria-hidden size={11} strokeWidth={3} />
                  ) : (
                    index + 1
                  )}
                </span>
                <span className="l">{item.label}</span>
              </button>
            );
          })}
        </span>
      </nav>
      {/* A phone has room for the current step only; it opens the other four. */}
      <div ref={stepsRef} className="dx-steps-phone">
        <button
          aria-expanded={stepsMenu}
          aria-haspopup="menu"
          aria-label={`Step ${index + 1} of 5: ${STEPS[index].label}. Show the steps`}
          className="dx-step is-on"
          type="button"
          onClick={() => setStepsMenu((open) => !open)}
        >
          <span className="n">{index + 1}</span>
          {STEPS[index].label}
        </button>
        {stepsMenu ? (
          <div aria-label="Demo steps" className="dx-menu" role="menu">
            {STEPS.map((item, number) => (
              <button
                key={item.id}
                role="menuitem"
                type="button"
                onClick={() => {
                  setStepsMenu(false);
                  onStep(item.id);
                }}
              >
                <span
                  className={`n${item.id === step ? " is-on" : done.has(item.id) ? " is-done" : ""}`}
                >
                  {item.id !== step && done.has(item.id) ? (
                    <Check aria-hidden size={12} />
                  ) : (
                    number + 1
                  )}
                </span>
                {item.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className="dx-r">
        <span className="dd-status dd-status-warning">Demo</span>
        <button
          className="dd-btn dd-btn-secondary dd-btn-sm"
          type="button"
          onClick={onConsole}
        >
          <DiditRing />
          Console view
        </button>
        <button
          aria-label="Restart the demo"
          className="dd-btn dd-btn-ghost dd-btn-sm dd-btn-icon"
          title="Restart the demo"
          type="button"
          onClick={onRestart}
        >
          <RotateCw aria-hidden size={16} />
        </button>
      </div>
    </header>
  );
}
