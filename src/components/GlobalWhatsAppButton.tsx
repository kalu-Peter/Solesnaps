import React from "react";
import { useAuth } from "@/contexts/AuthContext";

const GlobalWhatsAppButton: React.FC = () => {
  const { isAdmin } = useAuth();

  // Read WhatsApp number from Vite env (VITE_WHATSAPP_NUMBER). Fallback to previous value
  const envNumber =
    (import.meta.env.VITE_WHATSAPP_NUMBER as string) || "254111532381";

  // Hide the button for admins
  if (isAdmin) return null;

  const waLink = `https://wa.me/${envNumber}?text=${encodeURIComponent(
    "Hello SoleSnaps support, I need help with an order."
  )}`;

  return (
    <a
      href={waLink}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className="fixed bottom-6 right-6 bg-green-600 hover:bg-green-700 text-white rounded-full p-3 shadow-lg flex items-center justify-center z-50"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-6 h-6"
        aria-hidden
      >
        <path d="M20.52 3.478A11.873 11.873 0 0012 0C5.373 0 .05 5.373.05 12.001c0 2.115.554 4.182 1.606 6.012L0 24l6.188-1.586A11.922 11.922 0 0012 24c6.627 0 11.999-5.373 11.999-11.999 0-3.204-1.249-6.206-3.479-8.523zM12 21.818c-1.756 0-3.48-.472-4.994-1.363l-.357-.214-3.678.943.98-3.584-.232-.37A9.82 9.82 0 012.18 12.001C2.18 6.14 6.139 2.18 12 2.18c2.62 0 5.077.99 6.928 2.79a9.73 9.73 0 012.851 6.99c0 5.862-3.96 9.822-9.822 9.822z" />
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.149-.198.297-.768.966-.941 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.151-.173.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.149-.672-1.611-.921-2.205-.242-.579-.487-.5-.672-.51l-.57-.01c-.198 0-.52.074-.793.372s-1.04 1.016-1.04 2.479 1.064 2.872 1.212 3.074c.148.198 2.095 3.2 5.077 4.487  .709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
      </svg>
    </a>
  );
};

export default GlobalWhatsAppButton;
