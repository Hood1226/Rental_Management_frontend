/**
 * Common responsive page header component
 */
function PageHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 sm:mb-6 ${className}`}>
      <div>
        {title && (
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 mb-1 sm:mb-2">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="text-xs sm:text-sm md:text-base text-gray-600">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="w-full sm:w-auto">{action}</div>}
    </div>
  )
}

export default PageHeader

