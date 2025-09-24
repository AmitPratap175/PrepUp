import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Settings } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";

const navigation = [
  { title: "Home", href: "/" },
  { 
    title: "CAT", 
    href: "#",
    items: [
      { title: "CAT Courses", href: "/courses?exam=cat" },
      { title: "Mock Tests", href: "/mock-tests?exam=cat" },
      { title: "Sectional Tests", href: "/sectional-tests?exam=cat" },
      { title: "Practice Tests", href: "/practice-test?exam=cat" },
      { title: "Quizzes", href: "/quiz?exam=cat" },
      { title: "Study Materials", href: "/study-materials?exam=cat" },
    ]
  },
  { 
    title: "GATE", 
    href: "#",
    items: [
      { title: "GATE Courses", href: "/courses?exam=gate" },
      { title: "Mock Tests", href: "/mock-tests?exam=gate" },
      { title: "Practice Tests", href: "/practice-test?exam=gate" },
      { title: "Quizzes", href: "/quiz?exam=gate" },
      { title: "Study Materials", href: "/study-materials?exam=gate" },
    ]
  },
  { title: "Bookmarks", href: "/bookmarks" },
  { title: "About Us", href: "/about" },
  { title: "Contact", href: "/contact" },
];

/**
 * The main application header component.
 *
 * This component provides the primary navigation for the site, including links
 * to different exam sections (CAT, GATE), user-specific pages like Bookmarks,
 * and general information pages. It adapts its layout for mobile and desktop
 * screens and displays different actions based on the user's authentication
 * status.
 *
 * @returns {JSX.Element} The rendered header component.
 */
export function AppHeader() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated, logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" className="flex items-center gap-2 sm:gap-3 text-foreground hover-elevate">
          <span className="material-symbols-outlined text-2xl sm:text-3xl text-primary">school</span>
          <h2 className="text-lg sm:text-xl font-bold leading-tight tracking-[-0.015em]">PrepUp</h2>
        </Link>
        
        <nav className="hidden lg:flex items-center gap-8">
          {navigation.map((item) => (
            item.items ? (
              <DropdownMenu key={item.title}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors flex items-center gap-1"
                    data-testid={`nav-dropdown-${item.title.toLowerCase()}`}
                  >
                    {item.title}
                    <span className="material-symbols-outlined text-sm">expand_more</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  {item.items.map((subItem) => (
                    <DropdownMenuItem key={subItem.href} asChild>
                      <Link 
                        href={subItem.href} 
                        className="w-full"
                        data-testid={`nav-link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        {subItem.title}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link 
                key={item.href} 
                href={item.href}
                className={`text-sm font-medium transition-colors hover-elevate ${
                  location === item.href 
                    ? 'text-foreground' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                data-testid={`nav-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
              >
                {item.title}
              </Link>
            )
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button asChild variant="secondary" className="hidden sm:flex" size="sm">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
              <Button asChild variant="secondary" className="hidden sm:flex" size="sm">
                <Link href="/bookmarks">Bookmarks</Link>
              </Button>
              <Button asChild variant="secondary" className="hidden sm:flex" size="sm">
                <Link href="/add-question">Add Question</Link>
              </Button>
              <Button asChild variant="ghost" className="hidden sm:flex" size="icon">
                <Link href="/settings">
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </Button>
              <Button onClick={handleLogout} className="hidden sm:flex" size="sm">
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="secondary" className="hidden sm:flex" size="sm">
                <Link href="/login" data-testid="button-login">Login</Link>
              </Button>
              <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm">
                <Link href="/signup" data-testid="button-get-started">Sign Up</Link>
              </Button>
            </>
          )}
          
          {/* Mobile menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden" data-testid="button-mobile-menu">
                <span className="material-symbols-outlined">menu</span>
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
              <div className="p-4">
                <h2 className="text-lg font-semibold mb-4">Menu</h2>
                <nav className="flex flex-col gap-4">
                  {navigation.map((item) => (
                    <div key={item.title}>
                      {item.items ? (
                        <div>
                          <div className="font-medium text-foreground mb-2">{item.title}</div>
                          <div className="ml-4 space-y-2">
                            {item.items.map((subItem) => (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                                data-testid={`mobile-nav-link-${subItem.title.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                {subItem.title}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={item.href}
                          className="block text-sm font-medium text-foreground hover:text-muted-foreground transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                          data-testid={`mobile-nav-link-${item.title.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          {item.title}
                        </Link>
                      )}
                    </div>
                  ))}
                </nav>
                <div className="mt-6 pt-6 border-t">
                  {isAuthenticated ? (
                    <div className="flex flex-col gap-2">
                      <Button asChild variant="secondary" size="sm" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/dashboard">Dashboard</Link>
                      </Button>
                      <Button asChild variant="secondary" size="sm" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/bookmarks">Bookmarks</Link>
                      </Button>
                      <Button asChild variant="secondary" size="sm" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/add-question">Add Question</Link>
                      </Button>
                      <Button asChild variant="ghost" size="sm" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/settings" className="flex items-center gap-2">
                          <Settings className="h-5 w-5" />
                          Settings
                        </Link>
                      </Button>
                      <Button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} size="sm">
                        Logout
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                       <Button asChild variant="secondary" size="sm" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/login" data-testid="button-login">Login</Link>
                      </Button>
                      <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground" size="sm" onClick={() => setMobileMenuOpen(false)}>
                        <Link href="/signup" data-testid="button-get-started">Sign Up</Link>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
