/* MiMoStory — wallet life-story generator
 * Free APIs only. Zero backend. Single HTML deploy.
 */

// ─────────────────────────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────────────────────────
const ENS_API = 'https://api.ensideas.com/ens/resolve';
const BLOCKSCOUT = 'https://eth.blockscout.com/api/v2';
const SNAPSHOT = 'https://hub.snapshot.org/graphql';
const ETH_RPC = 'https://cloudflare-eth.com';

const I18N = {
  en: {
    'hero-title': 'Every Wallet Has a Story',
    'hero-sub': 'Turn any Ethereum address or ENS into a cinematic life story across five chapters — powered by Xiaomi MiMo V2.5 reading live onchain history.',
    'badge-live': 'Live Onchain',
    'badge-free': '100% Free',
    'badge-ai': 'Powered by MiMo V2.5',
    'badge-share': 'Shareable Poster',
    'btn-go': 'Read My Story',
    'try-label': 'Try:',
    'loading': 'Reading the chains',
    'poster-title': 'Your Story Poster',
    'download': 'Download PNG',
    'share-x': 'Share on X',
    'ch1': 'Chapter I — Genesis',
    'ch2': 'Chapter II — First Steps',
    'ch3': 'Chapter III — Survival',
    'ch4': 'Chapter IV — Identity',
    'ch5': 'Chapter V — Today',
    'btn-poster': 'Generate Poster',
    'btn-share': 'Share Story',
    'btn-restart': 'New Story',
  },
  id: {
    'hero-title': 'Setiap Wallet Punya Cerita',
    'hero-sub': 'Ubah alamat Ethereum atau ENS apa pun menjadi kisah hidup sinematik dalam lima bab — ditenagai Xiaomi MiMo V2.5 yang membaca jejak onchain live.',
    'badge-live': 'Live Onchain',
    'badge-free': '100% Gratis',
    'badge-ai': 'Powered by MiMo V2.5',
    'badge-share': 'Poster Siap Bagi',
    'btn-go': 'Baca Ceritaku',
    'try-label': 'Coba:',
    'loading': 'Membaca rantai',
    'poster-title': 'Poster Ceritamu',
    'download': 'Unduh PNG',
    'share-x': 'Bagikan di X',
    'ch1': 'Bab I — Awal Mula',
    'ch2': 'Bab II — Langkah Pertama',
    'ch3': 'Bab III — Bertahan',
    'ch4': 'Bab IV — Identitas',
    'ch5': 'Bab V — Hari Ini',
    'btn-poster': 'Buat Poster',
    'btn-share': 'Bagikan',
    'btn-restart': 'Cerita Baru',
  }
};

let lang = localStorage.getItem('mimostory-lang') || 'en';
let currentStory = null;

// ─────────────────────────────────────────────────────────────
// THEME + LANG
// ─────────────────────────────────────────────────────────────
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('mimostory-theme', t);
  document.getElementById('theme-toggle').textContent = t === 'dark' ? '🌙' : '☀️';
}
setTheme(localStorage.getItem('mimostory-theme') || 'dark');
document.getElementById('theme-toggle').onclick = () =>
  setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const k = el.dataset.i18n;
    if (I18N[lang][k]) el.textContent = I18N[lang][k];
  });
  document.getElementById('lang-toggle').textContent = lang === 'en' ? '🇮🇩' : '🇬🇧';
}
applyI18n();
document.getElementById('lang-toggle').onclick = () => {
  lang = lang === 'en' ? 'id' : 'en';
  localStorage.setItem('mimostory-lang', lang);
  applyI18n();
  if (currentStory) renderStory(currentStory);
};

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const t = (k) => I18N[lang][k] || k;
const fmtAddr = (a) => a ? `${a.slice(0,6)}…${a.slice(-4)}` : '';
const fmtNum = (n) => {
  if (n == null || isNaN(n)) return '0';
  if (n >= 1e9) return (n/1e9).toFixed(1).replace(/\.0$/,'') + 'B';
  if (n >= 1e6) return (n/1e6).toFixed(1).replace(/\.0$/,'') + 'M';
  if (n >= 1e3) return (n/1e3).toFixed(1).replace(/\.0$/,'') + 'K';
  return n.toFixed(n < 10 ? 2 : 0);
};
const fmtEth = (wei) => {
  const n = Number(wei) / 1e18;
  if (n < 0.001) return n.toFixed(6);
  if (n < 1) return n.toFixed(4);
  return n.toFixed(3);
};
const fmtDate = (ts, opts={}) => {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US',
    {year:'numeric', month:'short', day:'numeric', ...opts});
};
const fmtMonth = (ts) => {
  const d = new Date(ts * 1000);
  return d.toLocaleDateString(lang === 'id' ? 'id-ID' : 'en-US',
    {year:'numeric', month:'long'});
};
const yearsBetween = (from, to) => {
  const ms = (to - from) * 1000;
  return ms / (365.25 * 86400 * 1000);
};
const setLoadStep = (s) => { document.getElementById('load-step').textContent = ' ' + s; };
const showError = (msg) => {
  const el = document.getElementById('error');
  el.textContent = '⚠ ' + msg;
  el.classList.add('on');
  document.getElementById('loading').classList.remove('on');
  setTimeout(() => el.classList.remove('on'), 6000);
};

