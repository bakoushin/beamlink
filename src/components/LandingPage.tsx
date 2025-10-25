import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedText } from "@/components/AnimatedText";
import { TokenInput } from "@/components/TokenInput";
import { FaucetModal } from "@/components/FaucetModal";
import {
  MessageSquare,
  QrCode,
  Zap,
  Shield,
  Users,
  ArrowRight,
  CheckCircle,
  Code,
  Send,
  Wallet,
  Coins,
  Cake,
  CreditCard,
  Briefcase,
  Heart,
  Lock,
  Key,
  Server,
  ArrowDown,
  ArrowRight as ArrowRightIcon,
  Github,
} from "lucide-react";
import type { Token } from "@/types/token";
import type { UserTokenBalance } from "@/queries";

const scrollToTry = () => {
  const element = document.querySelector('[data-section="try-beamlink"]');
  if (element) {
    element.scrollIntoView({ behavior: "smooth" });
  }
};

interface LandingPageProps {
  tokenAmount: string;
  onTokenAmountChange: (value: string) => void;
  selectedToken: Token | UserTokenBalance | null;
  onTokenSelect: (token: Token | UserTokenBalance | null) => void;
  hasInsufficientBalance: boolean;
  onButtonClick: () => void;
  getButtonText: () => string;
  isWalletConnected: boolean;
  error: string | null;
}

