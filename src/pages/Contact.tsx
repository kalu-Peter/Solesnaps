import Header from "@/components/Header";

const Contact = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Contact Us</h1>
        <p className="text-muted-foreground">
          For inquiries, please email us at support@solesnaps.example or use the
          contact form (coming soon).
        </p>
      </main>
    </div>
  );
};

export default Contact;