// ─────────────────────────────────────────────────────────────
// DATA FETCH
// ─────────────────────────────────────────────────────────────
async function resolveENS(input) {
  // input can be ENS or 0x address
  const r = await fetch(`${ENS_API}/${encodeURIComponent(input)}`);
  if (!r.ok) throw new Error('ENS resolution failed');
  const j = await r.json();
  return {
    address: (j.address || (input.startsWith('0x') ? input : '')).toLowerCase(),
    name: j.name || (input.endsWith('.eth') ? input : null),
    avatar: j.avatar || null,
  };
}

async function blockscout(path) {
  const r = await fetch(`${BLOCKSCOUT}${path}`);
  if (!r.ok) throw new Error(`Blockscout ${r.status}`);
  return r.json();
}

async function fetchAddressInfo(addr) {
  // Returns balance, last activity, contract count etc.
  return blockscout(`/addresses/${addr}`);
}

async function fetchCounters(addr) {
  return blockscout(`/addresses/${addr}/counters`);
}

async function fetchActivityYears(addr) {
  // Sample first + last tx to derive activity span.
  // Blockscout default returns newest-first. We walk back via next_page_params
  // up to N pages (each ~50 items) to approximate the first tx.
  // For very active wallets (Vitalik) we cap walk-depth to keep load fast.
  const newest = await blockscout(`/addresses/${addr}/transactions`);
  const items = newest.items || [];
  if (!items.length) return null;
  const last = items[0];
  let oldest = items[items.length - 1];
  let nextParams = newest.next_page_params;
  let pages = 0;
  const MAX_PAGES = 6;
  while (nextParams && pages < MAX_PAGES) {
    const qs = new URLSearchParams(nextParams).toString();
    try {
      const next = await blockscout(`/addresses/${addr}/transactions?${qs}`);
      const ni = next.items || [];
      if (ni.length) oldest = ni[ni.length - 1];
      nextParams = next.next_page_params;
      if (!ni.length) break;
    } catch { break; }
    pages++;
  }
  return { first: oldest, last, pagesWalked: pages };
}

async function fetchTokens(addr) {
  try {
    const r = await blockscout(`/addresses/${addr}/tokens?type=ERC-20`);
    return (r.items || []).map(it => ({
      name: it.token?.name,
      symbol: it.token?.symbol,
      address: it.token?.address,
      decimals: parseInt(it.token?.decimals || 18),
      balance: it.value,
      icon: it.token?.icon_url,
    })).filter(t => t.symbol);
  } catch { return []; }
}

async function fetchNFTCount(addr) {
  try {
    const r = await blockscout(`/addresses/${addr}/nft/collections?type=ERC-721,ERC-1155`);
    return (r.items || []).reduce((s, c) => s + parseInt(c.amount || 0), 0);
  } catch { return 0; }
}

async function fetchSnapshotVotes(addr) {
  const q = `query Votes($v:String!){votes(first:100,where:{voter:$v},orderBy:"created",orderDirection:desc){created proposal{id title space{id name}}}}`;
  try {
    const r = await fetch(SNAPSHOT, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({query:q, variables:{v:addr}}),
    });
    const j = await r.json();
    return j.data?.votes || [];
  } catch { return []; }
}

// ─────────────────────────────────────────────────────────────
// MIMO V2.5 NARRATIVE ENGINE
// Generates rich narrative from onchain data using deterministic
// rule-based composition + variation pools.
// ─────────────────────────────────────────────────────────────

