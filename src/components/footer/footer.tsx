import { Heart } from "lucide-react"
import { SiGithub, SiX } from "react-icons/si"

export const Footer = () => (
  <footer className="border-border/50 mt-auto border-t pt-8">
    <div className="space-y-6 text-center">
      <div className="flex items-center justify-center space-x-6">
        <a
          href="https://github.com/therealsamyak/poll-spree"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors duration-200"
        >
          <SiGithub className="h-5 w-5" />
        </a>
        <a
          href="https://x.com/samheart564"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors duration-200"
        >
          <SiX className="h-5 w-5" />
        </a>
      </div>
      <div className="space-y-2">
        <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
          Made with <Heart className="text-destructive h-4 w-4" /> for the
          community
        </p>
        <p className="text-muted-foreground text-xs">
          © 2026 PollSpree. All rights reserved.
        </p>
      </div>
    </div>
  </footer>
)
