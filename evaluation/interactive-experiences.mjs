#!/usr/bin/env node
/**
 * Interactive Experience Websites
 * 
 * Websites specifically designed for testing interactive experiences and gameplay:
 * - Interactive games
 * - Interactive applications
 * - Real-time collaborative tools
 * - Dynamic user interfaces
 * - Temporal interactions
 */

export const INTERACTIVE_EXPERIENCE_WEBSITES = [
  // Interactive Games
  {
    id: 'interactive-game',
    name: 'Interactive Game Platform',
    url: 'https://www.coolmathgames.com',
    difficulty: 'hard',
    experienceType: 'gameplay',
    challenges: [
      'Interactive game controls',
      'Real-time gameplay',
      'Score tracking',
      'Game state changes',
      'Animation sequences'
    ],
    expectedScore: { min: 5, max: 8 },
    focusAreas: ['gameplay-interactions', 'temporal-sequences', 'state-changes', 'animation-accessibility'],
    personas: ['Casual Gamer', 'Accessibility Advocate', 'Power User']
  },
  {
    id: 'puzzle-game',
    name: 'Puzzle Game',
    url: 'https://www.nytimes.com/games/wordle',
    difficulty: 'hard',
    experienceType: 'gameplay',
    challenges: [
      'Interactive puzzle solving',
      'Real-time feedback',
      'State persistence',
      'Keyboard interactions',
      'Visual feedback'
    ],
    expectedScore: { min: 6, max: 9 },
    focusAreas: ['keyboard-navigation', 'feedback-systems', 'state-management', 'interactive-feedback'],
    personas: ['Puzzle Enthusiast', 'Keyboard User', 'Visual Learner']
  },
  
  // Interactive Applications
  {
    id: 'interactive-drawing',
    name: 'Interactive Drawing Tool',
    url: 'https://www.autodraw.com',
    difficulty: 'very-hard',
    experienceType: 'interactive-app',
    challenges: [
      'Canvas interactions',
      'Drawing tools',
      'Real-time preview',
      'Gesture recognition',
      'Undo/redo functionality'
    ],
    expectedScore: { min: 4, max: 7 },
    focusAreas: ['canvas-accessibility', 'tool-interactions', 'keyboard-alternatives', 'gesture-support'],
    personas: ['Artist', 'Accessibility User', 'Power User']
  },
  {
    id: 'interactive-music',
    name: 'Interactive Music Player',
    url: 'https://www.spotify.com',
    difficulty: 'hard',
    experienceType: 'interactive-app',
    challenges: [
      'Media controls',
      'Playlist interactions',
      'Real-time playback',
      'Search functionality',
      'Dynamic content loading'
    ],
    expectedScore: { min: 5, max: 8 },
    focusAreas: ['media-controls', 'keyboard-shortcuts', 'dynamic-content', 'search-accessibility'],
    personas: ['Music Lover', 'Keyboard User', 'Screen Reader User']
  },
  
  // Real-Time Collaborative
  {
    id: 'collaborative-whiteboard',
    name: 'Collaborative Whiteboard',
    url: 'https://www.miro.com',
    difficulty: 'nightmare',
    experienceType: 'collaborative',
    challenges: [
      'Real-time collaboration',
      'Multi-user cursors',
      'Infinite canvas',
      'Drag and drop',
      'Zoom and pan',
      'Tool selection'
    ],
    expectedScore: { min: 2, max: 6 },
    focusAreas: ['collaboration-accessibility', 'keyboard-navigation', 'screen-reader-support', 'multi-user-cursors'],
    personas: ['Collaborator', 'Accessibility User', 'Power User']
  },
  {
    id: 'real-time-chat',
    name: 'Real-Time Chat',
    url: 'https://www.discord.com',
    difficulty: 'extreme',
    experienceType: 'collaborative',
    challenges: [
      'Real-time messaging',
      'Voice channels',
      'Dynamic message updates',
      'Notification system',
      'Channel navigation'
    ],
    expectedScore: { min: 4, max: 7 },
    focusAreas: ['real-time-updates', 'aria-live-regions', 'notification-accessibility', 'keyboard-navigation'],
    personas: ['Community Member', 'Accessibility User', 'Power User']
  },
  
  // Dynamic UI Interactions
  {
    id: 'interactive-dashboard',
    name: 'Interactive Dashboard',
    url: 'https://www.google.com/analytics',
    difficulty: 'expert',
    experienceType: 'interactive-app',
    challenges: [
      'Interactive charts',
      'Filter interactions',
      'Date range selection',
      'Data visualization',
      'Real-time updates'
    ],
    expectedScore: { min: 4, max: 7 },
    focusAreas: ['chart-interactions', 'filter-accessibility', 'keyboard-navigation', 'data-visualization'],
    personas: ['Data Analyst', 'Keyboard User', 'Screen Reader User']
  },
  {
    id: 'interactive-form',
    name: 'Interactive Multi-Step Form',
    url: 'https://www.turbotax.com',
    difficulty: 'very-hard',
    experienceType: 'interactive-app',
    challenges: [
      'Multi-step process',
      'Conditional fields',
      'Real-time validation',
      'Progress tracking',
      'Error handling',
      'Save and resume'
    ],
    expectedScore: { min: 4, max: 7 },
    focusAreas: ['form-accessibility', 'conditional-logic', 'error-handling', 'progress-indicators'],
    personas: ['Form Filler', 'Accessibility User', 'Careful User']
  },
  
  // Interactive Learning
  {
    id: 'interactive-learning',
    name: 'Interactive Learning Platform',
    url: 'https://www.khanacademy.org',
    difficulty: 'hard',
    experienceType: 'interactive-app',
    challenges: [
      'Interactive exercises',
      'Progress tracking',
      'Video player controls',
      'Quiz interactions',
      'Hints and feedback'
    ],
    expectedScore: { min: 6, max: 9 },
    focusAreas: ['exercise-interactions', 'progress-tracking', 'media-controls', 'feedback-systems'],
    personas: ['Student', 'Accessibility User', 'Visual Learner']
  },
  {
    id: 'interactive-code',
    name: 'Interactive Code Playground',
    url: 'https://codesandbox.io',
    difficulty: 'nightmare',
    experienceType: 'interactive-app',
    challenges: [
      'Code editing',
      'Real-time preview',
      'Terminal interactions',
      'File navigation',
      'Auto-completion',
      'Error highlighting'
    ],
    expectedScore: { min: 2, max: 6 },
    focusAreas: ['code-editor-accessibility', 'keyboard-shortcuts', 'screen-reader-support', 'terminal-accessibility'],
    personas: ['Developer', 'Keyboard User', 'Screen Reader User']
  }
];