const NARRATIVE = {
  // Era-based opening for chapter 1
  genesisEra: {
    en: {
      ancient:   `In the early days of Ethereum, when the chain was young and gas was cheap,`,
      pioneer:   `It was the era before DeFi summer, when the protocols of tomorrow were still forming,`,
      defi:      `In the heat of DeFi summer, when yield farms bloomed across the network,`,
      bull:      `As the bull market roared and NFTs filled every block,`,
      winter:    `Through the depths of crypto winter, when most logged off,`,
      revival:   `In the quiet revival year, between cycles, when only the curious remained,`,
      modern:    `In the modern era of L2s and rollups, when Ethereum itself had multiplied,`,
      recent:    `In the most recent chapter of Ethereum's evolution,`,
    },
    id: {
      ancient:   `Di hari-hari awal Ethereum, saat rantai masih muda dan gas masih murah,`,
      pioneer:   `Di era sebelum DeFi summer, saat protokol masa depan masih dirumuskan,`,
      defi:      `Di tengah panasnya DeFi summer, saat yield farm bermekaran di seluruh jaringan,`,
      bull:      `Saat bull market mengamuk dan NFT memenuhi setiap blok,`,
      winter:    `Di kedalaman crypto winter, saat sebagian besar memilih offline,`,
      revival:   `Di tahun pemulihan yang sepi, di antara dua siklus, saat hanya yang penasaran tetap bertahan,`,
      modern:    `Di era modern L2 dan rollup, saat Ethereum sendiri telah berlipat ganda,`,
      recent:    `Di bab paling baru dari evolusi Ethereum,`,
    }
  }
};

function eraOf(ts) {
  const d = new Date(ts * 1000);
  const y = d.getFullYear();
  if (y <= 2017) return 'ancient';
  if (y === 2018 || y === 2019) return 'pioneer';
  if (y === 2020) return 'defi';
  if (y === 2021) return 'bull';
  if (y === 2022) return 'winter';
  if (y === 2023) return 'revival';
  if (y === 2024) return 'modern';
  return 'recent';
}

function classifyPersona(d) {
  const tags = [];
  if (d.daoVotes >= 10) tags.push({en:'Governance Voter',id:'Pemilih Tata Kelola',cls:'purple'});
  else if (d.daoVotes >= 1) tags.push({en:'DAO Member',id:'Anggota DAO',cls:'purple'});
  if (d.nftCount >= 50) tags.push({en:'NFT Collector',id:'Kolektor NFT',cls:'blue'});
  else if (d.nftCount >= 5) tags.push({en:'NFT Holder',id:'Pemilik NFT',cls:'blue'});
  if (d.years >= 4) tags.push({en:'OG (4+ years)',id:'OG (4+ tahun)',cls:''});
  else if (d.years >= 2) tags.push({en:'Veteran',id:'Veteran',cls:''});
  if (d.tokens.length >= 20) tags.push({en:'DeFi Native',id:'Native DeFi',cls:'green'});
  if (d.txCount >= 1000) tags.push({en:'Power User',id:'Power User',cls:''});
  if (d.ensName) tags.push({en:'ENS Owner',id:'Pemilik ENS',cls:'green'});
  if (d.balance >= 10) tags.push({en:'Whale',id:'Whale',cls:''});
  else if (d.balance >= 1) tags.push({en:'Holder',id:'Holder',cls:''});
  return tags;
}

function survivedWinter(firstTs, lastTs) {
  const f = new Date(firstTs * 1000);
  const l = new Date(lastTs * 1000);
  // Winter = mid-2022 to early 2023 (Luna May 2022 → FTX Nov 2022 → silent Q1 2023)
  return f.getFullYear() <= 2022 && (l.getFullYear() > 2022 || (l.getFullYear() === 2022 && l.getMonth() >= 9));
}

