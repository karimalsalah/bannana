/**
 * Generative Engine Optimization — Article + FAQPage + HowTo JSON-LD.
 *
 * Note (charter §D, facts-not-folklore): schema is shipped for rich-results and
 * entity disambiguation, NOT as a citation growth-hack (rigorous sources find no
 * citation uplift from schema). It is correct and cheap, never a lever.
 */
const ORIGIN = typeof location !== "undefined" ? location.origin : "https://usephedm.github.io";

const article = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The Banana Protocol — a spatial WebGPU anomaly with an account-abstraction core",
  description:
    "The Banana Protocol is a real-time WebGPU/TSL organism that evolves through a five-stage lifecycle as users feed it gasless $PEEL stakes via ERC-4337 biometric smart accounts.",
  about: ["WebGPU", "Three.js Shading Language", "ERC-4337 account abstraction", "WebAuthn passkeys"],
  datePublished: "2026-06-19",
  dateModified: "2026-06-19",
  author: { "@type": "Person", name: "usephedm" },
  publisher: { "@type": "Organization", name: "The Banana Protocol" },
  mainEntityOfPage: ORIGIN,
};

const faq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "What is The Banana Protocol?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "A real-time WebGPU experience: a spatial banana organism rendered with Three.js Shading Language that ripens through five lifecycle stages as you feed it gasless $PEEL token stakes through an ERC-4337 smart account secured by a biometric passkey.",
      },
    },
    {
      "@type": "Question",
      name: "How does feeding the code work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Connecting a WebAuthn passkey provisions an ERC-4337 smart account. Staking $PEEL submits a paymaster-sponsored (gasless) UserOperation that raises the organism's charge and advances its evolutionary stage.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to pay gas?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No. Stakes are sponsored by a paymaster under ERC-4337 account abstraction, so interactions are gasless for the user.",
      },
    },
  ],
};

const howto = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to access The Banana Protocol",
  step: [
    { "@type": "HowToStep", name: "Enter the void", text: "Open the experience in a WebGPU-capable browser." },
    { "@type": "HowToStep", name: "Inject computational mass", text: "Connect a biometric passkey to provision your smart account." },
    { "@type": "HowToStep", name: "Feed the code", text: "Stake $PEEL to charge the organism and advance its lifecycle." },
  ],
};

export function injectStructuredData(): void {
  if (typeof document === "undefined") return;
  for (const data of [article, faq, howto]) {
    const tag = document.createElement("script");
    tag.type = "application/ld+json";
    tag.textContent = JSON.stringify(data);
    document.head.appendChild(tag);
  }
}