export function LandingPage({
  tokenAmount,
  onTokenAmountChange,
  selectedToken,
  onTokenSelect,
  hasInsufficientBalance,
  onButtonClick,
  getButtonText,
  isWalletConnected,
  error,
}: LandingPageProps) {
  const [isFaucetModalOpen, setIsFaucetModalOpen] = useState(false);

  return (
    <div className="w-full">
      {/* Hero Section */}
      <div className="text-center py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <Badge variant="outline" className="text-sm px-4 py-2">
              <img
                src="/solana-logo.png"
                alt="Solana"
                className="w-6 h-6 mr-2 rounded-full"
              />
              Built on Solana
            </Badge>
            <Badge variant="outline" className="text-sm px-4 py-2">
              <img
                src="/shipyard-netherlands-logo.png"
                alt="Shipyard Netherlands"
                className="w-6 h-6 mr-2 rounded-full"
              />
              Shipyard Netherlands
            </Badge>
          </div>

          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight flex flex-col items-center">
            <div className="leading-none -mb-6">Send crypto like you send</div>
            <div className="leading-normal">
              <AnimatedText />
            </div>
          </h1>

          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            BeamLink makes Solana token transfers as simple as sharing a link.
            Send any token via SMS, WhatsApp, Telegram, Discord, QR code, or
            gift card — without even asking for wallet addresses.
          </p>

          <div className="max-w-md mx-auto mb-12" data-section="try-beamlink">
            <div className="flex items-center justify-center gap-3 mb-6">
              <h2 className="text-2xl font-bold">Try BeamLink</h2>
              <Badge variant="secondary" className="text-xs">
                devnet
              </Badge>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onButtonClick();
              }}
              className="w-full flex flex-col gap-4"
            >
              <div className="w-full">
                <TokenInput
                  value={tokenAmount}
                  onValueChange={onTokenAmountChange}
                  selectedToken={selectedToken}
                  onTokenSelect={onTokenSelect}
                  hasInsufficientBalance={hasInsufficientBalance}
                />
              </div>

              <Button
                type="submit"
                disabled={
                  !isWalletConnected
                    ? false
                    : !(
                        selectedToken &&
                        tokenAmount &&
                        parseFloat(tokenAmount) > 0 &&
                        !hasInsufficientBalance
                      )
                }
                className="w-full"
                size="lg"
              >
                {getButtonText()}
              </Button>
            </form>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg w-full mt-4">
                Error: {error}
              </div>
            )}

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setIsFaucetModalOpen(true)}
                className="text-sm text-muted-foreground hover:text-foreground underline transition-colors"
              >
                How to get Devnet tokens?
              </button>
            </div>
          </div>

          <div className="text-center mt-16">
            <p className="text-muted-foreground text-lg">
              Scroll to learn more
            </p>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Perfect for everyday use cases
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/20 rounded-lg flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Onboard users</h3>
              <p className="text-muted-foreground">
                Encode BeamLinks in QR-codes to onboard new users to your app.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Crypto Gift Cards</h3>
              <p className="text-muted-foreground">
                Create shareable crypto gift cards for any occasion.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <Coins className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Tipping Creators</h3>
              <p className="text-muted-foreground">
                Support your favorite creators instantly with crypto tips via
                social media.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <Cake className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Birthday Money</h3>
              <p className="text-muted-foreground">
                Send birthday money or split the bills with friends and
                colleagues.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <Briefcase className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Paying Freelancers</h3>
              <p className="text-muted-foreground">
                Pay remote workers and freelancers without requesting their
                payment details.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg flex items-center justify-center mb-4">
                <Heart className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">
                Get Grandma into Solana
              </h3>
              <p className="text-muted-foreground">
                Introduce to crypto the family members who don't have crypto
                wallets yet.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            How BeamLink works
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">
                  1
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Create & Send</h3>
              <p className="text-muted-foreground">
                Create the BeamLink and send via SMS, WhatsApp, Telegram, QR
                code, or gift card.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">
                  2
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Recipient Claims</h3>
              <p className="text-muted-foreground">
                Recipients click the link and claim their tokens using any
                Solana wallet when they're ready.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">
                  3
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Done!</h3>
              <p className="text-muted-foreground">
                Tokens are securely transferred to the recipient's wallet.
                Crypto made simple!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Channels */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Works everywhere people already are
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-lg border bg-card text-center">
              <MessageSquare className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">SMS</h3>
              <p className="text-sm text-muted-foreground">
                Works on any phone
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card text-center">
              <MessageSquare className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">WhatsApp</h3>
              <p className="text-sm text-muted-foreground">
                2B+ users worldwide
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card text-center">
              <MessageSquare className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Telegram</h3>
              <p className="text-sm text-muted-foreground">800M+ users</p>
            </div>

            <div className="p-6 rounded-lg border bg-card text-center">
              <QrCode className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              <h3 className="font-semibold mb-2">QR Code</h3>
              <p className="text-sm text-muted-foreground">
                For in-person sharing
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Technical Details */}
      <div className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Technical Details
          </h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            How BeamLink works under the hood with smart contracts and relayers
          </p>

          {/* Architecture Diagram */}
          <div className="bg-card border rounded-xl p-8 mb-12">
            <div className="max-w-5xl mx-auto">
              <h3 className="text-xl font-semibold mb-8 text-center">
                BeamLink Architecture
              </h3>

              {/* Flow Diagram */}
              <div className="flex flex-col md:flex-row items-center md:items-start justify-center gap-4 md:gap-8">
                {/* Step 1: Deposit */}
                <div className="text-center flex-shrink-0">
                  <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-10 h-10 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">1. Deposit</h4>
                  <p className="text-base text-muted-foreground">
                    User deposits tokens into escrow
                  </p>
                </div>

                {/* Arrow - vertical on mobile, horizontal on desktop */}
                <div className="flex items-center justify-center h-8 w-full md:w-20 md:h-20 md:items-center">
                  <ArrowDown className="w-8 h-8 text-muted-foreground flex-shrink-0 md:hidden" />
                  <ArrowRightIcon className="w-8 h-8 text-muted-foreground flex-shrink-0 hidden md:block" />
                </div>

                {/* Step 2: Link Generation */}
                <div className="text-center flex-shrink-0">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Key className="w-10 h-10 text-green-600" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">
                    2. Link = Private Key
                  </h4>
                  <p className="text-base text-muted-foreground">
                    BeamLink is a private key
                  </p>
                </div>

                {/* Arrow - vertical on mobile, horizontal on desktop */}
                <div className="flex items-center justify-center h-8 w-full md:w-20 md:h-20 md:items-center">
                  <ArrowDown className="w-8 h-8 text-muted-foreground flex-shrink-0 md:hidden" />
                  <ArrowRightIcon className="w-8 h-8 text-muted-foreground flex-shrink-0 hidden md:block" />
                </div>

                {/* Step 3: Relayer */}
                <div className="text-center flex-shrink-0">
                  <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Server className="w-10 h-10 text-purple-600" />
                  </div>
                  <h4 className="text-lg font-semibold mb-2">
                    3. Relayer Withdrawal
                  </h4>
                  <p className="text-base text-muted-foreground">
                    Gasless withdrawal execution
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Escrow Smart Contract
              </h3>
              <p className="text-muted-foreground text-sm">
                Every deposit is held securely in an escrow smart contract,
                associated with a unique link.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center mb-4">
                <Key className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Private Key Links</h3>
              <p className="text-muted-foreground text-sm">
                Each BeamLink is actually a private key used to sign
                transactions and unlock deposits.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center mb-4">
                <Server className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                Gasless Withdrawals
              </h3>
              <p className="text-muted-foreground text-sm">
                Relayer executes withdrawals without requiring recipients to
                have gas money.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center mb-4">
                <Coins className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">SOL for Gas</h3>
              <p className="text-muted-foreground text-sm">
                SOL locked for account rent is routed to withdrawers for
                immediate gas money.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-yellow-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Instant Access</h3>
              <p className="text-muted-foreground text-sm">
                Recipients can start transacting immediately with the provided
                gas money.
              </p>
            </div>

            <div className="bg-card border rounded-lg p-6">
              <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center mb-4">
                <Shield className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Secure & Trustless</h3>
              <p className="text-muted-foreground text-sm">
                Withdrawals are possible even when relayer is down by
                interacting with the contract directly.
              </p>
            </div>
          </div>

          {/* GitHub Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-12">
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
              onClick={() =>
                window.open(
                  "https://github.com/bakoushin/beamlink-program",
                  "_blank"
                )
              }
            >
              <Github className="w-5 h-5" />
              Smart Contract
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="flex items-center gap-2"
              onClick={() =>
                window.open("https://github.com/bakoushin/beamlink", "_blank")
              }
            >
              <Github className="w-5 h-5" />
              Frontend code
            </Button>
          </div>
        </div>
      </div>

      {/* Developer Section */}
      <div className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Built for developers</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Integrate BeamLinks into your dApp or a wallet with our
            comprehensive SDK. Spend days, not months.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="p-6 rounded-lg border bg-card">
              <Code className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">SDK</h3>
              <p className="text-muted-foreground">
                SDK allowing create and consume BeamLinks.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Zap className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">
                Lightning fast, cheap, and reliable blockchain infrastructure.
              </p>
            </div>

            <div className="p-6 rounded-lg border bg-card">
              <Shield className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Secure</h3>
              <p className="text-muted-foreground">
                Use battle-tested smart contracts. No need to reinvent the
                wheel.
              </p>
            </div>
          </div>

          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6"
            onClick={() => window.open("https://forms.google.com", "_blank")}
          >
            <Code className="w-5 h-5 mr-2" />
            Contact Us
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>

      {/* Benefits */}
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Why choose BeamLink?
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">
                    Multi-channel distribution
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Send via SMS, WhatsApp, Telegram, QR codes, or gift cards.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Instant claiming</h3>
                  <p className="text-muted-foreground text-sm">
                    Recipients can claim tokens immediately using any Solana
                    wallet.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">
                    No wallet addresses needed
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Send tokens without asking recipients for their wallet
                    addresses.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">User-friendly</h3>
                  <p className="text-muted-foreground text-sm">
                    Users receive a small amount of SOL to start using their
                    funds right away.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Built on Solana</h3>
                  <p className="text-muted-foreground text-sm">
                    Fast, cheap, and reliable blockchain infrastructure.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <CheckCircle className="w-6 h-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">Multi-token support</h3>
                  <p className="text-muted-foreground text-sm">
                    Send SOL, USDC, or any Solana SPL token.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 px-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to send crypto like a text message?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Join the people revolution. No technical knowledge required.
          </p>

          <div className="flex justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="text-lg px-8 py-6"
              onClick={scrollToTry}
            >
              <Send className="w-5 h-5 mr-2" />
              Create Your First BeamLink
            </Button>
          </div>
        </div>
      </div>

      <FaucetModal
        open={isFaucetModalOpen}
        onOpenChange={setIsFaucetModalOpen}
      />
    </div>
  );
}
