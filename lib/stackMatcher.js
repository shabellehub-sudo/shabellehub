/**
 * Smart Stack Matcher - Basic Same-Role Exclusion & Workflow Matching Logic
 */

export function getSmartStackForTool(primaryTool, allTools = []) {
  if (!primaryTool || !allTools.length) {
    return null;
  }

  // 1. PRIMARY EXCLUSION: Filter out the Primary Tool itself from candidates
  const candidates = allTools.filter((t) => {
    const isSameSlug = t.slug === primaryTool.slug;
    const isSameId = t.id && primaryTool.id && t.id === primaryTool.id;
    return !isSameSlug && !isSameId;
  });

  const primaryRole = primaryTool.role || primaryTool.category;

  // 2. CREATION PARTNER SELECTION (Category/Role Duplication Avoidance)
  let creationTool = candidates.find((t) => {
    const candidateRole = t.role || t.category;
    return candidateRole !== primaryRole && isCreationRole(candidateRole);
  });

  // Fallback: If no dedicated creation role is found, pick any tool with a different category
  if (!creationTool) {
    creationTool = candidates.find((t) => (t.role || t.category) !== primaryRole);
  }

  // 3. DISTRIBUTION PARTNER SELECTION
  let distributionTool = candidates.find((t) => {
    const candidateRole = t.role || t.category;
    const creationRole = creationTool ? (creationTool.role || creationTool.category) : null;
    
    return (
      candidateRole !== primaryRole &&
      candidateRole !== creationRole &&
      (t.slug !== creationTool?.slug) &&
      isDistributionRole(candidateRole)
    );
  });

  // Fallback: Pick any tool distinct from Primary Tool and Creation Tool
  if (!distributionTool) {
    distributionTool = candidates.find(
      (t) =>
        t.slug !== primaryTool.slug &&
        t.slug !== creationTool?.slug &&
        (t.role || t.category) !== primaryRole
    );
  }

  return {
    creationTool: creationTool || null,
    distributionTool: distributionTool || null,
  };
}

// Helper Functions
function isCreationRole(role) {
  const creationRoles = ['Design', 'Image Generation', 'Video', 'Audio', 'Copywriting', 'Writing'];
  return creationRoles.includes(role);
}

function isDistributionRole(role) {
  const distRoles = ['Marketing', 'Social Media', 'SEO', 'Analytics', 'Automation', 'Productivity'];
  return distRoles.includes(role);
}
