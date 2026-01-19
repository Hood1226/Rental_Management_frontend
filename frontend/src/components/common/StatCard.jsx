/**
 * Reusable stat card component with responsive design
 * @param {Object} props
 * @param {string} props.title - Card title
 * @param {string|number} props.value - Card value to display
 * @param {React.ComponentType} props.icon - Lucide React icon component
 * @param {string} props.iconBgColor - Background color class for icon container
 * @param {string} props.iconColor - Color class for icon
 * @param {string} props.valueColor - Color class for value text
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onClick - Optional click handler
 */
function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor = 'bg-blue-50', 
  iconColor = 'text-blue-600',
  valueColor = 'text-gray-900',
  className = '',
  onClick 
}) {
  const CardComponent = onClick ? 'button' : 'div'
  
  return (
    <CardComponent
      onClick={onClick}
      className={`bg-white rounded-lg shadow-md p-3 sm:p-4 md:p-5 border border-gray-200 hover:shadow-lg transition-shadow ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className={`${iconBgColor} p-1.5 sm:p-2 rounded-lg`}>
          <Icon className={`${iconColor} w-4 h-4 sm:w-5 sm:h-5`} />
        </div>
      </div>
      <div className="text-xs sm:text-sm text-gray-600 mb-1">{title}</div>
      <div className={`text-xl sm:text-2xl lg:text-3xl font-bold ${valueColor}`}>{value}</div>
    </CardComponent>
  )
}

export default StatCard

