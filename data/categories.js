// Extracted from data/index.js — categories only, no tools/blogPosts.
// Kept separate so Layout.js (loaded on every page via _app.js) doesn't
// pull in the full 424 KB tools+blogPosts bundle just for the category list.

export const categories = [
  { name: "All", icon: "🔍", count: 64 },
  {
    name: "Chatbots", icon: "💬", count: 4,
    description: "General-purpose AI chat assistants for everyday questions, writing, brainstorming, and research. These are the tools most people reach for first — capable of drafting emails, explaining concepts, summarizing documents, and holding open-ended conversations.",
  },
  {
    name: "AI Writing", icon: "✍️", count: 3,
    description: "AI tools focused on producing marketing copy, blog content, and short-form writing at scale, with templates, tone controls, and (in some cases) built-in SEO scoring for content teams.",
  },
  {
    name: "Coding", icon: "💻", count: 10,
    description: "AI-powered code editors, assistants, and app builders that understand your codebase, suggest completions, generate full applications from prompts, and help with refactoring, debugging, testing, and deployment.",
  },
  {
    name: "Image Generation", icon: "🎨", count: 1,
    description: "AI models that turn text prompts (or reference images) into original artwork, illustrations, and photorealistic images. Used for concept art, marketing visuals, book covers, and creative exploration.",
  },
  {
    name: "Video Generation", icon: "🎬", count: 9,
    description: "Tools that generate video clips, talking AI avatars, and dubbed/localized footage from text prompts, scripts, or still images — used for marketing content, training videos, and social media.",
  },
  {
    name: "Research", icon: "🔬", count: 6,
    description: "AI search and research tools that answer questions with cited sources — including source-grounded notebooks, academic literature search, and developer-focused search — helping you fact-check claims and explore topics faster.",
  },
  {
    name: "Audio", icon: "🎙️", count: 6,
    description: "Text-to-speech, voice-cloning, music generation, and meeting-transcription tools for podcasts, audiobooks, video narration, meeting notes, and other audio production work.",
  },
  {
    name: "Productivity", icon: "⚡", count: 3,
    description: "AI features integrated into productivity, note-taking, and calendar tools, helping summarize meetings, organize information, and automatically schedule tasks around your day.",
  },
  {
    name: "Marketing", icon: "📈", count: 4,
    description: "AI platforms built specifically for marketing teams — ad creative generation, SEO content optimization, social media content, and campaign tools designed for producing on-brand content at scale.",
  },
  {
    name: "Automation", icon: "🔁", count: 4,
    description: "Visual workflow-automation platforms that connect your apps together, with AI-powered steps and no-code agents for handling repetitive, multi-step business processes.",
  },
  {
    name: "AI Agents", icon: "🤖", count: 5,
    description: "Autonomous and semi-autonomous AI agents that can plan and execute multi-step tasks on their own — from building and deploying full apps to picking up coding tickets, running research, and managing your inbox.",
  },
  {
    name: "Design", icon: "🖌️", count: 4,
    description: "AI-powered design platforms for generating and editing images, logos, vectors, and branded visuals — from generative fill inside creative software to all-in-one design suites with built-in AI.",
  },
  {
    name: "Presentation", icon: "📊", count: 3,
    description: "AI tools that turn a prompt or outline into a fully designed slide deck, applying layout, imagery, and branding automatically so you can focus on the message rather than the formatting.",
  },
  {
    name: "Data Analysis", icon: "📉", count: 2,
    description: "AI tools that analyze spreadsheets and datasets through plain-language chat or no-code interfaces — generating charts, statistics, and predictive models without writing analysis code by hand.",
  },
];
