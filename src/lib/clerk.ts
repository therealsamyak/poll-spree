import { useAuth, useUser } from "@clerk/clerk-react";

export const useAuthState = () => {
	const { isLoaded, isSignedIn } = useAuth();
	const { user, isLoaded: userLoaded } = useUser();

	return {
		isLoaded: isLoaded && userLoaded,
		isSignedIn,
		user,
		userId: user?.id,
	};
};
