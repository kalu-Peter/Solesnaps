import Header from "@/components/Header";

const Shipping = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">Shipping</h1>
        <p className="text-muted-foreground">
          Information about shipping rates, carriers and delivery times.
        </p>
      </main>
    </div>
  );
};

export default Shipping;
