/**
 * Common responsive form container component
 * Used for form pages like BookingDetails, ProductDetails
 */
function FormContainer({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-3 sm:p-4 md:p-5 lg:p-6 space-y-3 sm:space-y-4 ${className}`}>
      {children}
    </div>
  )
}

export default FormContainer