function buildStory(d) {
  const era = eraOf(d.firstTx.timestamp);
  const eraOpen = NARRATIVE.genesisEra[lang][era];

  const ch1 = {
    num: t('ch1'),
    title: lang === 'en'
      ? `Born on ${fmtMonth(d.firstTx.timestamp)}`
      : `Lahir di ${fmtMonth(d.firstTx.timestamp)}`,
    intro: eraOpen + (lang === 'en'
      ? ` this wallet drew its first breath.`
      : ` wallet ini menarik napas pertamanya.`),
    body: lang === 'en'
      ? `<p>The first transaction landed on <strong>${fmtDate(d.firstTx.timestamp)}</strong> at block <strong>${fmtNum(parseInt(d.firstTx.block || 0))}</strong>. ${d.firstTx.value && Number(d.firstTx.value) > 0 ? `It carried <strong>${fmtEth(d.firstTx.value)} ETH</strong> in value` : `A simple call, no value attached`} — a quiet beginning to a <strong>${d.years.toFixed(1)}-year</strong> journey across the chain.</p>`
      : `<p>Transaksi pertama mendarat pada <strong>${fmtDate(d.firstTx.timestamp)}</strong> di blok <strong>${fmtNum(parseInt(d.firstTx.block || 0))}</strong>. ${d.firstTx.value && Number(d.firstTx.value) > 0 ? `Membawa <strong>${fmtEth(d.firstTx.value)} ETH</strong>` : `Sebuah panggilan sederhana, tanpa nilai yang melekat`} — awal yang tenang dari perjalanan <strong>${d.years.toFixed(1)} tahun</strong> di rantai.</p>`,
    meta: [
      {label:lang==='en'?'Block':'Blok', value:fmtNum(parseInt(d.firstTx.block||0))},
      {label:lang==='en'?'Era':'Era', value:era.charAt(0).toUpperCase()+era.slice(1)},
      {label:lang==='en'?'Years on Chain':'Tahun di Rantai', value:d.years.toFixed(1)},
    ],
  };

  // Chapter 2 - First steps
  const tokSample = d.tokens.slice(0, 3).map(x => x.symbol).join(', ');
  const ch2 = {
    num: t('ch2'),
    title: lang === 'en' ? 'Discovering the Network' : 'Menjelajah Jaringan',
    intro: lang === 'en'
      ? `Like any new soul on the chain, the first interactions came hesitantly, then with purpose.`
      : `Seperti jiwa baru di rantai, interaksi pertama datang ragu, lalu penuh tujuan.`,
    body: lang === 'en'
      ? `<p>Across <strong>${fmtNum(d.txCount)}</strong> transactions, the wallet built a footprint. ${d.tokens.length > 0 ? `It accumulated <strong>${d.tokens.length} different tokens</strong>${tokSample?`, including ${tokSample}`:''}.` : ''} ${d.contractsCreated ? `<strong>${d.contractsCreated} contracts</strong> were authored — a builder's mark.` : ''}</p><p>The chain remembers <strong>${fmtNum(d.gasUsed)}</strong> units of gas spent — proof of presence written in the ledger.</p>`
      : `<p>Melintasi <strong>${fmtNum(d.txCount)}</strong> transaksi, wallet ini membangun jejak. ${d.tokens.length > 0 ? `Mengumpulkan <strong>${d.tokens.length} token berbeda</strong>${tokSample?`, termasuk ${tokSample}`:''}.` : ''} ${d.contractsCreated ? `<strong>${d.contractsCreated} kontrak</strong> dibuat sendiri — tanda seorang builder.` : ''}</p><p>Rantai mengingat <strong>${fmtNum(d.gasUsed)}</strong> unit gas yang dikeluarkan — bukti kehadiran yang ditulis di buku besar.</p>`,
    meta: [
      {label:lang==='en'?'Total Tx':'Total Tx', value:fmtNum(d.txCount)},
      {label:lang==='en'?'Tokens Held':'Token Dipegang', value:d.tokens.length},
      {label:lang==='en'?'Gas Spent':'Gas Terpakai', value:fmtNum(d.gasUsed)},
    ],
  };

  // Chapter 3 - Survival
  const survived = survivedWinter(d.firstTx.timestamp, d.lastTx.timestamp);
  const ch3 = {
    num: t('ch3'),
    title: lang === 'en' ? 'The Long Winter' : 'Musim Dingin Panjang',
    intro: lang === 'en'
      ? `Crypto winter came. Luna fell. FTX collapsed. Most logged off, never to return.`
      : `Crypto winter datang. Luna jatuh. FTX kolaps. Banyak memilih offline, tak kembali.`,
    body: survived
      ? (lang === 'en'
        ? `<p>But this wallet <strong>survived</strong>. While the noise quieted and the timelines emptied, transactions kept landing — proof of conviction in a market built on doubt. The OGs are not those who arrived first; they are those who stayed when arriving was no longer rewarded.</p><p>Last seen on <strong>${fmtDate(d.lastTx.timestamp)}</strong> — still active, still here.</p>`
        : `<p>Tapi wallet ini <strong>bertahan</strong>. Saat suara mereda dan timeline kosong, transaksi terus mendarat — bukti keyakinan di pasar yang dibangun atas keraguan. OG bukan mereka yang datang pertama; mereka yang tetap saat datang tak lagi diapresiasi.</p><p>Terakhir terlihat <strong>${fmtDate(d.lastTx.timestamp)}</strong> — masih aktif, masih di sini.</p>`)
      : (lang === 'en'
        ? `<p>This wallet's journey began ${d.years < 2 ? 'after the worst of the cold' : 'in the calmer waters following the storm'}. It did not face the great freeze of 2022 — but ${d.txCount > 100 ? 'it has built considerable presence since' : 'its story is still young'}.</p><p>Last activity: <strong>${fmtDate(d.lastTx.timestamp)}</strong>.</p>`
        : `<p>Perjalanan wallet ini dimulai ${d.years < 2 ? 'setelah masa terdingin' : 'di air yang lebih tenang setelah badai'}. Ia tak menghadapi pembekuan besar 2022 — tapi ${d.txCount > 100 ? 'telah membangun kehadiran sejak itu' : 'ceritanya masih muda'}.</p><p>Aktivitas terakhir: <strong>${fmtDate(d.lastTx.timestamp)}</strong>.</p>`),
    meta: [
      {label:lang==='en'?'Survived 2022':'Bertahan 2022', value: survived ? '✓' : '—'},
      {label:lang==='en'?'Last Active':'Terakhir Aktif', value:fmtDate(d.lastTx.timestamp)},
      {label:lang==='en'?'Days Since Birth':'Hari Sejak Lahir', value:fmtNum(Math.floor((Date.now()/1000 - d.firstTx.timestamp)/86400))},
    ],
  };

  // Chapter 4 - Identity
  const topVoteSpaces = [...new Set(d.daoVotesList.map(v => v.proposal?.space?.name).filter(Boolean))].slice(0, 4);
  const ch4 = {
    num: t('ch4'),
    title: lang === 'en' ? 'Who They Became' : 'Siapa Mereka Sekarang',
    intro: lang === 'en'
      ? `An onchain identity is not given — it is earned, vote by vote, choice by choice.`
      : `Identitas onchain tak diberikan — ia diperoleh, suara demi suara, pilihan demi pilihan.`,
    body: lang === 'en'
      ? `<p>${d.ensName ? `Known across the network as <strong>${d.ensName}</strong>` : `An anonymous wallet`}, this address ${d.daoVotes > 0 ? `has cast <strong>${d.daoVotes} governance vote${d.daoVotes>1?'s':''}</strong>${topVoteSpaces.length?` across <strong>${topVoteSpaces.join(', ')}</strong>`:''}` : `has remained quiet on governance — a holder, not a voter`}.</p><p>${d.nftCount > 0 ? `<strong>${fmtNum(d.nftCount)} NFTs</strong> sit in the wallet — collected, gifted, or minted.` : `No NFTs collected — a clean fungible portfolio.`} The persona is best summarized as: <strong>${d.tags.map(x=>x[lang]).join(' · ')}</strong>.</p>`
      : `<p>${d.ensName ? `Dikenal di jaringan sebagai <strong>${d.ensName}</strong>` : `Wallet anonim`}, alamat ini ${d.daoVotes > 0 ? `telah memberikan <strong>${d.daoVotes} suara tata kelola</strong>${topVoteSpaces.length?` di <strong>${topVoteSpaces.join(', ')}</strong>`:''}` : `tetap diam pada tata kelola — seorang holder, bukan pemilih`}.</p><p>${d.nftCount > 0 ? `<strong>${fmtNum(d.nftCount)} NFT</strong> ada di wallet — dikoleksi, dihadiahkan, atau di-mint.` : `Tak ada NFT — portofolio fungible yang bersih.`} Persona ini paling tepat diringkas sebagai: <strong>${d.tags.map(x=>x[lang]).join(' · ')}</strong>.</p>`,
    meta: [
      {label:lang==='en'?'DAO Votes':'Suara DAO', value:fmtNum(d.daoVotes)},
      {label:lang==='en'?'NFTs Held':'NFT Dipegang', value:fmtNum(d.nftCount)},
      {label:'ENS', value: d.ensName || '—'},
    ],
  };

  // Chapter 5 - Today
  const portfolioVal = d.balance;
  const ch5 = {
    num: t('ch5'),
    title: lang === 'en' ? 'The Story So Far' : 'Cerita Sampai Hari Ini',
    intro: lang === 'en'
      ? `Today, the chain still spins. New blocks arrive every twelve seconds. And this wallet — it remains.`
      : `Hari ini, rantai terus berputar. Blok baru tiba setiap dua belas detik. Dan wallet ini — masih di sini.`,
    body: lang === 'en'
      ? `<p>Current balance: <strong>${fmtEth(d.rawBalance)} ETH</strong> (~${fmtNum(portfolioVal)} ETH equivalent in held tokens). After <strong>${d.years.toFixed(1)} years</strong>, <strong>${fmtNum(d.txCount)} transactions</strong>, and <strong>${fmtNum(d.gasUsed)}</strong> gas units burned — the journey continues.</p><p>${d.daoVotes > 5 ? 'A vote-active citizen of the network.' : ''} ${d.years >= 4 ? 'A true OG.' : d.years >= 2 ? 'A seasoned hand.' : 'A growing presence.'} The next chapter is unwritten.</p>`
      : `<p>Saldo sekarang: <strong>${fmtEth(d.rawBalance)} ETH</strong> (~${fmtNum(portfolioVal)} ETH ekuivalen dalam token). Setelah <strong>${d.years.toFixed(1)} tahun</strong>, <strong>${fmtNum(d.txCount)} transaksi</strong>, dan <strong>${fmtNum(d.gasUsed)}</strong> unit gas — perjalanan berlanjut.</p><p>${d.daoVotes > 5 ? 'Warga jaringan yang aktif memberikan suara.' : ''} ${d.years >= 4 ? 'OG sejati.' : d.years >= 2 ? 'Tangan yang terlatih.' : 'Kehadiran yang terus berkembang.'} Bab berikutnya belum ditulis.</p>`,
    meta: [
      {label:lang==='en'?'ETH Balance':'Saldo ETH', value:fmtEth(d.rawBalance)},
      {label:lang==='en'?'Tokens':'Token', value:fmtNum(d.tokens.length)},
      {label:lang==='en'?'Era Now':'Era Sekarang', value:d.years >= 4 ? 'OG' : d.years >= 2 ? 'Veteran' : 'Rising'},
    ],
  };

  return [ch1, ch2, ch3, ch4, ch5];
}

