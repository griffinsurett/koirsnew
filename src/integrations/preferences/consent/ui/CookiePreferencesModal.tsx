// src/integrations/preferences/ui/consent/components/CookiePreferencesModal.tsx
/**
 * Cookie Preferences Modal (Default UI)
 *
 * Detailed consent preferences with granular category controls.
 * Allows users to enable/disable specific cookie categories.
 *
 * After preferences are saved, enables scripts via scriptManager.
 */

import {
  useState,
  useMemo,
  useTransition,
  useRef,
  useEffect,
  memo,
} from "react";
import Modal from "@/components/Modal";
import { useCookieStorage } from "@/hooks/useCookieStorage";
import { enableConsentedScripts } from "@/integrations/preferences/consent/core/scripts/scriptManager";
import type {
  CookieConsent,
  CookieCategoryInfo,
} from "@/integrations/preferences/consent/core/types";
import Button from "@/components/Button/Button";
import ToggleControl from "@/integrations/preferences/shared/ui/ToggleControl";
import Accordion from "@/components/LoopTemplates/Accordion";
import Icon from "@/components/Icon";

interface CookiePreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const cookieCategories: CookieCategoryInfo[] = [
  {
    id: "necessary",
    title: "Strictly Necessary Cookies",
    description:
      "These cookies are essential for the website to function properly. They enable core functionality such as security, network management, and accessibility.",
    required: true,
  },
  {
    id: "functional",
    title: "Functional Cookies",
    description:
      "These cookies enable the website to provide enhanced functionality and personalization. They may be set by us or by third party providers.",
  },
  {
    id: "performance",
    title: "Performance Cookies",
    description:
      "These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.",
  },
  {
    id: "targeting",
    title: "Targeting Cookies",
    description:
      "These cookies may be set through our site by our advertising partners to build a profile of your interests and show you relevant adverts.",
  },
];

function CookiePreferencesModal({
  isOpen,
  onClose,
}: CookiePreferencesModalProps) {
  const { getCookie, setCookie } = useCookieStorage();
  const [isPending, startTransition] = useTransition();

  // Parse cookie only once with useMemo
  const initialPreferences = useMemo(() => {
    const existingConsent = getCookie("cookie-consent");
    if (existingConsent) {
      try {
        return JSON.parse(existingConsent) as CookieConsent;
      } catch (error) {
        console.error("Failed to parse cookie consent:", error);
      }
    }
    return {
      necessary: true,
      functional: false,
      performance: false,
      targeting: false,
      timestamp: Date.now(),
    };
  }, [getCookie]);

  const [preferences, setPreferences] =
    useState<CookieConsent>(initialPreferences);
  const [canScroll, setCanScroll] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Check if scroll container has overflow
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const checkScroll = () => {
      const hasOverflow = container.scrollHeight > container.clientHeight;
      const isAtBottom =
        container.scrollTop + container.clientHeight >=
        container.scrollHeight - 10;
      setCanScroll(hasOverflow && !isAtBottom);
    };

    checkScroll();
    container.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll, { passive: true });

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [isOpen]);

  const accordionItems = cookieCategories.map((category, idx) => ({
    id: category.id,
    title: category.title,
    description: category.description,
    contentSlotId: `cookie-category-${idx}-content`,
  }));

  const handleToggle = (
    categoryId: keyof Omit<CookieConsent, "timestamp">,
    nextValue?: boolean
  ) => {
    if (categoryId === "necessary") return;

    setPreferences((prev) => ({
      ...prev,
      [categoryId]:
        typeof nextValue === "boolean" ? nextValue : !prev[categoryId],
    }));
  };

  const handleRejectAll = () => {
    const consent: CookieConsent = {
      necessary: true,
      functional: false,
      performance: false,
      targeting: false,
      timestamp: Date.now(),
    };

    // Save consent
    setCookie("cookie-consent", JSON.stringify(consent), { expires: 365 });

    // Enable scripts based on new consent
    enableConsentedScripts();

    // Dispatch custom event
    window.dispatchEvent(new Event("consent-changed"));

    startTransition(() => {
      onClose();
    });
  };

  const handleConfirm = () => {
    const consent: CookieConsent = {
      ...preferences,
      timestamp: Date.now(),
    };

    // Save consent
    setCookie("cookie-consent", JSON.stringify(consent), { expires: 365 });

    // Enable scripts based on new consent
    enableConsentedScripts();

    // Dispatch custom event
    window.dispatchEvent(new Event("consent-changed"));

    startTransition(() => {
      onClose();
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeButton={true}
      className="bg-bg rounded-2xl p-8 max-w-3xl w-full mx-4 max-h-[90vh] flex flex-col shadow-2xl"
      overlayClass="bg-primary-dark/60"
      ariaLabel="Manage cookie consent preferences"
      ssr={false}
    >
      <div className="mb-6 shrink-0">
        <h2 className="text-3xl font-bold text-heading mb-4">
          Manage Consent Preferences
        </h2>
        <p className="text-text text-xs lg:text-sm leading-relaxed mb-3">
          We use cookies and similar technologies to help personalize content
          and offer a better experience. You can click{" "}
          <Button variant="link" href="/cookie-policy">
            here
          </Button>{" "}
          to find out more and change our default settings. However, blocking
          some types of cookies may impact your experience of the site and the
          services we are able to offer.
        </p>
        <Button variant="link" href="/cookie-policy">
          More information
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </Button>
      </div>

      {/* Scrollable accordion container */}
      <div className="relative flex-1 min-h-0">
        <div
          ref={scrollContainerRef}
          className="overflow-y-auto max-h-[40vh] pr-2"
        >
          <Accordion
            allowMultiple
            className="space-y-3"
            items={accordionItems}
            showIndicator={false}
            headerSlot={({ item, id, expanded }) => {
              const category = cookieCategories.find((c) => c.id === item.id);
              if (!category) return null;
              const toggleId = `${id}-toggle`;
              return (
                <div className="flex items-center gap-3 w-full">
                  <span className="font-semibold text-heading text-base flex-1">
                    {category.title}
                  </span>
                  <div className="shrink-0 flex items-center gap-3">
                    {category.required && (
                      <span className="text-sm font-semibold text-primary">
                        Always Active
                      </span>
                    )}
                    <ToggleControl
                      label={category.title}
                      description={category.description}
                      checked={
                        preferences[
                          category.id as keyof Omit<CookieConsent, "timestamp">
                        ]
                      }
                      onChange={(checked) =>
                        handleToggle(
                          category.id as keyof Omit<CookieConsent, "timestamp">,
                          checked
                        )
                      }
                      disabled={category.required}
                      id={toggleId}
                      bordered={false}
                      className="py-0"
                      hideText={true}
                      size="lg"
                    />
                  </div>
                </div>
              );
            }}
          />

          {accordionItems.map((item, idx) => (
            <div
              key={item.id}
              id={`cookie-category-${idx}-content`}
              style={{ display: "none" }}
            >
              <p className="text-sm text-text leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-6 pt-4 shrink-0">
        <Button
          variant="secondary"
          onClick={handleRejectAll}
          className="flex-1"
          type="button"
          disabled={isPending}
        >
          Reject All
        </Button>
        <Button
          variant="primary"
          onClick={handleConfirm}
          className="flex-1"
          animated={false}
          type="button"
          disabled={isPending}
        >
          Confirm My Choices
        </Button>
      </div>
    </Modal>
  );
}

export default memo(CookiePreferencesModal);
