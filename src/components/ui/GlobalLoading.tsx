import { useRouterState } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export function GlobalLoading() {
  const isLoading = useRouterState({ select: (s) => s.isLoading })
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (isLoading) {
      setProgress(30)
      const timer = setTimeout(() => setProgress(80), 500)
      return () => clearTimeout(timer)
    } else {
      setProgress(100)
      const timer = setTimeout(() => setProgress(0), 200)
      return () => clearTimeout(timer)
    }
  }, [isLoading])

  if (progress === 0) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-1 bg-transparent">
        <div 
            className="h-full bg-primary transition-all duration-500 ease-out" 
            style={{ width: `${progress}%` }} 
        />
    </div>
  )
}
