'use client'

import { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/utils'
import { Input, InputProps } from '../atoms/input'

export interface FormFieldProps extends InputProps {
  label?: string
  error?: string
  success?: string
  hint?: string
  required?: boolean
  children?: ReactNode
}

const FormField = ({
  label,
  error,
  success,
  hint,
  required,
  className,
  children,
  ...inputProps
}: FormFieldProps) => {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <label className="block font-mono text-small font-medium text-void-black">
          {label}
          {required && <span className="text-warning-orange ml-1">*</span>}
        </label>
      )}
      
      {children || <Input error={!!error} success={!!success} {...inputProps} />}
      
      {hint && !error && !success && (
        <p className="font-mono text-caption text-gray-700">{hint}</p>
      )}
      
      {error && (
        <p className="font-mono text-caption text-warning-orange font-medium">
          {error}
        </p>
      )}
      
      {success && (
        <p className="font-mono text-caption text-energy-green font-medium">
          {success}
        </p>
      )}
    </div>
  )
}

// src/shared/ui/molecules/select.tsx
export interface SelectProps extends HTMLAttributes<HTMLSelectElement> {
  options: { value: string; label: string }[]
  placeholder?: string
  error?: boolean
  success?: boolean
}

const Select = ({ 
  options, 
  placeholder, 
  error, 
  success, 
  className, 
  ...props 
}: SelectProps) => {
  const baseClasses = [
    'w-full px-4 py-3',
    'font-mono text-body',
    'bg-pure-white border-3 border-void-black',
    'appearance-none cursor-pointer',
    'transition-all duration-100 ease-neo',
    'focus:outline-none focus:border-electric-blue',
    'focus:shadow-[0_0_0_3px_rgba(0,229,255,0.2)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    // Custom arrow using background image
    'bg-no-repeat bg-right-3 bg-center',
    'bg-[url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%23000\'%3e%3cpath d=\'M7 10l5 5 5-5z\'/%3e%3c/svg%3e")]',
  ]

  const stateClasses = {
    error: 'border-warning-orange focus:border-warning-orange focus:shadow-[0_0_0_3px_rgba(255,107,53,0.2)]',
    success: 'border-energy-green focus:border-energy-green focus:shadow-[0_0_0_3px_rgba(57,255,20,0.2)]',
  }

  return (
    <select
      className={cn(
        baseClasses,
        error && stateClasses.error,
        success && stateClasses.success,
        className
      )}
      {...props}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export { FormField, Select }
