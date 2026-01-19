/**
 * Common responsive form section component
 */
function FormSection({ title, children, action, className = '' }) {
  return (
    <div className={`space-y-2 sm:space-y-3 pt-2 sm:pt-3 border-t border-gray-200 ${className}`}>
      {(title || action) && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-2">
          {title && (
            <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-800">
              {title}
            </h4>
          )}
          {action && <div className="w-full sm:w-auto">{action}</div>}
        </div>
      )}
      {children}
    </div>
  )
}

export default FormSection

