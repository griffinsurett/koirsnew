// src/integrations/preferences/ui/consent/components/CookiePreferencesButton.tsx
import { useEffect, useState, lazy, Suspense, memo } from "react";
import { subscribeToCookiePreferencesRequests } from "@/integrations/preferences/consent/core/utils/events";
import Button from "@/components/Button/Button";

const CookiePreferencesModal = lazy(() => import("./CookiePreferencesModal"));

function CookiePreferencesButton() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    return subscribeToCookiePreferencesRequests(() => {
      setShowModal(true);
    });
  }, []);

  return (
    <>
      <Button
        variant="link"
        size="sm"
        onClick={() => setShowModal(true)}
        aria-label="Manage cookie preferences"
        rightIcon="lucide:settings"
      >
        Your Privacy Choices
      </Button>

      {showModal && (
        <Suspense fallback={null}>
          <CookiePreferencesModal
            isOpen={showModal}
            onClose={() => setShowModal(false)}
          />
        </Suspense>
      )}
    </>
  );
}

export default memo(CookiePreferencesButton);