/**
 * Get websites by experience type
 */
export function getWebsitesByExperienceType(type) {
  return INTERACTIVE_EXPERIENCE_WEBSITES.filter(w => w.experienceType === type);
}

/**
 * Get all interactive websites sorted by difficulty
 */
export function getAllInteractiveWebsitesSorted() {
  const difficultyOrder = ['hard', 'very-hard', 'extreme', 'expert', 'nightmare'];
  return INTERACTIVE_EXPERIENCE_WEBSITES.sort((a, b) => {
    return difficultyOrder.indexOf(a.difficulty) - difficultyOrder.indexOf(b.difficulty);
  });
}

/**
 * Build interactive experience prompt
 */
export function buildInteractivePrompt(website) {
  let prompt = `Evaluate this interactive ${website.experienceType} website focusing on interactive experience:\n\n`;
  
  prompt += `**EXPERIENCE TYPE:** ${website.experienceType.toUpperCase()}\n\n`;
  
  prompt += `**INTERACTIVE CHALLENGES:**\n`;
  website.challenges.forEach(challenge => {
    prompt += `- ${challenge}\n`;
  });
  
  prompt += `\n**FOCUS AREAS:**\n`;
  website.focusAreas.forEach(area => {
    prompt += `- ${area}\n`;
  });
  
  prompt += `\n**EVALUATION INSTRUCTIONS:**\n`;
  prompt += `- Evaluate interactive elements and their accessibility\n`;
  prompt += `- Test keyboard navigation for all interactive features\n`;
  prompt += `- Assess real-time feedback and state changes\n`;
  prompt += `- Check for proper ARIA labels on interactive elements\n`;
  prompt += `- Evaluate temporal interactions (animations, transitions)\n`;
  prompt += `- Assess screen reader support for interactive features\n`;
  prompt += `- Check for proper focus management during interactions\n`;
  
  prompt += `\nProvide a detailed score (0-10) with specific issues found in interactive elements.`;
  
  return prompt;
}

/**
 * Get expected results for interactive websites
 */
export function getInteractiveExpectedResults(website) {
  return {
    scoreRange: website.expectedScore,
    shouldDetectIssues: website.difficulty !== 'hard', // Hard might be clean
    focusAreas: website.focusAreas,
    minIssuesExpected: website.difficulty === 'nightmare' ? 3 : 
                       website.difficulty === 'expert' ? 2 : 
                       website.difficulty === 'extreme' ? 1 : 0,
    personas: website.personas || []
  };
}





