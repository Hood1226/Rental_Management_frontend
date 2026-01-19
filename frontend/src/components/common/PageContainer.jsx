/**
 * Common responsive page container component
 * Provides consistent padding and max-width across all pages
 */
function PageContainer({ children, maxWidth = '7xl', className = '' }) {
  const maxWidthClasses = {
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full',
  }

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto px-2 sm:px-3 md:px-4 lg:px-6 py-2 sm:py-3 md:py-4 ${className}`}>
      {children}
    </div>
  )
}

export default PageContainer