// ─────────────────────────────────────────────────────────────
// MAIN GENERATE
// ─────────────────────────────────────────────────────────────
async function generate(input) {
  if (!input || !input.trim()) return showError(lang === 'en' ? 'Please enter an address or ENS' : 'Masukkan alamat atau ENS');
  document.getElementById('error').classList.remove('on');
  document.getElementById('story').classList.remove('on');
  document.getElementById('loading').classList.add('on');

  try {
    setLoadStep(lang === 'en' ? 'resolving identity' : 'mengenali identitas');
    const id = await resolveENS(input.trim());
    if (!id.address || !id.address.match(/^0x[0-9a-f]{40}$/)) {
      throw new Error(lang === 'en' ? 'Could not resolve to a valid address' : 'Tidak dapat menemukan alamat valid');
    }

    setLoadStep(lang === 'en' ? 'fetching genesis block' : 'mengambil blok awal');
    const [info, counters, activity, tokens, nftCount, votes] = await Promise.all([
      fetchAddressInfo(id.address).catch(()=>({})),
      fetchCounters(id.address).catch(()=>({})),
      fetchActivityYears(id.address).catch(()=>null),
      fetchTokens(id.address).catch(()=>[]),
      fetchNFTCount(id.address).catch(()=>0),
      fetchSnapshotVotes(id.address).catch(()=>[]),
    ]);

    if (!activity || !activity.first) {
      throw new Error(lang === 'en' ? 'No transaction history found for this address' : 'Tidak ada riwayat transaksi untuk alamat ini');
    }

    setLoadStep(lang === 'en' ? 'composing your story' : 'menyusun ceritamu');

    const firstTs = parseInt(new Date(activity.first.timestamp).getTime() / 1000);
    const lastTs = parseInt(new Date(activity.last.timestamp).getTime() / 1000);
    const years = yearsBetween(firstTs, lastTs);

    const data = {
      address: id.address,
      ensName: id.name,
      avatar: id.avatar,
      rawBalance: info.coin_balance || '0',
      balance: parseFloat((info.coin_balance || 0)) / 1e18,
      txCount: parseInt(counters.transactions_count || 0) || (activity.first ? 1 : 0),
      gasUsed: parseInt(counters.gas_usage_count || 0),
      contractsCreated: parseInt(info.has_decompiled_code ? 1 : 0) + (info.is_contract ? 0 : 0),
      tokens,
      nftCount,
      daoVotes: votes.length,
      daoVotesList: votes,
      firstTx: {
        hash: activity.first.hash,
        timestamp: firstTs,
        block: activity.first.block_number,
        value: activity.first.value,
      },
      lastTx: {
        hash: activity.last.hash,
        timestamp: lastTs,
        block: activity.last.block_number,
        value: activity.last.value,
      },
      years,
    };
    data.tags = classifyPersona(data);
    currentStory = data;

    setTimeout(() => {
      document.getElementById('loading').classList.remove('on');
      renderStory(data);
    }, 300);
  } catch (e) {
    console.error(e);
    showError(e.message || (lang === 'en' ? 'Something went wrong' : 'Ada yang salah'));
  }
}

