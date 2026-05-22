# 📖 MiMoStory

### Wallet Life Story Generator — Powered by Xiaomi MiMo V2.5

Turn any Ethereum address or ENS name into a cinematic five-chapter narrative, generated from live onchain history and rendered as both readable web prose and a shareable 1080×1920 poster.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-▶_Read_a_Story-22c55e?style=for-the-badge&logo=ethereum&logoColor=white)](https://huolinger010.github.io/mimostory/)
[![Powered by MiMo](https://img.shields.io/badge/AI-Xiaomi%20MiMo%20V2.5-ff7a18?style=for-the-badge&logo=xiaomi&logoColor=white)](https://huolinger010.github.io/mimostory/)
[![Live Data](https://img.shields.io/badge/Data-Blockscout%20%2B%20Snapshot-3b82f6?style=for-the-badge&logo=ethereum&logoColor=white)](https://eth.blockscout.com/)
[![License](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)](LICENSE)

[![Stars](https://img.shields.io/github/stars/huolinger010/mimostory?style=flat&logo=github&color=fbbf24)](https://github.com/huolinger010/mimostory/stargazers)
[![Last Commit](https://img.shields.io/github/last-commit/huolinger010/mimostory?style=flat&color=22c55e)](https://github.com/huolinger010/mimostory/commits/main)
[![Single File](https://img.shields.io/badge/Deploy-Single%20HTML-ff7a18?style=flat)](#-quick-start)
[![No API Key](https://img.shields.io/badge/API%20Key-None-22c55e?style=flat)](#-data-sources)

---

## 📖 The Idea

Most onchain explorers show you raw data. Block numbers. Transaction hashes. Hex addresses. Useful, but cold.

But every wallet has a story.

**When was it born?** What was the first thing it did? Did it survive the great winter of 2022, when half the chain went silent? Has it earned an identity through governance votes, NFT collections, ENS names — or has it stayed quietly anonymous? What is it doing today?

MiMoStory is a narrative engine that reads any wallet's onchain history and turns it into a five-chapter story you can actually feel — and share.

Every chapter is generated live from real data. Every detail is verifiable on the chain.

---

## ✨ The Five Chapters

Every story follows the same arc, drawn from different facts:

### 📜 **Chapter I — Genesis**
*The day the wallet was born.* Era-aware opening prose (Ancient → Pioneer → DeFi Summer → Bull → Winter → Revival → Modern → Recent), block number, founding transaction, and value transferred.

### 🚀 **Chapter II — First Steps**
*Discovering the network.* Total transactions, tokens accumulated, contracts authored, gas spent — the wallet's footprint quantified.

### ❄️ **Chapter III — The Long Winter**
*Survival check.* Did the wallet keep transacting through the crypto winter of mid-2022 to early 2023? Wallets that did earn a special line: *"The OGs are not those who arrived first; they are those who stayed when arriving was no longer rewarded."*

### 🎭 **Chapter IV — Identity**
*Who they became.* DAO votes cast (Snapshot), governance spaces participated in, NFTs collected, ENS name held. The persona is auto-classified across eight dimensions.

### 🌅 **Chapter V — Today**
*The story so far.* Current ETH balance, total tokens held, classification (OG / Veteran / Rising), and an open invitation to the next chapter.

Every chapter ends with a metadata strip pulling the exact onchain numbers used.

---

## 🎨 Persona Classifier

The narrative engine auto-tags wallets across these dimensions:

| Persona | Trigger |
|---|---|
| 🏛 **Governance Voter** | 10+ DAO votes |
| 🗳 **DAO Member** | 1+ DAO votes |
| 🖼 **NFT Collector** | 50+ NFTs |
| 🎭 **NFT Holder** | 5+ NFTs |
| 👴 **OG (4+ years)** | 4+ years onchain |
| 🎖 **Veteran** | 2-4 years onchain |
| 🌊 **DeFi Native** | 20+ different tokens |
| ⚡ **Power User** | 1000+ transactions |
| 🪪 **ENS Owner** | Has ENS name |
| 🐋 **Whale** | 10+ ETH held |
| 💎 **Holder** | 1-10 ETH held |

Tags compose freely. A whale who collects NFTs and votes in DAOs gets all three labels.

---

## 🖼️ Shareable Poster

Click **🎨 Generate Poster** after any story and download a 1080×1920 vertical image:

- Story headline (ENS name or short address)
- Persona tags
- Hero stat: years on chain (massive serif typography)
- 4-stat grid (transactions, gas used, DAO votes, NFTs)
- Era-aware quote: *"Through every cycle, still here"* / *"Earned, not given"* / *"The next chapter begins"*
- MiMoStory + MiMo V2.5 branding

Ready to share on X, IG, or anywhere. One-click X share button included.

---

## 🛠 Tech Stack

| Layer | Choice | Why |
|---|---|---|
| **Frontend** | Vanilla HTML + CSS + JS | Zero build step, single file deploy |
| **AI Engine** | Xiaomi MiMo V2.5 | Era classification + narrative composition |
| **Onchain Data** | [Blockscout Ethereum API](https://eth.blockscout.com/) | No key, no rate limit pain |
| **ENS Resolution** | [ensideas.com API](https://api.ensideas.com/) | Bidirectional ENS↔address |
| **DAO Activity** | [Snapshot.org GraphQL](https://hub.snapshot.org/graphql) | Cross-DAO vote history |
| **Avatars** | ENS avatar metadata | Native ENS profile images |
| **Poster Renderer** | HTML5 Canvas API | 1080×1920 PNG export, no server |
| **Hosting** | GitHub Pages | Free CDN, auto SSL |

**Total stack: 1 HTML file, 1 JS file, zero dependencies, zero API keys.**

---

## 🏗 Architecture

```
                    ┌─────────────────────────┐
                    │   USER INPUT            │
                    │   "vitalik.eth" / 0x... │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   ENS RESOLVER          │
                    │   ensideas.com          │
                    └────────────┬────────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
   ┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
   │  BLOCKSCOUT     │  │  SNAPSHOT       │  │  ENS METADATA   │
   │  • address info │  │  GraphQL        │  │  • avatar       │
   │  • counters     │  │  • DAO votes    │  │  • display name │
   │  • activity     │  │  • spaces       │  │                 │
   │  • tokens/NFTs  │  │                 │  │                 │
   └────────┬────────┘  └────────┬────────┘  └────────┬────────┘
            └────────────────────┼────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  PERSONA CLASSIFIER     │
                    │  → 11 tag dimensions    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  MIMO V2.5 NARRATIVE    │
                    │  • Era classification   │
                    │  • Chapter composition  │
                    │  • Bilingual EN/ID      │
                    └────────────┬────────────┘
                                 │
                ┌────────────────┴───────────────┐
                │                                │
       ┌────────▼────────┐              ┌────────▼────────┐
       │   WEB STORY     │              │   POSTER PNG    │
       │   5 chapters    │              │   1080×1920     │
       │   stats grid    │              │   shareable     │
       └─────────────────┘              └─────────────────┘
```

---

## 🚀 Quick Start

### Option 1 — Live Demo (zero setup)

Visit **[huolinger010.github.io/mimostory](https://huolinger010.github.io/mimostory/)** and paste any address.

### Option 2 — Permalink

Add the address as a hash to auto-load:

```
https://huolinger010.github.io/mimostory/#vitalik.eth
https://huolinger010.github.io/mimostory/#0xd8da6bf26964af9d7eed9e03e53415d37aa96045
```

### Option 3 — Self-host

```bash
git clone https://github.com/huolinger010/mimostory.git
cd mimostory
python3 -m http.server 8080
# open http://localhost:8080
```

That's it. No build step. No `.env`. No API keys.

---

## 🌍 Supported Networks

- **Ethereum mainnet** — primary onchain history (Blockscout)
- **Snapshot DAOs** — governance votes across all major DAOs (ENS, Uniswap, Aave, Lido, Arbitrum, Optimism, Gitcoin, Curve, Balancer, dYdX, etc.)

L2 expansion (Base, Arbitrum) on the roadmap.

---

## 🌐 Bilingual

Toggle between **English** and **Bahasa Indonesia** with the 🌐 button. Every chapter, every label, every quote is fully translated. Default is English (for international reviewers).

---

## 🗺 Roadmap

- [ ] **Multi-chain story** — extend to Base, Arbitrum, Optimism for unified L1+L2 narrative
- [ ] **First-NFT detector** — identify the first NFT mint as a key chapter beat
- [ ] **Bear-market scoreboard** — count exact tx in each market regime
- [ ] **Whale wake detection** — flag dormancy reactivation (90+ days quiet, then active)
- [ ] **Permalink stories** — share `mimostory.xyz/vitalik` URLs that load instantly
- [ ] **Audio narration** — TTS-generated podcast-style chapter readings
- [ ] **Animated poster** — short MP4 export with chapter beat animations

---

## 🤝 Contributing

This is a single-file app — easy to read, easy to extend.

- New chapter ideas → open an issue with the data signal that drives it
- New language → add a key to `I18N` in `app.js`
- New persona tag → extend `classifyPersona()`
- Better era classifier → improve `eraOf()` with finer cycles

---

## 📜 License

MIT © 2026 [@huolinger010](https://github.com/huolinger010)

---

## 🙏 Acknowledgements

- **[Xiaomi MiMo V2.5](https://github.com/XiaomiMiMo)** — narrative reasoning engine
- **[Blockscout](https://eth.blockscout.com)** — open Ethereum data
- **[Snapshot](https://snapshot.org)** — DAO governance index
- **[ENS Ideas](https://ensideas.com)** — ENS resolution API
- The Ethereum chain itself, which has been faithfully recording every story since 2015

---

*Built for the Xiaomi MiMo 100T program — showcasing what an open AI engine plus open onchain data can do, in a single zero-dependency HTML file.*
