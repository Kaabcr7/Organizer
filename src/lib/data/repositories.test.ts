/**
 * Unit tests for repository interfaces
 * These verify the contract is correctly defined
 */

import { describe, it, expect } from "vitest";
import type {
  CompleteTaskResult,
  UndoTaskResult,
} from "./repositories";

describe("Repository Interfaces", () => {
  describe("CompleteTaskResult", () => {
    it("should have required fields for successful completion", () => {
      const result: CompleteTaskResult = {
        success: true,
        xp_awarded: 25,
        new_total_xp: 125,
        new_level: 2,
        level_up: false,
        new_achievements: [],
      };

      expect(result.success).toBe(true);
      expect(result.xp_awarded).toBe(25);
      expect(result.new_total_xp).toBeGreaterThan(0);
      expect(result.new_level).toBeGreaterThanOrEqual(1);
      expect(Array.isArray(result.new_achievements)).toBe(true);
    });

    it("should handle already-completed tasks", () => {
      const result: CompleteTaskResult = {
        success: true,
        already_completed: true,
        xp_awarded: 0,
        new_total_xp: 100,
        new_level: 1,
        level_up: false,
        new_achievements: [],
      };

      expect(result.already_completed).toBe(true);
      expect(result.xp_awarded).toBe(0);
    });
  });

  describe("UndoTaskResult", () => {
    it("should have required fields for successful undo", () => {
      const result: UndoTaskResult = {
        success: true,
        xp_removed: 25,
        new_total_xp: 75,
        new_level: 1,
      };

      expect(result.success).toBe(true);
      expect(result.xp_removed).toBeGreaterThan(0);
    });

    it("should handle already-incomplete tasks", () => {
      const result: UndoTaskResult = {
        success: true,
        already_incomplete: true,
        xp_removed: 0,
        new_total_xp: 100,
        new_level: 1,
      };

      expect(result.already_incomplete).toBe(true);
    });
  });
});
