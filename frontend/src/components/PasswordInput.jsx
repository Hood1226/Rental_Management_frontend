import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

/**
 * Reusable password input with show/hide toggle.
 * Supports register from react-hook-form and plain value/onChange.
 */
function PasswordInput({
  register,
  name,
  options = {},
  placeholder = 'Enter password',
  className = '',
  id,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false)
  const baseClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent pr-10'

  if (register) {
    return (
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          id={id}
          {...register(name, options)}
          className={`${baseClass} ${className}`}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setShowPassword((p) => !p)}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        placeholder={placeholder}
        id={id}
        className={`${baseClass} ${className}`}
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShowPassword((p) => !p)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
        aria-label={showPassword ? 'Hide password' : 'Show password'}
      >
        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  )
}

export default PasswordInput
