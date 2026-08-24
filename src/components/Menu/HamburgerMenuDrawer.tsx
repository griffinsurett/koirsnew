// src/components/Menu/HamburgerMenuDrawer.tsx
/**
 * Mobile Menu Drawer
 *
 * Full-screen mobile navigation modal. Structure follows the sandy-hooker
 * drawer (photo background + tinted overlay, logo, centered menu, X mirroring
 * the hamburger position), rebuilt in Koi's palette: a roof/solar aerial behind
 * the brand navy tint, with the logo and light menu type over it.
 *
 * The menu items themselves are the project's shared MobileMenuItem — only the
 * colours are overridden here (via .koi-mobile-nav) so the items read against
 * the dark photo without forking the component.
 */

import { useState, type ReactNode } from "react";
import Modal from "@/components/Modal";
import MobileMenuItem from "@/components/LoopComponents/Menu/MobileMenuItem";
import HamburgerButton from "./HamburgerButton";
import drawerBg from "@/assets/koi/roofingandsolarvid-poster.jpg";
import logo from "@/assets/koi/logowwords.png";

interface MobileMenuDrawerProps {
  items: any[];
  className?: string;
  hamburgerTransform?: boolean;
  closeButton?: boolean;
  children?: ReactNode;
  /** Astro named slot — the social icon row pinned to the drawer's bottom. */
  footer?: ReactNode;
}

export default function MobileMenuDrawer({
  items,
  className = "",
  hamburgerTransform = true,
  closeButton = false,
  children,
  footer,
}: MobileMenuDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleNavigate = () => {
    setIsOpen(false);
  };

  const bgSrc = (drawerBg as any).src ?? drawerBg;
  const logoSrc = (logo as any).src ?? logo;

  return (
    <>
      {/* Hidden while open — the modal portal covers it and renders its own X. */}
      <HamburgerButton
        isOpen={isOpen}
        onChange={setIsOpen}
        hamburgerTransform={hamburgerTransform}
        ariaLabel={isOpen ? "Close menu" : "Open menu"}
        id="mobile-menu-toggle"
        className={isOpen ? "invisible" : ""}
      />

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        position="center"
        className="w-full max-w-full h-full p-0 rounded-none overflow-hidden"
        overlayClass="bg-black/50"
        closeButton={false}
        ariaLabel="Mobile navigation menu"
        ssr={false}
      >
        {/* Decorative photo — hidden from assistive tech (WCAG 1.1.1). */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ zIndex: 0, backgroundImage: `url(${bgSrc})` }}
          aria-hidden="true"
        />
        {/* Brand navy tint, matching the hero overlays. */}
        <div
          className="absolute inset-0 bg-primary/90"
          style={{ zIndex: 1 }}
          aria-hidden="true"
        />

        <nav
          className={`koi-mobile-nav ${className} relative h-full overflow-y-auto p-6 pt-10 flex flex-col items-stretch gap-2 text-center`}
          style={{ zIndex: 2 }}
          aria-label="Mobile navigation"
        >
          {/* X mirroring the hamburger's position. */}
          <div className="absolute top-0 right-0 p-2" style={{ zIndex: 10 }}>
            <HamburgerButton
              isOpen={true}
              onChange={() => setIsOpen(false)}
              hamburgerTransform={true}
              ariaLabel="Close menu"
              id="mobile-menu-toggle-inner"
            />
          </div>

          <a
            href="/"
            onClick={handleNavigate}
            aria-label="Home"
            className="self-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-primary"
          >
            <img
              src={logoSrc}
              alt="Koi Roofing and Solar"
              className="h-32 w-auto"
            />
          </a>

          <ul className="space-y-2 text-center w-[min(20rem,100%)] self-center mx-auto flex-1 flex flex-col justify-center">
            {items.map((item) => (
              <MobileMenuItem
                key={item.id}
                {...item}
                onNavigate={handleNavigate}
              />
            ))}
          </ul>

          {/* Socials along the bottom edge. */}
          {footer && (
            <div className="mt-6 pb-2 flex justify-center">{footer}</div>
          )}

          {children && <div className="mt-4 text-center">{children}</div>}
        </nav>
      </Modal>
    </>
  );
}
