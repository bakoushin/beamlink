import { useEffect, useState } from "react";

const words = [
  "SMS",
  "Telegram",
  "Discord",
  "WhatsApp",
  "iMessage",
  "gift card",
];

export function AnimatedText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    const scheduleNext = () => {
      // Add extra delay when looping back from last to first
      const isLastItem = currentIndex === words.length - 1;
      const delay = isLastItem ? 4000 : 2500;

      setTimeout(() => {
        setIsTransitioning(true);
        setTimeout(() => {
          setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
          setIsTransitioning(false);
        }, 500); // Match the CSS transition duration
      }, delay);
    };

    scheduleNext();
  }, [currentIndex]);

  const nextIndex = (currentIndex + 1) % words.length;

  return (
    <div className="relative inline-block py-2 overflow-visible">
      <div className="relative flex justify-center items-center overflow-visible">
        {/* Current word */}
        <span
          key={`current-${currentIndex}`}
          className={`inline-block transition-all ease-in-out text-muted-foreground ${
            isTransitioning
              ? "opacity-0 -translate-y-8 duration-300"
              : "opacity-100 translate-y-0 duration-500"
          }`}
        >
          {words[currentIndex]}
        </span>

        {/* Next word */}
        <span
          key={`next-${nextIndex}`}
          className={`inline-block transition-all duration-500 ease-in-out absolute text-muted-foreground ${
            isTransitioning
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-full"
          }`}
        >
          {words[nextIndex]}
        </span>
      </div>
    </div>
  );
}
