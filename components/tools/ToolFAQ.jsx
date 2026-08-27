import { useState } from "react";

export default function ToolFAQ({ faqs = [], toolName }) {
  const [openIndex, setOpenIndex] = useState(null);

  if (!faqs || faqs.length === 0) return null;

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div style={{ background: "#0f1829", border: "1px solid #1a2d4a", borderRadius: 16, padding: 22, marginBottom: 20 }}>
        <h3 style={{ fontFamily: "Space Grotesk, sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 14 }}>
          Frequently Asked Questions about {toolName}
        </h3>
        {faqs.map((f, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={i} style={{ borderTop: i === 0 ? "none" : "1px solid #1a2d4a", paddingTop: i === 0 ? 0 : 12, marginTop: i === 0 ? 0 : 12 }}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                style={{
                  background: "none", border: "none", width: "100%", textAlign: "left",
                  color: "#e8f0ff", fontSize: 14, fontWeight: 600, cursor: "pointer",
                  display: "flex", justifyContent: "space-between", alignItems: "center", padding: 0,
                }}
              >
                {f.q}
                <span aria-hidden="true" style={{ color: "#14FFF4", marginLeft: 12 }}>{isOpen ? "-" : "+"}</span>
              </button>
              {isOpen && (
                <p style={{ color: "#8ba3ca", fontSize: 13, lineHeight: 1.65, marginTop: 8 }}>{f.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
