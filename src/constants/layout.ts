/**
 * Layout Constants
 *
 * Shared sizing values for icons, thumbnails, navigation, and charts.
 * Use these instead of hardcoded numbers in component styles.
 *
 * USAGE:
 * import { ICON_SIZE_MD, TAB_BAR_HEIGHT, CHART_DEFAULT_HEIGHT } from '@/constants';
 */

// ============================================================================
// Icon Sizes
// ============================================================================

/** Extra-small icon: checkmarks in checkboxes (16px) */
export const ICON_SIZE_XS = 16;

/** Small icon: chevrons, small action icons (20px) */
export const ICON_SIZE_SM = 20;

/** Medium icon: tab bar, action buttons, inline icons (24px) — most common */
export const ICON_SIZE_MD = 24;

/** Large icon: stat cards, prominent UI elements (32px) */
export const ICON_SIZE_LG = 32;

/** Extra-large icon: header placeholders, decorative (40px) */
export const ICON_SIZE_XL = 40;

/** 2X-large icon: error states, loading states (48px) */
export const ICON_SIZE_2XL = 48;

/** 3X-large icon: full-screen placeholders, GIF fallbacks (64px) */
export const ICON_SIZE_3XL = 64;

/** Muscle group icon: fits in 80px rounded rectangle container (72px) */
export const ICON_SIZE_MUSCLE = 72;

/** Banner icon: exercise detail header placeholder (160px) */
export const ICON_SIZE_BANNER = 160;

// ============================================================================
// Thumbnail Sizes
// ============================================================================

/** Small thumbnail: exercise list items (56px) */
export const THUMBNAIL_SM = 56;

/** Medium thumbnail: avatars, small previews (80px) */
export const THUMBNAIL_MD = 80;

/** Large thumbnail: medium previews (100px) */
export const THUMBNAIL_LG = 100;

/** Extra-large thumbnail: exercise previews (120px) */
export const THUMBNAIL_XL = 120;

// ============================================================================
// Tab Bar
// ============================================================================

/** Tab bar total height including padding (85px) */
export const TAB_BAR_HEIGHT = 85;

/** Tab bar top padding (8px) */
export const TAB_BAR_PADDING_TOP = 8;

/** Tab bar bottom padding — accounts for home indicator (25px) */
export const TAB_BAR_PADDING_BOTTOM = 25;

// ============================================================================
// Charts
// ============================================================================

/** Default chart height (220px) */
export const CHART_DEFAULT_HEIGHT = 220;

/** Default chart width as ratio of screen width (0.9 = 90%) */
export const CHART_WIDTH_RATIO = 0.9;

/** Default chart domain padding (20px on all sides) */
export const CHART_DOMAIN_PADDING = 20;

// ============================================================================
// Border Radius
// ============================================================================

/** Small border radius: checkboxes, small elements (4px) */
export const BORDER_RADIUS_SM = 4;

/** Medium border radius: thumbnails, buttons (8px) */
export const BORDER_RADIUS_MD = 8;

/** Large border radius: cards, previews, banners (12px) */
export const BORDER_RADIUS_LG = 12;
