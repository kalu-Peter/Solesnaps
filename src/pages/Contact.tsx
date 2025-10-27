import Header from "@/components/Header";
import { useState } from "react";

// Read WhatsApp number from Vite env (VITE_WHATSAPP_NUMBER). Fallback to previous value
const WHATSAPP_NUMBER =
  (import.meta.env.VITE_WHATSAPP_NUMBER as string) || "254111532381";

const Contact = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const waLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
    "Hello SoleSnaps support, I need help with an order."
  )}`;

  const validateEmail = (e: string) => /\S+@\S+\.\S+/.test(e);

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();

    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatusMessage("Please fill in all fields.");
      return;
    }

    if (!validateEmail(email)) {
      setStatusMessage("Please enter a valid email address.");
      return;
    }

    // Build a mailto link so the user's email client is used to send the message.
    const subject = `SoleSnaps Contact from ${name}`;
    const body = `Name: ${name}%0D%0AEmail: ${email}%0D%0A%0D%0A${encodeURIComponent(
      message
    )}`;
    const mailto = `mailto:support@solesnaps.example?subject=${encodeURIComponent(
      subject
    )}&body=${body}`;

    // Open mail client
    window.open(mailto);
    setStatusMessage(
      "Opened your email client to send the message. Thank you!"
    );
    // Optionally clear the form
    setName("");
    setEmail("");
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Contact Us</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <p className="text-muted-foreground mb-4">
              For inquiries, you can email us at
              <a
                className="ml-1 text-primary underline"
                href="mailto:support@solesnaps.example"
              >
                support@solesnaps.example
              </a>
              , or start a chat with our support team on WhatsApp using the
              button below.
            </p>

            <p className="mb-6">
              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-5 h-5"
                  aria-hidden
                >
                  <path d="M20.52 3.478A11.873 11.873 0 0012 0C5.373 0 .05 5.373.05 12.001c0 2.115.554 4.182 1.606 6.012L0 24l6.188-1.586A11.922 11.922 0 0012 24c6.627 0 11.999-5.373 11.999-11.999 0-3.204-1.249-6.206-3.479-8.523zM12 21.818c-1.756 0-3.48-.472-4.994-1.363l-.357-.214-3.678.943.98-3.584-.232-.37A9.82 9.82 0 012.18 12.001C2.18 6.14 6.139 2.18 12 2.18c2.62 0 5.077.99 6.928 2.79a9.73 9.73 0 012.851 6.99c0 5.862-3.96 9.822-9.822 9.822z" />
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.672.149-.198.297-.768.966-.941 1.164-.173.198-.347.223-.644.075-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.151-.173.2-.298.3-.497.099-.198.05-.372-.025-.521-.075-.149-.672-1.611-.921-2.205-.242-.579-.487-.5-.672-.51l-.57-.01c-.198 0-.52.074-.793.372s-1.04 1.016-1.04 2.479 1.064 2.872 1.212 3.074c.148.198 2.095 3.2 5.077 4.487  .709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414-.074-.124-.272-.198-.57-.347z" />
                </svg>
                Chat on WhatsApp
              </a>
            </p>
          </div>

          <div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  placeholder="Your name"
                  aria-label="Name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  placeholder="you@example.com"
                  aria-label="Email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 bg-background"
                  rows={6}
                  placeholder="How can we help you?"
                  aria-label="Message"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:opacity-95"
                >
                  Send Message
                </button>
              </div>

              {statusMessage && (
                <div className="text-sm text-muted-foreground">
                  {statusMessage}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Contact;
