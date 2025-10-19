import { useEffect, useState } from "react";

const words = ["SMS", "Telegram", "WhatsApp", "iMessage", "gift card"];

export function AnimatedText() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsAnimating(false);
      }, 300); // Half of the transition duration
    }, 2000); // Change word every 2 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative inline-block min-h-[1.2em]">
      <span
        className={`inline-block transition-all duration-500 ${
          isAnimating
            ? "opacity-0 blur-sm translate-y-2"
            : "opacity-100 blur-0 translate-y-0"
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
    </div>
  );
}
