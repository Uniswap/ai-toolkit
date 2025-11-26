import { PRIORITY_MAP, PRIORITY_SORT_ORDER, DEFAULTS } from './types';

describe('types.ts - Constants and Exports', () => {
  describe('PRIORITY_MAP', () => {
    it('should have correct priority labels', () => {
      expect(PRIORITY_MAP[0]).toBe('No Priority');
      expect(PRIORITY_MAP[1]).toBe('Urgent');
      expect(PRIORITY_MAP[2]).toBe('High');
      expect(PRIORITY_MAP[3]).toBe('Normal');
      expect(PRIORITY_MAP[4]).toBe('Low');
    });

    it('should have all 5 priority levels', () => {
      expect(Object.keys(PRIORITY_MAP)).toHaveLength(5);
    });
  });

  describe('PRIORITY_SORT_ORDER', () => {
    it('should place Urgent (1) first', () => {
      expect(PRIORITY_SORT_ORDER[0]).toBe(1);
    });

    it('should place High (2) second', () => {
      expect(PRIORITY_SORT_ORDER[1]).toBe(2);
    });

    it('should place Normal (3) third', () => {
      expect(PRIORITY_SORT_ORDER[2]).toBe(3);
    });

    it('should place Low (4) fourth', () => {
      expect(PRIORITY_SORT_ORDER[3]).toBe(4);
    });

    it('should place No Priority (0) last', () => {
      expect(PRIORITY_SORT_ORDER[4]).toBe(0);
    });

    it('should have all 5 priority levels', () => {
      expect(PRIORITY_SORT_ORDER).toHaveLength(5);
    });
  });

  describe('DEFAULTS', () => {
    it('should have correct default team', () => {
      expect(DEFAULTS.team).toBe('Developer AI');
    });

    it('should have correct default label', () => {
      expect(DEFAULTS.label).toBe('claude');
    });

    it('should have correct default statuses', () => {
      expect(DEFAULTS.statuses).toEqual(['Backlog', 'Todo']);
    });

    it('should have correct default max', () => {
      expect(DEFAULTS.max).toBe(3);
    });

    it('should have correct default labelColor', () => {
      expect(DEFAULTS.labelColor).toBe('#6366f1');
    });

    it('should be readonly (type assertion)', () => {
      // This is a compile-time check - if DEFAULTS wasn't const, this would allow mutation
      // We verify the structure is correct
      expect(DEFAULTS).toEqual({
        team: 'Developer AI',
        label: 'claude',
        statuses: ['Backlog', 'Todo'],
        max: 3,
        labelColor: '#6366f1',
      });
    });
  });
});
