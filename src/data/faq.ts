import type { ImageMetadata } from 'astro';
import sarahLin from '../assets/faq/sarah-lin.png';
import emma from '../assets/faq/emma.png';
import rahul from '../assets/faq/rahul-mehta.png';
import omar from '../assets/faq/omar.png';

export interface ExampleResult {
  name: string;
  detail: string;
  photo: ImageMetadata;
  via: string;
  viaPhoto: ImageMetadata;
}

export interface Answer {
  text: string;
  example?: { query: string; results: ExampleResult[] };
  /** Follow-up questions, by question number. */
  askNext?: number[];
}

export interface Question {
  number: number;
  question: string;
  /** Question 2 comes from Figma; the others are written from the page's own content. */
  answer?: Answer;
}

export interface QuestionGroup {
  label: string;
  questions: Question[];
}

export const faqGroups: QuestionGroup[] = [
  {
    label: 'The basics',
    questions: [
      {
        number: 1,
        question: 'What is Happenstance?',
        answer: {
          text: 'Happenstance is an AI search engine for the network you actually have. Connect your accounts, describe who you’re looking for in plain English, and it finds the people you know, plus the warmest path to the ones you don’t.',
          askNext: [2, 3],
        },
      },
      {
        number: 2,
        question: 'How does the search work?',
        answer: {
          text: 'Just type a natural language query like “fintech PMs in NYC” or paste a job description. Our AI reads your intent, searches every network you’ve connected, and ranks results with trait scores and the mutual connections who can introduce you.',
          example: {
            query: 'fintech PMs in NYC',
            results: [
              { name: 'Sarah Lin', detail: 'Product Manager · Ramp', photo: sarahLin, via: 'via Emma', viaPhoto: emma },
              { name: 'Rahul Mehta', detail: 'Senior PM · Plaid', photo: rahul, via: 'via Omar', viaPhoto: omar },
            ],
          },
          askNext: [3, 9, 8],
        },
      },
      {
        number: 3,
        question: 'What networks can I connect?',
        answer: {
          text: 'Gmail, Google Calendar, LinkedIn, X and Outlook. Happenstance looks at who you’ve emailed, met and followed, so people you never added on LinkedIn still show up in your results.',
          askNext: [4, 9],
        },
      },
    ],
  },
  {
    label: 'Growing your reach',
    questions: [
      {
        number: 4,
        question: 'What are friends?',
        answer: {
          text: 'Friends are people you invite to Happenstance. Once they join, their connections become searchable too, so you can find someone two hops away and ask your friend for the intro.',
          askNext: [5, 9],
        },
      },
      {
        number: 5,
        question: 'What are groups?',
        answer: {
          text: 'Groups bring together a community you’re already part of, like your alumni network or YC batch. Members’ connections become searchable across the group, so the whole community can find warm paths for each other.',
          askNext: [4, 9],
        },
      },
      {
        number: 6,
        question: 'Does Happenstance have an iPhone app?',
        answer: {
          text: 'Yes. The Happenstance iPhone app lets you search your network and see warm paths wherever you are, including right before a meeting.',
          askNext: [7, 8],
        },
      },
      {
        number: 7,
        question: 'Does Happenstance have an API or integrations?',
        answer: {
          text: 'Yes. Add the MCP server to search your network from ChatGPT and Claude, query the same relationship graph over the REST API, or run searches from your terminal with the CLI. It also works with Claude Code and OpenClaw.',
          askNext: [9, 10],
        },
      },
    ],
  },
  {
    label: 'Trust and pricing',
    questions: [
      {
        number: 8,
        question: 'Is Happenstance free?',
        // Needs review: the design only shows "Search for free" and a Pricing link; confirm plan details.
        answer: {
          text: 'You can start searching for free. Sign up, connect your accounts and run your first searches at no cost. See the Pricing page for plan details.',
          askNext: [9, 1],
        },
      },
      {
        number: 9,
        question: 'Is my data secure?',
        answer: {
          text: 'Yes. You control what you share. Your public profile shows a constellation of named people you know by default, which you can turn off anytime, and your data is never used to train AI models.',
          askNext: [10, 11],
        },
      },
      {
        number: 10,
        question: 'Is Happenstance SOC 2 compliant?',
        answer: {
          text: 'Yes. Happenstance is SOC 2 compliant, with independently audited controls, and is listed at DTI Trust Level 2 in the DTI trust registry.',
          askNext: [9, 11],
        },
      },
      {
        number: 11,
        question: 'Is Happenstance affiliated with third-party services?',
        // Needs review: the design doesn't state this; confirm before publishing.
        answer: {
          text: 'No. Happenstance connects to services like Gmail, LinkedIn, ChatGPT and Claude so you can search your network, but it isn’t affiliated with or endorsed by those companies.',
          askNext: [9, 10],
        },
      },
    ],
  },
];

export const allQuestions = faqGroups.flatMap((group) => group.questions);

/** The question selected on load (matches the Figma state). */
export const initialQuestion = 2;
