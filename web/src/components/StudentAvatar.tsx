type StudentAvatarProps = {
  student?: { name?: string; email?: string; image?: string; profileImage?: string; avatar?: string } | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-lg',
}

export default function StudentAvatar({ student, size = 'md', className = '' }: StudentAvatarProps) {
  const image = student?.image || student?.profileImage || student?.avatar
  const imageUrl = image && (image.startsWith('http') ? image : `${import.meta.env.VITE_API_URL || '/api/v1'}${image}`)
  const initials = (student?.name || student?.email || '?').trim().slice(0, 1).toUpperCase()

  return imageUrl ? (
    <img src={imageUrl} alt={student?.name || 'Student'} className={`${sizes[size]} rounded-full object-cover flex-shrink-0 ${className}`} />
  ) : (
    <div className={`${sizes[size]} rounded-full bg-slate-100 text-slate-600 font-bold flex items-center justify-center flex-shrink-0 ${className}`}>
      {initials}
    </div>
  )
}
