import { AlertCircle, CheckCircle, Info, X, XCircle } from "lucide-react"
import * as React from "react"
import { SignInModal } from "@/components/sign-in-modal"
import { cn } from "@/lib/utils"

interface NotificationProps {
  message: string
  variant: "success" | "error" | "warning" | "info"
  onClose?: () => void
  duration?: number
}

const Notification = ({
  message,
  variant,
  onClose,
  duration = 3000,
}: NotificationProps) => {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onClose?.(), 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const icons = {
    success: <CheckCircle className="h-4 w-4" />,
    error: <XCircle className="h-4 w-4" />,
    warning: <AlertCircle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
  }

  const variants = {
    success:
      "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200",
    error:
      "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200",
    warning:
      "bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200",
    info: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200",
  }

  if (!isVisible) return null

  return (
    <div
      className={cn(
        "slide-in-from-right-full fixed top-4 right-4 z-50 max-w-sm animate-in",
        "transition-all duration-300 ease-in-out",
        isVisible ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
      )}
    >
      <div
        className={cn(
          "relative w-full rounded-lg border p-4 shadow-lg",
          variants[variant],
        )}
      >
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex-shrink-0">{icons[variant]}</div>
          <p className="flex-1 font-medium text-sm leading-relaxed">
            {message}
          </p>
          {onClose && (
            <button
              type="button"
              onClick={() => {
                setIsVisible(false)
                setTimeout(() => onClose(), 300)
              }}
              className="flex-shrink-0 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              aria-label="Close notification"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

interface NotificationContextType {
  showNotification: (props: Omit<NotificationProps, "onClose">) => void
  showSignInNotification: () => void
}

const NotificationContext = React.createContext<NotificationContextType | null>(
  null,
)

export const NotificationProvider = ({
  children,
}: {
  children: React.ReactNode
}) => {
  const [notifications, setNotifications] = React.useState<
    Array<{
      id: string
      props: Omit<NotificationProps, "onClose">
    }>
  >([])

  const [signInModal, setSignInModal] = React.useState<{
    isOpen: boolean
  }>({
    isOpen: false,
  })

  const showNotification = React.useCallback(
    (props: Omit<NotificationProps, "onClose">) => {
      const id = Math.random().toString(36).slice(2, 11)
      setNotifications((prev) => [...prev, { id, props }])
    },
    [],
  )

  const showSignInNotification = React.useCallback(() => {
    setSignInModal({
      isOpen: true,
    })
  }, [])

  const removeNotification = React.useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const closeSignInModal = React.useCallback(() => {
    setSignInModal({
      isOpen: false,
    })
  }, [])

  return (
    <NotificationContext.Provider
      value={{ showNotification, showSignInNotification }}
    >
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(({ id, props }) => (
          <Notification
            key={id}
            {...props}
            onClose={() => removeNotification(id)}
          />
        ))}
      </div>
      <SignInModal isOpen={signInModal.isOpen} onClose={closeSignInModal} />
    </NotificationContext.Provider>
  )
}

export const useNotification = () => {
  const context = React.useContext(NotificationContext)
  if (!context) {
    throw new Error(
      "useNotification must be used within a NotificationProvider",
    )
  }
  return context
}
