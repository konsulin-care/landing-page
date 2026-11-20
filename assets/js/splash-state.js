/** sessionStorage key that marks the splash as already shown in this tab session. */
export const SPLASH_KEY = 'jt-splash-seen';

/** Class on the splash root while it is mounted. */
export const SPLASH_CLASS = 'jt-splash';

/** Class that starts the splash timeline. */
export const SPLASH_RUN_CLASS = 'jt-splash-run';

/** Event dispatched once the splash timeline finishes or is skipped. */
export const SPLASH_DONE_EVENT = 'jt-splash-done';

/** Safety timeout, in milliseconds, after which the splash is torn down anyway. */
export const SPLASH_FALLBACK_MS = 2500;

/** Animation name shared by the veil and the lockup flight. */
export const VEIL_ANIMATION = 'jt-splash-veil';
