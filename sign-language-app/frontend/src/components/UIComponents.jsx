import React from 'react';
import { motion } from 'framer-motion';

/**
 * Button Component - Multiple variants and sizes
 * Supports primary, secondary, outline, ghost, and danger variants
 */
export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon = null,
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-medium transition-all duration-200 flex items-center justify-center gap-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:shadow-lg hover:from-blue-600 hover:to-purple-700 focus:ring-blue-500',
    secondary: 'bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-500 shadow-md hover:shadow-lg',
    outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 focus:ring-blue-500',
    ghost: 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:ring-gray-300',
    danger: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500 shadow-md hover:shadow-lg',
  };

  const sizes = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      )}
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </motion.button>
  );
};

/**
 * Card Component - Flexible container with optional hover effects
 */
export const Card = ({
  children,
  className = '',
  hoverable = false,
  glowEffect = false,
  variant = 'default',
  ...props
}) => {
  const baseStyles = 'rounded-2xl backdrop-blur-sm transition-all duration-300';
  const variants = {
    default: 'bg-white dark:bg-slate-800 shadow-md hover:shadow-lg',
    elevated: 'bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl',
    outline: 'border-2 border-gray-200 dark:border-gray-700 bg-transparent',
    gradient: 'bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 shadow-md',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hoverable ? { y: -4 } : {}}
      className={`${baseStyles} ${variants[variant]} ${glowEffect ? 'shadow-glow' : ''} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
};

/**
 * Badge Component - For labels, tags, status indicators
 */
export const Badge = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon = null,
  className = '',
}) => {
  const baseStyles = 'inline-flex items-center gap-1 font-medium rounded-full whitespace-nowrap';

  const variants = {
    primary: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    secondary: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    neutral: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  };

  const sizes = {
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </span>
  );
};

/**
 * Progress Bar Component
 */
export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  label = '',
  showLabel = true,
  animated = true,
  className = '',
}) => {
  const percentage = (value / max) * 100;

  const variants = {
    primary: 'bg-gradient-to-r from-blue-500 to-purple-600',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-orange-600',
    error: 'bg-gradient-to-r from-red-500 to-pink-600',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </span>
          <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
            {Math.round(percentage)}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizes[size]}`}>
        <motion.div
          className={`h-full ${variants[variant]} rounded-full shadow-glow`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={animated ? { duration: 0.8, ease: 'easeOut' } : { duration: 0 }}
        />
      </div>
    </div>
  );
};

/**
 * Input Component - Text, email, password, etc.
 */
export const Input = ({
  label = '',
  error = '',
  icon: Icon = null,
  type = 'text',
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        )}
        <input
          type={type}
          className={`
            w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700
            bg-white dark:bg-slate-800 text-gray-900 dark:text-white
            placeholder-gray-400 dark:placeholder-gray-500
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            transition-all duration-200 ${Icon ? 'pl-10' : ''} 
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};

/**
 * Select/Dropdown Component
 */
export const Select = ({
  label = '',
  options = [],
  error = '',
  icon: Icon = null,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
        )}
        <select
          className={`
            w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700
            bg-white dark:bg-slate-800 text-gray-900 dark:text-white
            focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20
            transition-all duration-200 appearance-none cursor-pointer
            ${Icon ? 'pl-10' : ''} 
            ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
            ${className}
          `}
          {...props}
        >
          <option value="">Select an option</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
};

/**
 * Modal Component
 */
export const Modal = ({
  isOpen = false,
  onClose = () => {},
  title = '',
  children,
  footer = null,
  size = 'md',
  className = '',
}) => {
  const sizes = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: isOpen ? 1 : 0 }}
      exit={{ opacity: 0 }}
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 ${
        isOpen ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: isOpen ? 1 : 0.95, opacity: isOpen ? 1 : 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl ${sizes[size]} w-full ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
          </div>
        )}
        <div className="p-6">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
            {footer}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

/**
 * Toast Notification Component
 */
export const Toast = ({
  message = '',
  type = 'info',
  icon: Icon = null,
  onClose = () => {},
  duration = 3000,
}) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeStyles = {
    info: 'bg-blue-500',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    error: 'bg-red-500',
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      className={`${typeStyles[type]} text-white px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 max-w-sm`}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{message}</span>
    </motion.div>
  );
};

/**
 * Loading Skeleton Component
 */
export const Skeleton = ({
  variant = 'text',
  width = '100%',
  height = '1rem',
  circle = false,
  count = 1,
  className = '',
}) => {
  const baseStyles = 'bg-gray-200 dark:bg-gray-700 animate-pulse';

  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseStyles} ${circle ? 'rounded-full' : 'rounded-lg'} mb-3`}
          style={{
            width,
            height,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Avatar Component
 */
export const Avatar = ({
  src = '',
  alt = 'User',
  size = 'md',
  status = null, // 'online', 'offline', 'away'
  className = '',
}) => {
  const sizes = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
    '2xl': 'w-20 h-20',
  };

  const statusStyles = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
  };

  return (
    <div className={`relative ${sizes[size]}`}>
      <img
        src={src}
        alt={alt}
        className={`w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-800 ${className}`}
      />
      {status && (
        <div
          className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${statusStyles[status]}`}
        />
      )}
    </div>
  );
};
