import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarouselSlide {
  id: number;
  image: string;
  title: string;
  subtitle: string;
  description: string;
  buttonText?: string;
}

interface HeroCarouselProps {
  onShopNow: () => void;
}

const carouselSlides: CarouselSlide[] = [
  {
    id: 1,
    image: "/carousel/carousel1.jpeg",
    title: "Step Into",
    subtitle: "Style",
    description:
      "Discover the perfect blend of fashion and technology. Quality products at unbeatable prices.",
    buttonText: "Shop Now",
  },
  {
    id: 2,
    image: "/carousel/carousel2.jpeg",
    title: "Unleash Your",
    subtitle: "Authentic Self",
    description:
      "Premium performance footwear designed for champions. Comfort meets innovation.",
    buttonText: "Explore Collection",
  },
  {
    id: 3,
    image: "/carousel/carousel3.jpeg",
    title: "Luxury Meets",
    subtitle: "Everyday Comfort",
    description:
      "Elevate your style with our premium collection. Where sophistication meets comfort.",
    buttonText: "Discover More",
  },
  {
    id: 4,
    image: "/carousel/carousel4.jpeg",
    title: "Walk Into",
    subtitle: "Tomorrow",
    description:
      "Future-forward designs that redefine comfort and style. Step into the next generation.",
    buttonText: "Shop Future",
  },
];

const HeroCarousel = ({ onShopNow }: HeroCarouselProps) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(true);

  // Create extended slides array for infinite loop
  const extendedSlides = [...carouselSlides, ...carouselSlides.slice(0, 1)]; // Add first slide at the end

  // Debug logging
  useEffect(() => {
    console.log(
      `Current slide: ${currentSlide}, Total slides: ${carouselSlides.length}, Extended: ${extendedSlides.length}`
    );
  }, [currentSlide]);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlay) return;

    const interval = setInterval(() => {
      goToNext();
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlay]);

  // Handle infinite loop reset
  useEffect(() => {
    if (currentSlide === carouselSlides.length) {
      // We're at the duplicate first slide
      setTimeout(() => {
        setIsTransitioning(false);
        setCurrentSlide(0);
        setTimeout(() => {
          setIsTransitioning(true);
        }, 50);
      }, 700); // Match transition duration
    }
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    if (index >= 0 && index < carouselSlides.length) {
      setCurrentSlide(index);
      setIsAutoPlay(false);
      // Resume auto-play after 10 seconds of inactivity
      setTimeout(() => setIsAutoPlay(true), 10000);
    }
  };

  const goToPrevious = () => {
    if (currentSlide === 0) {
      // Jump to the last real slide
      setIsTransitioning(false);
      setCurrentSlide(carouselSlides.length - 1);
      setTimeout(() => {
        setIsTransitioning(true);
      }, 50);
    } else {
      setCurrentSlide((prev) => prev - 1);
    }
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  const goToNext = () => {
    setCurrentSlide((prev) => prev + 1);
    setIsAutoPlay(false);
    setTimeout(() => setIsAutoPlay(true), 10000);
  };

  return (
    <section className="relative h-[400px] sm:h-[500px] md:h-[600px] overflow-hidden">
      {/* Carousel Container */}
      <div className="relative h-full">
        {/* Slides */}
        <div
          className={`flex h-full ${
            isTransitioning
              ? "transition-transform duration-700 ease-in-out"
              : ""
          }`}
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {extendedSlides.map((slide, index) => (
            <div
              key={`${slide.id}-${index}`}
              className="relative w-full h-full flex-shrink-0 bg-gradient-to-br from-primary to-accent"
              style={{ minWidth: "100%" }}
            >
              {/* Background Image */}
              <img
                src={slide.image}
                alt={`${slide.title} ${slide.subtitle}`}
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={() => {
                  console.log(
                    `Successfully loaded carousel image: ${slide.image}`
                  );
                }}
                onError={(e) => {
                  console.error(
                    `Failed to load carousel image: ${slide.image}`
                  );
                  // Keep the gradient background visible if image fails
                  e.currentTarget.style.display = "none";
                }}
                loading="eager"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50" />

              {/* Featured Image - Original Size */}
              <div className="absolute right-8 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 z-20 hidden md:block">
                <div className="relative">
                  <img
                    src={slide.image}
                    alt={`Featured ${slide.title} ${slide.subtitle}`}
                    className="max-w-[300px] lg:max-w-[400px] xl:max-w-[500px] h-auto object-contain rounded-lg shadow-2xl"
                    style={{
                      filter: "drop-shadow(0 20px 25px rgb(0 0 0 / 0.3))",
                    }}
                  />
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 blur-xl -z-10 scale-110"></div>
                </div>
              </div>

              {/* Content */}
              <div className="relative container mx-auto px-4 h-full flex flex-col justify-center items-center sm:items-start text-center sm:text-left z-10">
                <div className="max-w-2xl md:max-w-lg lg:max-w-xl xl:max-w-2xl">
                  <h1 className="text-3xl sm:text-4xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-4 sm:mb-6 drop-shadow-lg">
                    {slide.title}{" "}
                    <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">
                      {slide.subtitle}
                    </span>
                  </h1>
                  <p className="text-base sm:text-lg md:text-lg lg:text-xl text-white mb-6 sm:mb-8 drop-shadow-md">
                    {slide.description}
                  </p>
                  <Button
                    size="lg"
                    className="bg-primary hover:bg-accent text-white group shadow-lg"
                    onClick={onShopNow}
                  >
                    {slide.buttonText || "Shop Now"}
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={goToPrevious}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>

        <button
          onClick={goToNext}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-black/30 hover:bg-black/50 text-white transition-colors"
          aria-label="Next slide"
        >
          <ChevronRight className="h-6 w-6" />
        </button>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex space-x-2">
          {carouselSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-colors",
                currentSlide === index ||
                  (currentSlide === carouselSlides.length && index === 0)
                  ? "bg-white"
                  : "bg-white/50 hover:bg-white/70"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-black/20">
          <div
            className="h-full bg-primary transition-all duration-700 ease-in-out"
            style={{
              width: `${
                ((currentSlide >= carouselSlides.length
                  ? 1
                  : currentSlide + 1) /
                  carouselSlides.length) *
                100
              }%`,
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
