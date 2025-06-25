import { SignInButton, UserButton, useAuth } from "@clerk/clerk-react";
import { BarChart3, Home, TrendingUp } from "lucide-react";
import { ModeToggle } from "./mode-toggle";
import { Button } from "./ui/button";

export const Header = () => {
	const { isSignedIn } = useAuth();

	return (
		<header className="sticky top-0 z-50 w-full border-b bg-background/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/60">
			<div className="w-full max-w-none flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo and Brand */}
				<div className="flex items-center space-x-3">
					<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/80 shadow-lg">
						<BarChart3 className="h-6 w-6 text-primary-foreground" />
					</div>
					<div className="hidden sm:block">
						<h1 className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text font-bold text-transparent text-xl">
							Poll Spree
						</h1>
						<p className="text-muted-foreground text-xs">Community Polls</p>
					</div>
				</div>

				{/* Navigation */}
				<nav className="hidden items-center space-x-8 md:flex">
					<a
						className="flex items-center space-x-2 font-medium text-muted-foreground text-sm transition-colors hover:text-primary"
						href="/"
					>
						<Home className="h-4 w-4" />
						<span>Home</span>
					</a>
					<a
						className="flex items-center space-x-2 font-medium text-muted-foreground text-sm transition-colors hover:text-primary"
						href="/"
					>
						<TrendingUp className="h-4 w-4" />
						<span>Trending</span>
					</a>
				</nav>

				{/* Actions */}
				<div className="flex items-center space-x-3">
					<ModeToggle />
					{isSignedIn ? (
						<div className="flex items-center space-x-2">
							{/* <span className="hidden text-muted-foreground text-sm sm:block">
								Welcome back!
							</span> */}
							<UserButton
								appearance={{
									elements: {
										avatarBox: "h-8 w-8",
									},
								}}
							/>
						</div>
					) : (
						<SignInButton mode="modal">
							<Button className="bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:from-primary/90 hover:to-primary/70">
								Sign In
							</Button>
						</SignInButton>
					)}
				</div>
			</div>
		</header>
	);
};
