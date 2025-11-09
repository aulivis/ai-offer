import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfferWizard } from '@/hooks/useOfferWizard';
import { createPriceRow, type PriceRow } from '@/components/EditablePriceTable';
import { emptyProjectDetails } from '@/lib/projectDetails';

describe('useOfferWizard', () => {
  describe('initial state', () => {
    it('should initialize with step 1', () => {
      const { result } = renderHook(() => useOfferWizard());
      expect(result.current.step).toBe(1);
    });

    it('should initialize with empty title', () => {
      const { result } = renderHook(() => useOfferWizard());
      expect(result.current.title).toBe('');
    });

    it('should initialize with empty project details', () => {
      const { result } = renderHook(() => useOfferWizard());
      expect(result.current.projectDetails).toEqual(emptyProjectDetails);
    });

    it('should initialize with one empty pricing row by default', () => {
      const { result } = renderHook(() => useOfferWizard());
      expect(result.current.pricingRows).toHaveLength(1);
      expect(result.current.pricingRows[0].name).toBe('');
    });

    it('should accept custom initial rows', () => {
      const customRows: PriceRow[] = [{ ...createPriceRow(), name: 'Custom Item', unitPrice: 100 }];
      const { result } = renderHook(() => useOfferWizard(customRows));
      expect(result.current.pricingRows).toEqual(customRows);
    });

    it('should initialize with all steps not attempted', () => {
      const { result } = renderHook(() => useOfferWizard());
      expect(result.current.attemptedSteps).toEqual({
        1: false,
        2: false,
        3: false,
      });
    });
  });

  describe('step navigation', () => {
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

    it('should not navigate when step is invalid', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        const success = result.current.goNext();
        expect(success).toBe(false);
      });

      expect(result.current.step).toBe(1);
      expect(result.current.attemptedSteps[1]).toBe(true);
    });

    it('should navigate backwards', () => {
      const { result } = renderHook(() => useOfferWizard());

      // Go to step 2
      act(() => {
        result.current.setTitle('Test');
        result.current.setProjectDetails({
          ...emptyProjectDetails,
          overview: 'Test',
        });
        result.current.goNext();
      });

      // Go back
      act(() => {
        result.current.goPrev();
      });

      expect(result.current.step).toBe(1);
    });

    it('should not go below step 1', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.goPrev();
      });

      expect(result.current.step).toBe(1);
    });

    it('should not go above step 3', () => {
      const { result } = renderHook(() => useOfferWizard());

      // Navigate to step 3
      act(() => {
        result.current.setTitle('Test');
        result.current.setProjectDetails({
          ...emptyProjectDetails,
          overview: 'Test',
        });
        result.current.goNext(); // Step 2
        result.current.setPricingRows([{ ...createPriceRow(), name: 'Item', unitPrice: 100 }]);
        result.current.goNext(); // Step 3
      });

      // Verify we're on step 3
      expect(result.current.step).toBe(3);

      // Try to go further - should stay on step 3
      act(() => {
        const success = result.current.goNext();
        expect(success).toBe(true); // Returns true but doesn't advance
      });

      expect(result.current.step).toBe(3);
    });

    it('should allow navigating to previous valid steps', () => {
      const { result } = renderHook(() => useOfferWizard());

      // Go to step 2
      act(() => {
        result.current.setTitle('Test');
        result.current.setProjectDetails({
          ...emptyProjectDetails,
          overview: 'Test',
        });
        result.current.goNext();
      });

      // Go back to step 1
      act(() => {
        result.current.goToStep(1);
      });

      expect(result.current.step).toBe(1);
    });

    it('should not allow navigating to future steps', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.goToStep(2);
      });

      expect(result.current.step).toBe(1);
    });

    it('should not allow navigating to invalid previous steps', () => {
      const { result } = renderHook(() => useOfferWizard());

      // Go to step 2
      act(() => {
        result.current.setTitle('Test');
        result.current.setProjectDetails({
          ...emptyProjectDetails,
          overview: 'Test',
        });
        result.current.goNext();
      });

      expect(result.current.step).toBe(2);

      // Try to go to step 1 but make it invalid first
      // goToStep checks isStepValid before navigating, so it won't navigate
      act(() => {
        result.current.setTitle('');
        result.current.goToStep(1);
      });

      // goToStep validates before navigating, so it should stay on step 2
      expect(result.current.step).toBe(2);
    });
  });

  describe('validation', () => {
    it('should validate title is required', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.setTitle('');
      });

      const validation = result.current.validation;
      expect(validation.fields[1].title).toBeDefined();
      expect(validation.steps[1]?.length).toBeGreaterThan(0);
    });

    it('should validate overview is required', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.setProjectDetails({
          ...emptyProjectDetails,
          overview: '',
        });
      });

      const validation = result.current.validation;
      expect(validation.fields[1].projectDetails.overview).toBeDefined();
      expect(validation.steps[1]?.length).toBeGreaterThan(0);
    });

    it('should validate pricing rows have at least one item', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.setPricingRows([]);
      });

      const validation = result.current.validation;
      expect(validation.fields[2].pricing).toBeDefined();
      expect(validation.steps[2]?.length).toBeGreaterThan(0);
    });

    it('should validate pricing rows have names', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.setPricingRows([createPriceRow()]); // Empty name
      });

      const validation = result.current.validation;
      expect(validation.fields[2].pricing).toBeDefined();
    });

    it('should be valid when all required fields are filled', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.setTitle('Test Title');
        result.current.setProjectDetails({
          ...emptyProjectDetails,
          overview: 'Test overview',
        });
        result.current.setPricingRows([{ ...createPriceRow(), name: 'Test Item', unitPrice: 100 }]);
      });

      expect(result.current.isCurrentStepValid).toBe(true);
      expect(result.current.isStepValid(1)).toBe(true);
    });

    it('should mark step as attempted when validation fails', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.goNext();
      });

      expect(result.current.attemptedSteps[1]).toBe(true);
    });

    it('should unmark step as attempted when validation passes', () => {
      const { result } = renderHook(() => useOfferWizard());

      // First attempt fails
      act(() => {
        result.current.goNext();
      });

      expect(result.current.attemptedSteps[1]).toBe(true);

      // Fill required fields and navigate successfully
      act(() => {
        result.current.setTitle('Test');
        result.current.setProjectDetails({
          ...emptyProjectDetails,
          overview: 'Test',
        });
        result.current.goNext();
      });

      // Step 1 should be unmarked when we successfully move to step 2
      // Note: goNext sets attemptedSteps[step] to false when successful
      expect(result.current.step).toBe(2);
      expect(result.current.attemptedSteps[1]).toBe(false);
    });
  });

  describe('projectDetailsText', () => {
    it('should format project details correctly', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.setProjectDetails({
          overview: 'Test overview',
          deliverables: 'Test deliverables',
          timeline: 'Test timeline',
          constraints: 'Test constraints',
        });
      });

      const text = result.current.projectDetailsText;
      expect(text).toContain('Test overview');
      expect(text).toContain('Test deliverables');
      expect(text).toContain('Test timeline');
      expect(text).toContain('Test constraints');
    });

    it('should handle empty fields gracefully', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.setProjectDetails({
          overview: 'Only overview',
          deliverables: '',
          timeline: '',
          constraints: '',
        });
      });

      const text = result.current.projectDetailsText;
      expect(text).toContain('Only overview');
    });
  });

  describe('isNextDisabled', () => {
    it('should be disabled when step is invalid and attempted', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.goNext(); // Attempts step 1
      });

      expect(result.current.isNextDisabled).toBe(true);
    });

    it('should not be disabled when step is valid', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.setTitle('Test');
        result.current.setProjectDetails({
          ...emptyProjectDetails,
          overview: 'Test',
        });
      });

      expect(result.current.isNextDisabled).toBe(false);
    });
  });

  describe('pricing rows management', () => {
    it('should update pricing rows', () => {
      const { result } = renderHook(() => useOfferWizard());

      const newRows: PriceRow[] = [
        { ...createPriceRow(), name: 'Item 1', unitPrice: 100 },
        { ...createPriceRow(), name: 'Item 2', unitPrice: 200 },
      ];

      act(() => {
        result.current.setPricingRows(newRows);
      });

      expect(result.current.pricingRows).toEqual(newRows);
    });
  });

  describe('validation issues', () => {
    it('should include validation issues in result', () => {
      const { result } = renderHook(() => useOfferWizard());

      act(() => {
        result.current.setTitle(''); // Invalid
      });

      expect(result.current.validation.issues.length).toBeGreaterThan(0);
      expect(result.current.validation.issues[0].step).toBe(1);
      expect(result.current.validation.issues[0].severity).toBe('error');
    });
  });
});
