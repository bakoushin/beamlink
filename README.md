# BeamLink — Send crypto like you send a text message

BeamLink makes Solana token transfers as simple as sharing a link. Send SOL, USDC, or any SPL token via SMS, WhatsApp, Telegram, QR code, or gift card — no wallet address required.

App: [https://beamlink.app](https://beamlink.app)

### Source code

- Frontend (this app): [https://github.com/bakoushin/beamlink](https://github.com/bakoushin/beamlink)
- Smart Contract: [https://github.com/bakoushin/beamlink-program](https://github.com/bakoushin/beamlink-program)

### How it works

1. **Create & send**: Deposit tokens and get a BeamLink to share (text, chat, QR, gift card).
2. **Recipient claims**: They open the link and claim with any Solana wallet (devnet).
3. **Done**: Tokens are securely transferred to the recipient’s wallet.

### Technical details

- **Escrow smart contract**: Each deposit is held in escrow and bound to a unique link.
- **Link = private key**: A BeamLink acts as a private key used to authorize withdrawal.
- **Gasless withdrawals**: A relayer can execute the claim for recipients.
- **Gas grant**: SOL locked for account rent is routed to claimants for immediate fees.

## Getting started

### Prerequisites

- Node.js 18+ and npm

### Install

```bash
npm install
```

### Development

```bash
npm run dev
```

This starts the Vite dev server. The app is configured to use Solana devnet by default and supports Phantom, Solflare, and a burner wallet.

### Build

```bash
npm run build
```

This runs TypeScript build and Vite production build.

### Preview (serve the production build locally)

```bash
npm run preview
```

### Optional: Environment variables

The app will use a public devnet RPC by default. To use Alchemy devnet RPC, create a `.env` file in the project root:

```bash
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
```

---

## Solana localnet (optional)

This repository includes helper scripts for a local validator and seeded SPL token mints. The UI currently targets devnet in code; if you want to point the UI to localnet, update the endpoint in `src/App.tsx` accordingly.

Available scripts:

- Setup mints: `npm run localnet:setup`
- Start validator: `npm run localnet:start`
- Stop validator: `npm run localnet:stop`
- Status: `npm run localnet:status`
- Airdrop tokens: `npm run localnet:airdrop`
- Full reset: `npm run localnet:reset`

Assets for localnet (mints and accounts) live under `localnet-tokens/` and `test-ledger/`.