// ─────────────────────────────────────────────────────────────
// RENDER
// ─────────────────────────────────────────────────────────────
function renderStory(d) {
  const story = document.getElementById('story');
  story.classList.add('on');
  const chapters = buildStory(d);

  const profile = `
    <div class="profile">
      <div class="avatar">${d.avatar ? `<img src="${d.avatar}" alt="" onerror="this.style.display='none';this.parentElement.textContent='👤'" />` : '👤'}</div>
      <div class="profile-info">
        <div class="profile-name">${d.ensName || fmtAddr(d.address)}</div>
        <div class="profile-addr">${d.address}</div>
        <div class="profile-tags">${d.tags.map(tg => `<span class="tag ${tg.cls||''}">${tg[lang]}</span>`).join('')}</div>
      </div>
    </div>
    <div class="stats">
      <div class="stat"><div class="stat-label">${lang==='en'?'Years on Chain':'Tahun di Rantai'}</div><div class="stat-value">${d.years.toFixed(1)}</div><div class="stat-sub">${lang==='en'?'since':'sejak'} ${fmtMonth(d.firstTx.timestamp)}</div></div>
      <div class="stat"><div class="stat-label">${lang==='en'?'Transactions':'Transaksi'}</div><div class="stat-value">${fmtNum(d.txCount)}</div><div class="stat-sub">${fmtNum(d.gasUsed)} gas</div></div>
      <div class="stat"><div class="stat-label">${lang==='en'?'Tokens':'Token'}</div><div class="stat-value">${d.tokens.length}</div><div class="stat-sub">${fmtNum(d.nftCount)} NFTs</div></div>
      <div class="stat"><div class="stat-label">${lang==='en'?'DAO Votes':'Suara DAO'}</div><div class="stat-value">${fmtNum(d.daoVotes)}</div><div class="stat-sub">${lang==='en'?'governance':'tata kelola'}</div></div>
    </div>
  `;

  const chapterHtml = chapters.map(c => `
    <article class="chapter">
      <div class="ch-num">${c.num}</div>
      <h2 class="ch-title">${c.title}</h2>
      <div class="ch-intro">${c.intro}</div>
      <div class="ch-body">${c.body}</div>
      <div class="ch-meta">${c.meta.map(m => `<span class="meta">${m.label}: <strong>${m.value}</strong></span>`).join('')}</div>
    </article>
  `).join('');

  const actions = `
    <div class="actions">
      <button class="btn btn-primary" id="generate-poster-btn">🎨 ${t('btn-poster')}</button>
      <button class="btn" id="restart-btn">↻ ${t('btn-restart')}</button>
    </div>
  `;

  story.innerHTML = profile + chapterHtml + actions;
  document.getElementById('generate-poster-btn').onclick = openPoster;
  document.getElementById('restart-btn').onclick = () => {
    story.classList.remove('on');
    document.getElementById('addr-input').focus();
    window.scrollTo({top:0, behavior:'smooth'});
  };

  story.scrollIntoView({behavior:'smooth', block:'start'});
}

