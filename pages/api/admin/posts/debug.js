// Temporary debug endpoint — shows Admin SDK status without exposing secrets
// DELETE this file after confirming Blog works.
export default function handler(req, res) {
  const projectId   = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey  = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  res.status(200).json({
    projectId_set:    Boolean(projectId),
    clientEmail_set:  Boolean(clientEmail),
    privateKey_set:   Boolean(privateKey),
    clientEmail_includes_your_project: clientEmail
      ? String(clientEmail).includes('your_project')
      : null,
    privateKey_length: privateKey ? privateKey.length : 0,
    privateKey_has_header: privateKey
      ? privateKey.includes('BEGIN PRIVATE KEY')
      : false,
    privateKey_has_escaped_newlines: privateKey
      ? privateKey.includes('\\n')
      : false,
    privateKey_has_real_newlines: privateKey
      ? privateKey.includes('\n')
      : false,
  });
}
