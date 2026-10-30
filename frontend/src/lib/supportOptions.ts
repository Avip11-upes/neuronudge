// General, commonly used support approaches for each screening area.
// NOT medical advice. Content must be reviewed by a qualified professional
// before real-world use (see Project Report, section 15).
// Reviewed by: TODO

export type SupportCondition = 'adhd' | 'dyslexia' | 'autism';

export interface SupportOption {
  title: string;
  detail: string;
}

export interface SupportInfo {
  name: string;
  whoToSee: string[];
  options: SupportOption[];
  everyday: string[];
  watchOut: string;
}

export const SUPPORT_INFO: Record<SupportCondition, SupportInfo> = {
  adhd: {
    name: 'Attention & activity (ADHD indicators)',
    whoToSee: [
      'Paediatrician or family doctor (a good first stop)',
      'Child and adolescent psychiatrist or clinical psychologist',
      'For adults: a psychiatrist or psychologist experienced in adult ADHD',
    ],
    options: [
      {
        title: 'Behaviour therapy and parent training',
        detail:
          'Teaches parents and teachers practical ways to reward focus, set clear routines and reduce conflict. It is usually the first approach for younger children.',
      },
      {
        title: 'Medication (doctor-led only)',
        detail:
          'After a full assessment, a doctor may suggest medication for some people. The type and dose must be set and monitored by a doctor, and never started or changed at home.',
      },
      {
        title: 'Skills coaching and CBT',
        detail:
          'For teenagers and adults: coaching on planning, time management and handling impulsive reactions.',
      },
      {
        title: 'School or workplace adjustments',
        detail:
          'Seating near the teacher, tasks split into short chunks, extra time and regular movement breaks.',
      },
    ],
    everyday: [
      'Keep a predictable daily routine, with a regular sleep schedule.',
      'Break tasks into small steps and use checklists or visual timers.',
      'Give instructions one at a time and praise effort straight away.',
      'Build in regular physical activity.',
    ],
    watchOut:
      'Be cautious about supplements, "brain training" apps or special diets that promise to cure ADHD. They are not a substitute for assessment and proven support.',
  },

  dyslexia: {
    name: 'Reading & phonology (dyslexia indicators)',
    whoToSee: [
      'Class teacher or school special-needs coordinator',
      'Educational psychologist (for a formal assessment)',
      'An eye and hearing check, to rule out other causes of reading difficulty',
    ],
    options: [
      {
        title: 'Structured literacy teaching',
        detail:
          'Step-by-step, phonics-based and multisensory teaching of sounds, letters and spelling by a trained specialist. Starting early gives the best results.',
      },
      {
        title: 'Regular short practice',
        detail:
          'Short daily reading sessions at school and at home are easier to keep up than long, occasional ones.',
      },
      {
        title: 'Assistive technology',
        detail:
          'Text-to-speech, audiobooks, spell-checkers, and dyslexia-friendly fonts and spacing.',
      },
      {
        title: 'Classroom and exam accommodations',
        detail:
          'Extra time, a reader or scribe, and instructions given both aloud and in writing.',
      },
    ],
    everyday: [
      'Read aloud together and talk about the stories.',
      'Praise effort and strengths outside reading. Dyslexia is not linked to intelligence.',
      'Play rhyming and sound games to build phonological skills.',
    ],
    watchOut:
      'Coloured lenses, eye-training exercises and similar products that promise to cure dyslexia are not supported by good evidence. Medication is not a treatment for dyslexia.',
  },

  autism: {
    name: 'Social communication (autism indicators)',
    whoToSee: [
      'Paediatrician or family doctor (a good first stop)',
      'Developmental paediatrician, child psychiatrist or clinical psychologist for a full evaluation',
      'Speech-language and occupational therapists',
    ],
    options: [
      {
        title: 'Early intervention programmes',
        detail:
          'Play-based, family-centred programmes that build communication and social skills. Earlier support tends to help more, but support is valuable at any age.',
      },
      {
        title: 'Speech-language therapy',
        detail:
          'Helps with spoken language, understanding social cues and, where needed, other ways of communicating.',
      },
      {
        title: 'Occupational therapy',
        detail:
          'Supports daily-living skills and sensory needs, such as sensitivity to noise, light or touch.',
      },
      {
        title: 'Social skills groups and parent coaching',
        detail:
          'Practise conversation, turn-taking and friendships in a supported setting, while parents learn strategies to use at home.',
      },
      {
        title: 'Support for related needs',
        detail:
          'Anxiety, sleep problems or attention difficulties often appear alongside autism, and a doctor can advise on treating those. Medication does not treat autism itself.',
      },
    ],
    everyday: [
      'Use predictable routines and visual schedules.',
      'Give clear, literal instructions and warn about changes in advance.',
      'Provide a quiet space for sensory breaks.',
      'Build on the person\u2019s special interests and strengths.',
    ],
    watchOut:
      'Be very cautious about anyone who offers to cure autism. Treatments such as chelation, "miracle" bleach products or restrictive diets with no medical need are unproven and can be dangerous.',
  },
};