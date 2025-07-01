import { Heart } from "lucide-react"
import { SiGithub, SiX } from "react-icons/si"

export const Footer = () => {
  return (
    <footer className="mt-16 border-t pt-8">
      <div className="space-y-6 text-center">
        <div className="flex items-center justify-center space-x-6">
          <a
            href="https://github.com/therealsamyak/poll-spree"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <SiGithub className="h-5 w-5" />
          </a>
          <a
            href="https://x.com/samheart564"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            <SiX className="h-5 w-5" />
          </a>
        </div>
        <div className="space-y-2">
          <p className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
            Made with <Heart className="h-4 w-4 text-destructive" /> for the community
          </p>
          <p className="text-muted-foreground text-xs">© 2025 Poll Spree. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
