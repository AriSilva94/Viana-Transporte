// Re-export window.api as a typed constant.
// All renderer code imports from here — never accesses window.api directly.
export const api = window.api
