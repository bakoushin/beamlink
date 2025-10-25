export function AnimatedSun() {
  return (
    <div className="relative w-16 h-16">
      <style>{`
        @keyframes sunBreathe {
          0%,
          100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.2);
          }
        }
        @keyframes sunRotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .sun-container {
          animation: sunBreathe 2s ease-in-out infinite;
        }
        .sun-rays {
          animation: sunRotate 3s linear infinite;
          transform-origin: 26px 26px;
        }
      `}</style>
      <div className="sun-container">
        <svg
          width="58"
          height="56"
          viewBox="-5 -5 68 66"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          {/* Animated rays - these will rotate */}
          <g className="sun-rays">
            <path
              d="M25 1C25 0.447715 25.4477 0 26 0C26.5523 0 27 0.447715 27 1V10C27 10.5523 26.5523 11 26 11C25.4477 11 25 10.5523 25 10V1Z"
              fill="url(#paint1_linear_22_4)"
            />
            <path
              d="M37.9431 3.86929C38.2161 3.38919 38.8266 3.22131 39.3067 3.49431C39.7868 3.76731 39.9547 4.37781 39.6817 4.8579L35.2329 12.6815C34.9599 13.1616 34.3494 13.3295 33.8693 13.0565C33.3892 12.7835 33.2213 12.173 33.4943 11.6929L37.9431 3.86929Z"
              fill="url(#paint2_linear_22_4)"
            />
            <path
              d="M53.9568 32.2613C54.4903 32.4042 54.8069 32.9525 54.6639 33.486C54.521 34.0195 53.9726 34.3361 53.4392 34.1931L45.043 31.9434C44.5095 31.8004 44.193 31.2521 44.3359 30.7186C44.4788 30.1852 45.0272 29.8686 45.5606 30.0115L53.9568 32.2613Z"
              fill="url(#paint3_linear_22_4)"
            />
            <path
              d="M12.3682 16.9141C12.8443 17.1941 13.0032 17.807 12.7232 18.2831C12.4432 18.7591 11.8303 18.918 11.3542 18.638L3.86194 14.2309C3.3859 13.9509 3.227 13.338 3.50701 12.8619C3.78703 12.3859 4.39993 12.227 4.87596 12.507L12.3682 16.9141Z"
              fill="url(#paint4_linear_22_4)"
            />
            <path
              d="M18.7017 11.1914C18.9778 11.6697 18.814 12.2813 18.3357 12.5574C17.8574 12.8335 17.2458 12.6697 16.9696 12.1914L14.5043 7.92134C14.2282 7.44304 14.3921 6.83145 14.8704 6.55531C15.3486 6.27917 15.9602 6.44304 16.2364 6.92134L18.7017 11.1914Z"
              fill="url(#paint5_linear_22_4)"
            />
            <path
              d="M35.1093 51.175C35.2918 51.6963 35.0172 52.2668 34.4959 52.4493C33.9746 52.6318 33.4041 52.3572 33.2216 51.836L30.9438 45.3305C30.7613 44.8092 31.0359 44.2387 31.5572 44.0562C32.0784 43.8737 32.6489 44.1483 32.8315 44.6695L35.1093 51.175Z"
              fill="url(#paint6_linear_22_4)"
            />
            <path
              d="M47.2416 45.9438C47.6266 46.3398 47.6178 46.9729 47.2218 47.3579C46.8259 47.7429 46.1928 47.7341 45.8078 47.3382L40.0884 41.457C39.7034 41.0611 39.7122 40.4279 40.1082 40.0429C40.5041 39.6579 41.1372 39.6667 41.5222 40.0626L47.2416 45.9438Z"
              fill="url(#paint7_linear_22_4)"
            />
            <path
              d="M10 25C10.5523 25 11 25.4477 11 26C11 26.5523 10.5523 27 10 27H1C0.447715 27 -2.41411e-08 26.5523 0 26C2.41411e-08 25.4477 0.447715 25 1 25H10Z"
              fill="url(#paint8_linear_22_4)"
            />
            <path
              d="M11.6577 33.2335C12.136 32.9574 12.7476 33.1213 13.0237 33.5996C13.2998 34.0778 13.136 34.6894 12.6577 34.9656L7.86602 37.732C7.38773 38.0082 6.77614 37.8443 6.5 37.366C6.22385 36.8877 6.38773 36.2761 6.86602 36L11.6577 33.2335Z"
              fill="url(#paint9_linear_22_4)"
            />
            <path
              d="M16.5824 39.4235C16.8706 38.9524 17.4861 38.804 17.9573 39.0921C18.4284 39.3803 18.5768 39.9958 18.2887 40.467L12.0901 50.6027C11.8019 51.0739 11.1864 51.2222 10.7152 50.9341C10.2441 50.6459 10.0957 50.0304 10.3838 49.5592L16.5824 39.4235Z"
              fill="url(#paint10_linear_22_4)"
            />
            <path
              d="M25 42C25 41.4477 25.4477 41 26 41C26.5523 41 27 41.4477 27 42V55C27 55.5523 26.5523 56 26 56C25.4477 56 25 55.5523 25 55V42Z"
              fill="url(#paint11_linear_22_4)"
            />
            <path
              d="M33.548 40.9325C33.2454 40.4706 33.3745 39.8507 33.8365 39.548C34.2984 39.2454 34.9183 39.3745 35.2209 39.8365L44 53.1102C44.3027 53.5722 44.1735 54.1921 43.7116 54.4947C43.2496 54.7974 42.6298 54.6683 42.3271 54.2063L33.548 40.9325Z"
              fill="url(#paint12_linear_22_4)"
            />
            <path
              d="M50.0567 10.988C50.5378 10.7167 51.1477 10.8868 51.4189 11.3679C51.6902 11.849 51.5201 12.4589 51.0391 12.7301L40.9421 18.4236C40.461 18.6949 39.8511 18.5248 39.5798 18.0438C39.3086 17.5627 39.4787 16.9528 39.9597 16.6815L50.0567 10.988Z"
              fill="url(#paint13_linear_22_4)"
            />
            <path
              d="M57 25C57.5523 25 58 25.4477 58 26C58 26.5523 57.5523 27 57 27H42C41.4477 27 41 26.5523 41 26C41 25.4477 41.4477 25 42 25H57Z"
              fill="url(#paint14_linear_22_4)"
            />
            <path
              d="M54.8797 40.7798C55.3697 41.0346 55.5603 41.6384 55.3054 42.1284C55.0506 42.6184 54.4468 42.8089 53.9568 42.5541L39.6817 34.9656C39.1917 34.7107 39.0011 34.1069 39.256 33.617C39.5108 33.127 40.1146 32.9364 40.6046 33.1913L54.8797 40.7798Z"
              fill="url(#paint15_linear_22_4)"
            />
          </g>

          {/* Static center sun - this stays in place */}
          <circle cx="26" cy="26" r="13" fill="url(#paint0_linear_22_4)" />

          <defs>
            <linearGradient
              id="paint0_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint1_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint2_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint3_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint4_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint5_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint6_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint7_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint8_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint9_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint10_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint11_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint12_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint13_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint14_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
            <linearGradient
              id="paint15_linear_22_4"
              x1="55"
              y1="58.5"
              x2="9.5"
              y2="4.5"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#00FFA3" />
              <stop offset="0.514423" stopColor="#FFE500" stopOpacity="0.9" />
              <stop offset="0.990385" stopColor="#DC1FFF" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}
