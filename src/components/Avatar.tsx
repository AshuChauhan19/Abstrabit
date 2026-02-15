'use client'

interface AvatarProps {
  name?: string
  email?: string
  imageUrl?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function Avatar({ name, email, imageUrl, size = 'md' }: AvatarProps) {
  // Get initials from name or email
  const initials = (name || email || '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('')

  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-10 h-10 text-base',
  }

  // If image URL is available, display the image
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={name || email || 'User avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover border border-gray-200`}
      />
    )
  }

  // Fallback to initials
  return (
    <div
      className={`${sizeClasses[size]} inline-flex items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold`}
      title={name || email}
    >
      {initials}
    </div>
  )
}
