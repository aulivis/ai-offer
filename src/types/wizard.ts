/**
 * Type definitions for the offer wizard
 */

export type WizardStep = 1 | 2 | 3;

export type StepLabel = Record<WizardStep, string>;

export type WizardState = {
  step: WizardStep;
  title: string;
  projectDetails: {
    overview: string;
    deliverables: string;
    timeline: string;
    constraints: string;
  };
  pricingRows: Array<{
    id: string;
    name: string;
    qty: number;
    unit: string;
    unitPrice: number;
    vat: number;
  }>;
};

export type DraftState = WizardState & {
  timestamp: number;
};



