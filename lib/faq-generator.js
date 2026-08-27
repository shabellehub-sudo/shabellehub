export function generateToolFaqs(tool, allTools = []) {
  const isFree = tool.priceTier === "free";
  const isFreemium = tool.priceTier === "freemium";

  const faqs = [
    {
      q: `Is ${tool.name} free to use?`,
      a: isFree
        ? `Yes, ${tool.name} is completely free to use.`
        : isFreemium
        ? `${tool.name} has a free plan, with paid options starting at ${tool.price ? tool.price.split("/").pop().trim() : "the paid plan"}.`
        : `${tool.name} is a paid tool, priced at ${tool.price}.`,
    },
  ];

  if (tool.useCases && tool.useCases.length > 0) {
    faqs.push({
      q: `What is ${tool.name} best used for?`,
      a: `${tool.name} is best suited for ${tool.useCases.slice(0, 3).join(", ")}.`,
    });
  }

  if (tool.alternatives && tool.alternatives.length > 0) {
    const altNames = tool.alternatives
      .map((slug) => (allTools.find((t) => t.slug === slug) || {}).name || slug)
      .filter(Boolean);
    faqs.push({
      q: `What are the best alternatives to ${tool.name}?`,
      a: `Popular alternatives to ${tool.name} include ${altNames.join(", ")}.`,
    });
  }

  return faqs;
}
