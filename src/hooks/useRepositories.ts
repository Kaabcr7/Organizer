/**
 * Hook to access the repository factory
 * Use this in components instead of importing directly
 */

import { getRepositoryFactory } from "@/lib/data";

export function useRepositories() {
  return getRepositoryFactory();
}
