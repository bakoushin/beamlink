import { WalletMultiButton } from "./wallet/WalletMultiButton";
import logo from "../assets/logo.svg";

export function Header({ onLogoClick }: { onLogoClick: () => void }) {
  return (
    <div className="w-full">
      <header className="flex justify-center">
        <div className="flex items-center justify-between w-full max-w-screen-lg px-4 py-2">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              onLogoClick();
            }}
            className="flex items-center gap-3 cursor-pointer"
          >
            <img
              src={logo}
              alt="BeamLink logo"
              className="h-12 w-12 relative"
              style={{ top: "0.1em" }}
            />
            <h1
              className="text-2xl font-bold"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
              }}
            >
              BeamLink
            </h1>
          </a>
          <div>
            <WalletMultiButton />
          </div>
        </div>
      </header>
      <div className="h-px bg-gradient-to-r from-[#00FFA3] via-[#FFE500] to-[#DC1FFF]" />
    </div>
  );
}
