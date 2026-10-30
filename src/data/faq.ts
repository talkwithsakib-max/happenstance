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
  /** Only answers that exist in the Figma design are filled in. */
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
      { number: 1, question: 'What is Happenstance?' },
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
      { number: 3, question: 'What networks can I connect?' },
    ],
  },
  {
    label: 'Growing your reach',
    questions: [
      { number: 4, question: 'What are friends?' },
      { number: 5, question: 'What are groups?' },
      { number: 6, question: 'Does Happenstance have an iPhone app?' },
      { number: 7, question: 'Does Happenstance have an API or integrations?' },
    ],
  },
  {
    label: 'Trust and pricing',
    questions: [
      { number: 8, question: 'Is Happenstance free?' },
      { number: 9, question: 'Is my data secure?' },
      { number: 10, question: 'Is Happenstance SOC 2 compliant?' },
      { number: 11, question: 'Is Happenstance affiliated with third-party services?' },
    ],
  },
];

export const allQuestions = faqGroups.flatMap((group) => group.questions);

/** The question selected on load (matches the Figma state). */
export const initialQuestion = 2;