// ─────────────────────────────────────────────────────────────
// POSTER GENERATOR
// ─────────────────────────────────────────────────────────────
function makePoster(d) {
  const W = 1080, H = 1920;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const x = c.getContext('2d');

  // Background gradient
  const bg = x.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0a14');
  bg.addColorStop(0.5, '#1a0a24');
  bg.addColorStop(1, '#0a0a18');
  x.fillStyle = bg;
  x.fillRect(0, 0, W, H);

  // Decorative gradient blob
  const blob = x.createRadialGradient(W*0.5, H*0.15, 100, W*0.5, H*0.15, 600);
  blob.addColorStop(0, 'rgba(255,122,24,.4)');
  blob.addColorStop(1, 'rgba(255,122,24,0)');
  x.fillStyle = blob;
  x.fillRect(0, 0, W, H);

  // Header
  x.fillStyle = '#ff7a18';
  x.font = 'bold 32px Inter';
  x.fillText('📖 MIMOSTORY', 60, 100);
  x.fillStyle = 'rgba(255,255,255,0.5)';
  x.font = '500 22px Inter';
  x.fillText(lang==='en'?'A Wallet Life Story':'Kisah Hidup Wallet', 60, 140);

  // Main name
  x.fillStyle = '#ffffff';
  x.font = 'bold 80px Playfair Display, Georgia, serif';
  const name = d.ensName || fmtAddr(d.address);
  x.fillText(name, 60, 280);

  x.fillStyle = 'rgba(255,255,255,0.4)';
  x.font = '500 24px Monaco, monospace';
  x.fillText(d.address, 60, 320);

  // Tags
  let tagY = 380;
  let tagX = 60;
  x.font = 'bold 22px Inter';
  d.tags.slice(0, 5).forEach(tg => {
    const text = tg[lang];
    const w = x.measureText(text).width + 32;
    x.fillStyle = 'rgba(255,122,24,0.15)';
    x.beginPath();
    x.roundRect(tagX, tagY-22, w, 36, 100);
    x.fill();
    x.fillStyle = '#ffb347';
    x.fillText(text, tagX+16, tagY+2);
    tagX += w + 10;
    if (tagX > W - 200) { tagX = 60; tagY += 50; }
  });

  // Big stat
  let statsY = 580;
  x.fillStyle = '#ffffff';
  x.font = 'bold 220px Playfair Display, Georgia, serif';
  x.fillText(d.years.toFixed(1), 60, statsY + 180);
  x.fillStyle = 'rgba(255,255,255,0.6)';
  x.font = '600 28px Inter';
  x.fillText(lang==='en'?'YEARS ON CHAIN':'TAHUN DI RANTAI', 60, statsY + 220);

  // Stat grid
  const stats = [
    [fmtNum(d.txCount), lang==='en'?'TRANSACTIONS':'TRANSAKSI'],
    [fmtNum(d.gasUsed), lang==='en'?'GAS USED':'GAS DIPAKAI'],
    [fmtNum(d.daoVotes), lang==='en'?'DAO VOTES':'SUARA DAO'],
    [fmtNum(d.nftCount), 'NFTS'],
  ];
  let gy = statsY + 320;
  stats.forEach((s, i) => {
    const cx = 60 + (i % 2) * 480;
    const cy = gy + Math.floor(i / 2) * 180;
    x.fillStyle = 'rgba(255,255,255,0.04)';
    x.beginPath();
    x.roundRect(cx, cy, 460, 140, 16);
    x.fill();
    x.fillStyle = '#ff7a18';
    x.font = 'bold 64px Inter';
    x.fillText(s[0], cx + 30, cy + 80);
    x.fillStyle = 'rgba(255,255,255,0.5)';
    x.font = 'bold 18px Inter';
    x.fillText(s[1], cx + 30, cy + 115);
  });

  // Quote
  x.fillStyle = 'rgba(255,255,255,0.85)';
  x.font = 'italic 36px Playfair Display, Georgia, serif';
  const quote = d.years >= 4
    ? (lang==='en' ? '"Through every cycle, still here."' : '"Lewati setiap siklus, masih di sini."')
    : d.years >= 2
    ? (lang==='en' ? '"Earned, not given."' : '"Diperoleh, bukan diberi."')
    : (lang==='en' ? '"The next chapter begins."' : '"Bab berikutnya dimulai."');
  // simple word-wrap quote
  const words = quote.split(' ');
  let line = '';
  let qy = 1380;
  for (const w of words) {
    const tst = line + w + ' ';
    if (x.measureText(tst).width > W - 120) {
      x.fillText(line, 60, qy);
      line = w + ' ';
      qy += 50;
    } else {
      line = tst;
    }
  }
  x.fillText(line, 60, qy);

  // Footer
  x.fillStyle = 'rgba(255,255,255,0.3)';
  x.font = '600 20px Inter';
  x.fillText(lang==='en'?'Generated by MiMoStory · Powered by Xiaomi MiMo V2.5':'Dibuat oleh MiMoStory · Powered by Xiaomi MiMo V2.5', 60, H - 100);
  x.fillText('huolinger010.github.io/mimostory', 60, H - 60);

  return c;
}

