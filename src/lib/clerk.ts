import { useAuth, useUser } from "@clerk/tanstack-react-start"

export const useAuthState = () => {
  const { isLoaded, isSignedIn } = useAuth()
  const { user, isLoaded: userLoaded } = useUser()

  return {
    isLoaded: isLoaded && userLoaded,
    isSignedIn,
    user,
    userId: user?.id,
  }
}
