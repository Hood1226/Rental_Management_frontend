/**
 * Responsive utility constants and helpers
 */

// Common responsive spacing classes
export const spacing = {
  container: 'px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4',
  card: 'p-3 sm:p-4 md:p-5',
  form: 'p-3 sm:p-4 md:p-5 lg:p-6',
  gap: 'gap-2 sm:gap-3 md:gap-4',
  margin: 'mb-4 sm:mb-6',
}

// Common responsive text sizes
export const textSizes = {
  xs: 'text-[10px] sm:text-xs',
  sm: 'text-xs sm:text-sm',
  base: 'text-sm sm:text-base',
  lg: 'text-base sm:text-lg md:text-xl',
  xl: 'text-xl sm:text-2xl lg:text-3xl',
  '2xl': 'text-2xl sm:text-3xl lg:text-4xl',
}

// Common responsive grid classes
export const grids = {
  '1-2-4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  '1-2-3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '1-3': 'grid-cols-1 lg:grid-cols-3',
  '1-2': 'grid-cols-1 md:grid-cols-2',
}

// Common responsive input classes
export const inputClasses = 'w-full px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all'

// Common responsive button classes
export const buttonClasses = {
  primary: 'px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-primary-700 transition-all shadow-sm',
  secondary: 'px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-200 transition-all',
  icon: 'p-0.5 sm:p-1',
}

// Common responsive icon sizes
export const iconSizes = {
  xs: 'w-3 h-3 sm:w-3 sm:h-3',
  sm: 'w-3 h-3 sm:w-3.5 sm:h-3.5',
  md: 'w-4 h-4 sm:w-5 sm:h-5',
  lg: 'w-5 h-5 sm:w-6 sm:h-6',
}