function openPoster() {
  const canvas = makePoster(currentStory);
  const preview = document.getElementById('poster-preview');
  preview.innerHTML = '';
  preview.appendChild(canvas);
  document.getElementById('poster-modal').classList.add('on');

  document.getElementById('download-poster').onclick = () => {
    const link = document.createElement('a');
    link.download = `mimostory-${(currentStory.ensName || currentStory.address.slice(0,8)).replace(/\./g,'-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };
  document.getElementById('share-x').onclick = () => {
    const txt = encodeURIComponent(
      lang === 'en'
        ? `My wallet has a story 📖\n\n${currentStory.years.toFixed(1)} years onchain · ${fmtNum(currentStory.txCount)} txs · ${fmtNum(currentStory.daoVotes)} DAO votes\n\nGenerated by @MiMoStory powered by Xiaomi MiMo V2.5`
        : `Wallet-ku punya cerita 📖\n\n${currentStory.years.toFixed(1)} tahun onchain · ${fmtNum(currentStory.txCount)} tx · ${fmtNum(currentStory.daoVotes)} suara DAO\n\nDibuat oleh @MiMoStory powered by Xiaomi MiMo V2.5`
    );
    window.open(`https://twitter.com/intent/tweet?text=${txt}&url=${encodeURIComponent('https://huolinger010.github.io/mimostory/')}`);
  };
}

document.getElementById('close-modal').onclick = () =>
  document.getElementById('poster-modal').classList.remove('on');

// ─────────────────────────────────────────────────────────────
// EVENTS
// ─────────────────────────────────────────────────────────────
document.getElementById('go-btn').onclick = () => generate(document.getElementById('addr-input').value);
document.getElementById('addr-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') generate(e.target.value);
});
document.querySelectorAll('.ex-pill').forEach(b =>
  b.onclick = () => {
    document.getElementById('addr-input').value = b.dataset.addr;
    generate(b.dataset.addr);
  }
);

// Auto-load if URL hash
if (location.hash) {
  const addr = decodeURIComponent(location.hash.slice(1));
  document.getElementById('addr-input').value = addr;
  generate(addr);
}
