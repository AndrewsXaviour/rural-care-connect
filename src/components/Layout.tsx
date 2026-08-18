import { Outlet, useLocation } from "react-router-dom";
import { SwipeMaskNav } from "./SwipeMaskNav";
import { LocationBar } from "./LocationBar";
import { ProfileMenu } from "./ProfileMenu";
import { Assistant } from "./Assistant";
import { AnimatePresence, motion } from "framer-motion";
import { Heart } from "lucide-react";

const PageTransition = ({ children, locationKey }: { children: React.ReactNode, locationKey: string }) => (
  <motion.div
    key={locationKey}
    initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
    exit={{ opacity: 0, y: -15, filter: "blur(4px)" }}
    transition={{ duration: 0.3, ease: "easeOut" }}
    className="w-full flex-1 flex flex-col"
  >
    {children}
  </motion.div>
);

export const Layout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/" || location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col overflow-x-hidden">
      {/* Skip to main content — accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-background focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold"
      >
        Skip to main content
      </a>
      <div className="fixed inset-0 bg-grid-pattern opacity-30 z-0 pointer-events-none" aria-hidden="true"></div>
      {!isAuthPage && (
        <>
          <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 pb-2 px-4 pointer-events-none">
            <div className="w-full max-w-5xl space-y-3 pointer-events-auto">
              <div className="flex items-center justify-between gap-4">
                {/* Brand Mark */}
                <div className="flex items-center gap-2.5 mr-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.15)]">
                    <Heart className="w-4.5 h-4.5 text-primary" fill="currentColor" />
                  </div>
                  <span className="text-sm font-bold text-white tracking-tight hidden lg:block">RuralCare</span>
                </div>
                <div className="flex-1 max-w-sm">
                  <LocationBar />
                </div>
                <ProfileMenu />
              </div>
              <div className="flex justify-center">
                <SwipeMaskNav />
              </div>
            </div>
          </header>
          <main id="main-content" className="pt-36 px-4 pb-12 max-w-5xl w-full mx-auto flex flex-col flex-1 relative z-10" role="main">
            <AnimatePresence mode="wait">
              <PageTransition locationKey={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </main>
          <Assistant />
        </>
      )}
      {isAuthPage && (
        <main id="main-content" className="min-h-screen flex flex-col relative z-10" role="main">
          <AnimatePresence mode="wait">
            <PageTransition locationKey={location.pathname}>
              <Outlet />
            </PageTransition>
          </AnimatePresence>
        </main>
      )}
    </div>
  );
};
