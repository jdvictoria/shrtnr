import { Coffee, Github } from "lucide-react";

export function Footer() {
  return (
    <footer className="dispatch-footer">
      <div className="dispatch-footer__inner">
        <p>
          © 2026 jdvictoria. All rights reserved.
        </p>
        <div className="dispatch-footer__links">
          <a
            href="https://ko-fi.com/B0B71W3AVW"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Support on Ko-fi"
            className="dispatch-footer__link dispatch-footer__link--support"
          >
            <Coffee className="h-4 w-4" />
          </a>
          <a
            href="https://github.com/jdvictoria"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="dispatch-footer__link"
          >
            <Github className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
