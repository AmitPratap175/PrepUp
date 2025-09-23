import { Link } from "wouter";

export function AppFooter() {
  return (
    <footer className="bg-muted/50 border-t border-border">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 text-foreground mb-4">
              <span className="material-symbols-outlined text-2xl text-primary">school</span>
              <h3 className="text-lg font-bold">PrepUp</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Empowering students to achieve their dreams through comprehensive exam preparation.
            </p>
            <div className="flex gap-3">
              <button className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors hover-elevate" data-testid="social-facebook">
                <span className="sr-only">Facebook</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </button>
              <button className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors hover-elevate" data-testid="social-twitter">
                <span className="sr-only">Twitter</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </button>
              <button className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center hover:bg-primary/90 transition-colors hover-elevate" data-testid="social-instagram">
                <span className="sr-only">Instagram</span>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.65 13.696 3.65 12.017s.548-2.878 1.476-3.774c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.896 1.476 2.095 1.476 3.774s-.548 2.878-1.476 3.774c-.875.807-2.026 1.297-3.323 1.297z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Courses */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Courses</h4>
            <div className="space-y-2">
              <Link href="/courses?exam=cat" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-cat-preparation">CAT Preparation</Link>
              <Link href="/courses?exam=gate" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-gate-preparation">GATE Preparation</Link>
              <Link href="/practice-test" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-practice-tests">Practice Tests</Link>
              <Link href="/study-materials" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-study-materials">Study Materials</Link>
              <Link href="/current-affairs" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-current-affairs">Current Affairs</Link>
            </div>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Support</h4>
            <div className="space-y-2">
              <Link href="/help" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-help-center">Help Center</Link>
              <Link href="/contact" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-contact-us">Contact Us</Link>
              <Link href="/about" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-about-us">About Us</Link>
              <Link href="/careers" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-careers">Careers</Link>
              <Link href="/settings" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-settings">Settings</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-foreground mb-4">Legal</h4>
            <div className="space-y-2">
              <Link href="/privacy" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-privacy-policy">Privacy Policy</Link>
              <Link href="/terms" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-terms-of-service">Terms of Service</Link>
              <Link href="/cookies" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-cookie-policy">Cookie Policy</Link>
              <Link href="/refund" className="block text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-link-refund-policy">Refund Policy</Link>
            </div>
          </div>
        </div>

        <div className="border-t border-border pt-6 mt-8 text-center sm:text-left">
          <p className="text-xs sm:text-sm text-muted-foreground">
            © 2024 PrepUp. All rights reserved. Made with ❤️ for students.
          </p>
        </div>
      </div>
    </footer>
  );
}
