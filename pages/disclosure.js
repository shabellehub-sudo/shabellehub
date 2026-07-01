// FILE: pages/disclosure.js
// This page has been superseded by /affiliate-disclosure (more complete,
// AdSense-compliant disclosure). Permanently redirect so existing links,
// bookmarks, and search results land on the canonical page rather than a
// thin duplicate.
export async function getServerSideProps() {
  return {
    redirect: {
      destination: '/affiliate-disclosure',
      permanent: true,
    },
  };
}

export default function DisclosureRedirect() {
  return null;
}
