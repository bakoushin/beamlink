import { useEffect, useState } from "react";

const words = ["SMS", "Telegram", "WhatsApp", "iMessage", "gift card"];

export function AnimatedText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsTransitioning(false);
      }, 500); // Match the CSS transition duration
    }, 2500); // Change word every 2.5 seconds

    return () => clearInterval(interval);
  }, []);

  const nextIndex = (currentIndex + 1) % words.length;

  return (
    <div className="relative inline-block py-2 overflow-visible">
      <div className="relative flex justify-center items-center overflow-visible">
        {/* Current word */}
        <span
          key={`current-${currentIndex}`}
          className={`inline-block transition-all ease-in-out ${
            isTransitioning
              ? "opacity-0 -translate-y-8 duration-300"
              : "opacity-100 translate-y-0 duration-500"
          }`}
          style={{
            background: "linear-gradient(135deg, #00FFA3, #FFE500, #DC1FFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {words[currentIndex]}
        </span>

        {/* Next word */}
        <span
          key={`next-${nextIndex}`}
          className={`inline-block transition-all duration-500 ease-in-out absolute ${
            isTransitioning
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-full"
          }`}
          style={{
            background: "linear-gradient(135deg, #00FFA3, #FFE500, #DC1FFF)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {words[nextIndex]}
        </span>
      </div>
    </div>
  );
}
