/**
 * Centralized User-Facing Copy for NeuroNudge
 * Supports English ('en') and Hindi ('hi') text or expansion.
 */

export const COPY = {
  appName: 'NeuroNudge',
  tagline: 'A gentle, interactive early neurodivergence screening aid',

  nav: {
    start: 'Start Screening',
    history: 'Session History',
    about: 'How It Works',
    privacy: 'Privacy & Safety',
  },

  landing: {
    heroTitle: 'Gentle, early insights into learning and attention',
    heroSubtitle:
      'NeuroNudge is a calm, interactive screening companion designed to explore early indicators of ADHD, dyslexia, and autism. Quick, playful tasks in your browser—without clinical intimidation.',
    badgeText: 'Screening Aid · Non-Clinical · 100% On-Device Analysis',
    startCta: 'Begin Friendly Screening',
    howItWorksTitle: 'How NeuroNudge Works in 3 Gentle Steps',
    steps: [
      {
        number: '1',
        title: 'Check Your Camera & Setup',
        description:
          'A quick lighting check and 5-point calibration. The camera measures numeric gaze and movement in live memory—video is never recorded or stored.',
      },
      {
        number: '2',
        title: 'Explore Three Engaging Stages',
        description:
          'Take short, playful tasks: attention tracking with moving objects, friendly word & rhyme puzzles with optional audio, and illustrated social stories.',
      },
      {
        number: '3',
        title: 'Receive Your Private Report',
        description:
          'A local AI model (Gemma 4) compiles indicator patterns, strengths, and supportive recommendations for your family or healthcare provider.',
      },
    ],
    featuresTitle: 'Thoughtfully Designed for Comfort',
    features: [
      {
        title: 'Screening Aid, Never a Diagnosis',
        description:
          'NeuroNudge identifies early indicator levels (Low, Moderate, High) to guide conversation with certified psychologists or physicians.',
      },
      {
        title: 'Private & Local First',
        description:
          'No camera feeds or personal answers are sent to remote servers. All image processing and synthesis happen right on your computer.',
      },
      {
        title: 'Stress-Free & Self-Paced',
        description:
          'Large readable typography, optional spoken audio for questions, and pause-at-any-time controls ensure a safe, reassuring environment.',
      },
    ],
    disclaimerTitle: 'Important Scope & Safety Notice',
  },

  consent: {
    title: 'Consent & Privacy Commitment',
    subtitle: 'Please take a moment to review how we respect your privacy before we begin.',
    aiNotice:
      'The report is written by an AI model running on this computer. Your answers and camera measurements are not uploaded anywhere.',
    points: [
      {
        title: 'Camera Used Only for Numeric Measurements',
        desc: 'The webcam measures gaze coordinates, blink frequency, and natural movement in real-time. Video or photo files are never stored or exported.',
      },
      {
        title: 'On-Device Processing',
        desc: 'Everything runs on this device. Your data remains under your full control, and past session summaries can be deleted at any time.',
      },
      {
        title: 'Screening, Not a Diagnosis',
        desc: 'This assessment highlights early indicators and behavioral patterns. It is an informative starting point, not a diagnostic confirmation.',
      },
      {
        title: 'Pause or Stop Anytime',
        desc: 'If you or your child need a break, you can pause, skip questions, or close the assessment whenever you wish.',
      },
    ],
    generalConsentLabel:
      'I understand that this is a non-clinical screening aid and I agree to use the webcam for live numeric gaze and movement measurements.',
    guardianConsentLabel:
      'As a parent or legal guardian, I give permission for my child (under 18) to take this interactive screening.',
    continueButton: 'Agree & Set Up Profile',
    backButton: 'Back to Home',
  },

  profile: {
    title: 'Who is taking the screening?',
    subtitle: 'This helps us select age-appropriate questions and tailor the report language.',
    nicknameLabel: 'First Name or Nickname',
    nicknamePlaceholder: 'e.g. Leo or Maya',
    ageLabel: 'Age in Years',
    ageHelp: 'Questions and visual tasks are calibrated to age.',
    takerLabel: 'Who is answering the questions?',
    takerChild: 'Child / Young Learner',
    takerAdult: 'Adult / Self-Administered',
    languageLabel: 'Preferred Language',
    languageEn: 'English',
    languageHi: 'Hindi (हिंदी)',
    startCta: 'Continue to Camera Check',
  },

  cameraCheck: {
    title: 'Camera & Gaze Calibration',
    subtitle: 'Position yourself comfortably in front of your screen with good lighting.',
    lightingTip:
      'Tip: Soft natural light facing you works best. Avoid bright windows or lamps directly behind your head.',
    faceDetected: 'Face detected nicely',
    faceMissing: 'Looking for face...',
    lightingOk: 'Lighting is good',
    lightingLow: 'Lighting is a bit dim',
    lightingHigh: 'Lighting is very bright',
    startCalibrationCta: 'Start 5-Dot Calibration',
    calibratingTitle: 'Follow the glowing dots with your eyes',
    calibratingHelp: 'Keep your head steady and gently look at each colored dot for 1.5 seconds.',
    completedTitle: 'Calibration complete!',
    completedHelp: 'Your camera is ready. You can now proceed to the stage hub.',
    continueCta: 'Go to Stage Hub',
    retryCalibration: 'Recalibrate',
    skipNotice: 'Having camera trouble? You can still proceed; audio and puzzle answers will still be screened.',
    permissionDeniedTitle: 'Camera Access Needed',
    permissionDeniedMsg:
      'Please grant browser camera access to enable gaze and attention measurements. Your video is never saved.',
  },

  hub: {
    title: 'Screening Stage Hub',
    subtitle: 'Complete each gentle stage at your own pace. You can take them in order or resume anytime.',
    llmOfflineNotice:
      'The local report model is not running. You can still take the assessment; the report will use a simpler format.',
    allDoneTitle: 'All 3 Stages Completed!',
    allDoneSubtitle: 'Your responses and attention measurements are ready for report synthesis.',
    generateCta: 'Generate Screening Report',
    resumeCta: 'Continue Stage',
    startStageCta: 'Begin Stage',
    stageCompletedBadge: 'Completed',
    stagePendingBadge: 'Not Started',
    stageRunningBadge: 'In Progress',
  },

  adhd: {
    title: 'Stage 1: Attention & Focus',
    subtitle: 'Watch brief visuals and tap when you spot the golden star.',
    cameraActive: 'Camera active · Analyzing focus metrics live',
    pauseButton: 'Pause Assessment',
    resumeButton: 'Resume',
    stopButton: 'Finish Early',
    starTaskPrompt: 'Whenever the golden star appears, click it or press Spacebar as quickly as you can!',
    reactionTimeLabel: 'Reaction Time',
    blocks: [
      { id: 'adhd_intro', title: 'Calm Breathing & Focus', duration: 15 },
      { id: 'adhd_color_flow', title: 'Colorful Motion', duration: 25 },
      { id: 'adhd_calm_scene', title: 'Gentle Forest Breeze', duration: 25 },
      { id: 'adhd_target_game', title: 'Find the Moving Object', duration: 25 },
      { id: 'adhd_fast_cut', title: 'Dynamic Shapes & Rhythm', duration: 20 },
      { id: 'adhd_star_task', title: 'Sustained Star Attention', duration: 30 },
      { id: 'adhd_floating_focus', title: 'Floating Bubbles', duration: 20 },
    ],
  },

  dyslexia: {
    title: 'Stage 2: Reading & Phonology',
    subtitle: 'Word puzzles, sound matching, and letter sequences. No rush—take all the time you need.',
    listenAudio: 'Listen to Question',
    listeningAudio: 'Playing audio...',
    questionCounter: 'Question {current} of {total}',
    noTimerNote: 'Take your time. There is no countdown or time penalty.',
    nextQuestion: 'Next Question',
    finishStage: 'Finish Reading Stage',
  },

  autism: {
    title: 'Stage 3: Social Communication',
    subtitle: 'Part A explores social scenarios. Part B features a friendly animated conversation.',
    partAHeader: 'Part A: Social Situations & Perspectives',
    partBHeader: 'Part B: Story Listening & Eye Engagement',
    partBIntroTitle: 'Meet Buddy the Storyteller',
    partBIntroDesc:
      'Buddy is going to share a short friendly story with you (60 seconds), followed by a calm waiting screen (60 seconds). Just relax and watch Buddy.',
    startPartBCta: 'Start Animated Segment',
    buddySpeaking: 'Buddy is talking...',
    buddyWaiting: 'Relaxing pause... take a gentle breath.',
    finishStage: 'Finish Social Stage',
  },

  processing: {
    title: 'Compiling Your Screening Report',
    subtitle: 'Our local AI model (Gemma 4) is carefully reviewing your measurements right here on your computer.',
    rotatingMessages: [
      'Looking at attention patterns and gaze stability...',
      'Analyzing phonological response timings and hesitation patterns...',
      'Reviewing social communication reflections...',
      'Synthesizing indicator levels and supportive observations...',
      'Crafting personalized recommendations for educators and caregivers...',
      'Polishing your private summary report...',
    ],
    localNote: 'The report is being written on this computer. Nothing is uploaded.',
    timeoutWarning:
      'The local model is taking longer than usual (up to 2 minutes). We are still waiting for completion.',
    errorTitle: 'Report Generation Timed Out',
    errorDesc:
      'The local AI model did not respond within 150 seconds. You can retry generating with the local model or view an immediate template report.',
    retryCta: 'Retry Local Model',
    fallbackCta: 'Generate Template Report Now',
  },

  report: {
    title: 'Early Neurodivergence Screening Report',
    subtitle: 'Confidential summary of indicator patterns and suggested next steps.',
    printButton: 'Print / Save as PDF',
    newSessionButton: 'Start New Session',
    historyButton: 'View Past Sessions',
    summaryHeading: 'Executive Summary',
    radarHeading: 'Overall Indicator Overview',
    conditionsHeading: 'Stage-by-Stage Indicator Breakdown',
    rankingHeading: 'Indicator Likelihood Summary',
    recommendationsHeading: 'Supportive Recommendations',
    confidenceHeading: 'Confidence & Evaluation Quality',
    levels: {
      low: 'Low Indicators',
      moderate: 'Moderate Indicators',
      high: 'High Indicators',
    },
    generatedBy: {
      'gemma-4': 'Written locally by Gemma 4',
      gemini: 'Written by Gemini',
      fallback: 'Simple template report (AI unavailable)',
    },
    symptomsLabel: 'Observed Behavioral Signals',
    evidenceLabel: 'Measurement Evidence',
  },

  history: {
    title: 'Saved Local Sessions',
    subtitle: 'All screening summaries stored on this computer. You can open any report or wipe all records.',
    emptyTitle: 'No Past Sessions Found',
    emptySubtitle: 'Complete an interactive screening to view saved reports here.',
    deleteSingle: 'Delete',
    deleteAll: 'Delete All My Data',
    confirmDeleteAllTitle: 'Delete All Local Screening Data?',
    confirmDeleteAllMsg:
      'This will permanently erase all local session records and reports from this device. This action cannot be undone.',
    confirmDeleteButton: 'Yes, Erase Everything',
    cancelButton: 'Cancel',
    openReport: 'View Report',
    noReportYet: 'Incomplete Session',
  },

  pauseOverlay: {
    title: 'Assessment Paused',
    cameraLost: 'We lost sight of your face for a moment. Please adjust your position or lighting to resume.',
    manualPause: 'You have paused the assessment. Take a moment to relax.',
    resumeCta: 'Resume When Ready',
    recheckCta: 'Check Camera Position',
  },

  notFound: {
    title: 'Page Not Found',
    subtitle: 'The screening page you are looking for does not exist.',
    returnHome: 'Return to NeuroNudge Home',
  },
};
