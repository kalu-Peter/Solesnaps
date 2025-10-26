import Header from "@/components/Header";

const FAQs = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Frequently Asked Questions</h1>
        <p className="text-muted-foreground">
          Common questions about ordering, shipping, and returns will appear
          here.
        </p>
      </main>
    </div>
  );
};

export default FAQs;
