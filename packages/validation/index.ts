// Validation utilities for the time tracker application

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (password.length < 6) {
    errors.push('Password must be at least 6 characters long')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateEmployeeData = (data: { name: string; email: string }): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required')
  }
  
  if (!data.email || !validateEmail(data.email)) {
    errors.push('Valid email is required')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateProjectData = (data: { name: string; description?: string; hourly_rate?: number }): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Project name is required')
  }
  
  if (data.hourly_rate !== undefined && data.hourly_rate < 0) {
    errors.push('Hourly rate must be positive')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateTaskData = (data: { name: string; project_id: string }): { valid: boolean; errors: string[] } => {
  const errors: string[] = []
  
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Task name is required')
  }
  
  if (!data.project_id || data.project_id.trim().length === 0) {
    errors.push('Project ID is required')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}