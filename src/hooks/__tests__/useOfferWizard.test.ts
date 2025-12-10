import { describe, it, expect } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useOfferWizard } from '../useOfferWizard';
import { createPriceRow } from '@/components/EditablePriceTable';
import { emptyProjectDetails } from '@/lib/projectDetails';

// Mock the translation function
jest.mock('@/copy', () => ({
  t: (key: string) => key,
}));

describe('useOfferWizard', () => {
  it('should initialize with default values', () => {
    const { result } = renderHook(() => useOfferWizard());

    expect(result.current.step).toBe(1);
    expect(result.current.title).toBe('');
    expect(result.current.projectDetails).toEqual(emptyProjectDetails);
    expect(result.current.pricingRows).toHaveLength(1);
  });

  it('should update title', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('Test Offer');
    });

    expect(result.current.title).toBe('Test Offer');
  });

  it('should update project details', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setProjectDetails({
        ...emptyProjectDetails,
        overview: 'Test overview',
      });
    });

    expect(result.current.projectDetails.overview).toBe('Test overview');
  });

  it('should validate step 1 - title required', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('');
      result.current.setProjectDetails({
        ...emptyProjectDetails,
        overview: 'Test overview',
      });
    });

    expect(result.current.validation.steps[1]).toBeDefined();
    expect(result.current.validation.steps[1]?.length).toBeGreaterThan(0);
    expect(result.current.isStepValid(1)).toBe(false);
  });

  it('should validate step 1 - overview required', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('Test Title');
      result.current.setProjectDetails({
        ...emptyProjectDetails,
        overview: '',
      });
    });

    expect(result.current.validation.steps[1]).toBeDefined();
    expect(result.current.validation.steps[1]?.length).toBeGreaterThan(0);
    expect(result.current.isStepValid(1)).toBe(false);
  });

  it('should validate step 2 - pricing required', () => {
    const { result } = renderHook(() => useOfferWizard([createPriceRow()]));

    act(() => {
      result.current.setPricingRows([createPriceRow({ name: '' })]);
    });

    expect(result.current.validation.steps[2]).toBeDefined();
    expect(result.current.validation.steps[2]?.length).toBeGreaterThan(0);
    expect(result.current.isStepValid(2)).toBe(false);
  });

  it('should pass validation when all required fields are filled', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('Test Title');
      result.current.setProjectDetails({
        ...emptyProjectDetails,
        overview: 'Test overview',
      });
      result.current.setPricingRows([createPriceRow({ name: 'Test Service', unitPrice: 1000 })]);
    });

    expect(result.current.isStepValid(1)).toBe(true);
    expect(result.current.isStepValid(2)).toBe(true);
  });

  it('should navigate to next step when valid', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('Test Title');
      result.current.setProjectDetails({
        ...emptyProjectDetails,
        overview: 'Test overview',
      });
    });

    act(() => {
      const success = result.current.goNext();
      expect(success).toBe(true);
    });

    expect(result.current.step).toBe(2);
  });

  it('should not navigate to next step when invalid', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('');
    });

    act(() => {
      const success = result.current.goNext();
      expect(success).toBe(false);
    });

    expect(result.current.step).toBe(1);
    expect(result.current.attemptedSteps[1]).toBe(true);
  });

  it('should navigate to previous step', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('Test Title');
      result.current.setProjectDetails({
        ...emptyProjectDetails,
        overview: 'Test overview',
      });
      result.current.goNext();
    });

    expect(result.current.step).toBe(2);

    act(() => {
      result.current.goPrev();
    });

    expect(result.current.step).toBe(1);
  });

  it('should not navigate to previous step from step 1', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.goPrev();
    });

    expect(result.current.step).toBe(1);
  });

  it('should not navigate to next step beyond step 3', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('Test Title');
      result.current.setProjectDetails({
        ...emptyProjectDetails,
        overview: 'Test overview',
      });
      result.current.goNext();
      result.current.setPricingRows([createPriceRow({ name: 'Test Service' })]);
      result.current.goNext();
    });

    expect(result.current.step).toBe(3);

    act(() => {
      result.current.goNext();
    });

    expect(result.current.step).toBe(3);
  });

  it('should allow navigation to previous valid steps', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('Test Title');
      result.current.setProjectDetails({
        ...emptyProjectDetails,
        overview: 'Test overview',
      });
      result.current.goNext();
      result.current.setPricingRows([createPriceRow({ name: 'Test Service' })]);
      result.current.goNext();
    });

    expect(result.current.step).toBe(3);

    act(() => {
      result.current.goToStep(1);
    });

    expect(result.current.step).toBe(1);
  });

  it('should not allow navigation to future steps', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.goToStep(3);
    });

    expect(result.current.step).toBe(1);
  });

  it('should not allow navigation to invalid previous steps', () => {
    const { result } = renderHook(() => useOfferWizard());

    act(() => {
      result.current.setTitle('Test Title');
      result.current.setProjectDetails({
        ...emptyProjectDetails,
        overview: 'Test overview',
      });
      result.current.goNext();
      result.current.setTitle(''); // Make step 1 invalid
    });

    act(() => {
      result.current.goToStep(1);
    });

    // Should not navigate because step 1 is now invalid
    expect(result.current.step).toBe(2);
  });
});
