import Header from "@/components/Header";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-4">About Us</h1>
        <p className="text-muted-foreground">
          SoleSnaps is a small team passionate about shoes. This is placeholder
          content.
        </p>
      </main>
    </div>
  );
};

export default About;
