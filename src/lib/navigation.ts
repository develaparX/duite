import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Navigation routes configuration
 */
export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  income: '/income',
  debtsReceivables: '/debts-receivables',
  investments: '/investments',
  expenses: '/expenses',
} as const

/**
 * Check if a route requires authentication
 */
export function isProtectedRoute(path: string): boolean {
  const protectedRoutes = [
    routes.dashboard,
    routes.income,
    routes.debtsReceivables,
    routes.investments,
    routes.expenses,
  ]
  
  return protectedRoutes.includes(path as any)
}

/**
 * Get the appropriate redirect path after login
 */
export function getRedirectPath(intendedPath?: string): string {
  if (intendedPath && isProtectedRoute(intendedPath)) {
    return intendedPath
  }
  return routes.dashboard
}

/**
 * Navigation hook with authentication awareness
 */
export function useAppNavigation() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()

  const navigateTo = (path: string, options?: { replace?: boolean }) => {
    if (isProtectedRoute(path) && !isAuthenticated) {
      // Redirect to login with intended destination
      navigate({
        to: routes.login,
        search: { redirect: path },
        replace: options?.replace,
      })
      return
    }

    navigate({
      to: path as any,
      replace: options?.replace,
    })
  }

  const navigateToLogin = (redirectPath?: string) => {
    const search = redirectPath ? { redirect: redirectPath } : undefined
    navigate({
      to: routes.login,
      search,
    })
  }

  const navigateToRegister = (redirectPath?: string) => {
    const search = redirectPath ? { redirect: redirectPath } : undefined
    navigate({
      to: routes.register,
      search,
    })
  }

  const navigateAfterLogin = (intendedPath?: string) => {
    const path = getRedirectPath(intendedPath)
    navigate({
      to: path as any,
      replace: true,
    })
  }

  const navigateAfterLogout = () => {
    logout()
    navigate({
      to: routes.home,
      replace: true,
    })
  }

  return {
    navigateTo,
    navigateToLogin,
    navigateToRegister,
    navigateAfterLogin,
    navigateAfterLogout,
    routes,
  }
}

/**
 * Get navigation items for the main menu
 */
export function getNavigationItems() {
  return [
    {
      title: 'Dashboard',
      href: routes.dashboard,
      icon: 'PieChart',
      description: 'Overview of your finances',
    },
    {
      title: 'Income',
      href: routes.income,
      icon: 'TrendingUp',
      description: 'Manage your income sources',
    },
    {
      title: 'Expenses',
      href: routes.expenses,
      icon: 'CreditCard',
      description: 'Track your daily spending',
    },
    {
      title: 'Debts & Receivables',
      href: routes.debtsReceivables,
      icon: 'CreditCard',
      description: "Track what you owe and what's owed to you",
    },
    {
      title: 'Investments',
      href: routes.investments,
      icon: 'BarChart3',
      description: 'Monitor your investment portfolio',
    },
  ]
}

/**
 * Get breadcrumb items for a given path
 */
export function getBreadcrumbs(path: string) {
  const breadcrumbs: Array<{ title: string; href: string }> = [
    { title: 'Home', href: routes.home },
  ]

  switch (path) {
    case routes.dashboard:
      breadcrumbs.push({ title: 'Dashboard', href: routes.dashboard })
      break
    case routes.income:
      breadcrumbs.push({ title: 'Income', href: routes.income })
      break
    case routes.debtsReceivables:
      breadcrumbs.push({ title: 'Debts & Receivables', href: routes.debtsReceivables })
      break
    case routes.investments:
      breadcrumbs.push({ title: 'Investments', href: routes.investments })
      break
    case routes.expenses:
      breadcrumbs.push({ title: 'Expenses', href: routes.expenses })
      break
    default:
      break
  }

  return breadcrumbs
}