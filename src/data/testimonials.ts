import type { ImageMetadata } from 'astro';
import adam from '../assets/testimonials/adam-novak.png';
import olivia from '../assets/testimonials/olivia-moore.png';
import garry from '../assets/testimonials/garry-tan.png';
import marc from '../assets/testimonials/marc-hamel.png';
import yann from '../assets/testimonials/yann-sarfati.png';

export interface Testimonial {
  name: string;
  photo: ImageMetadata;
  /** Headline shown above the quote; the `accent` part renders in slate. */
  headline?: { lead: string; accent: string };
  quote?: string;
  role?: string;
  /**
   * Placeholder copy for layout review. These are real people, so their draft quotes
   * only render in the dev server and are stripped from production builds.
   * Replace with their actual words (and remove `draft`) before publishing.
   */
  draft?: boolean;
}

// Order matches the Figma stage from left to right. Only Garry Tan's copy comes from Figma.
const entries: Testimonial[] = [
  {
    name: 'Adam Novak',
    photo: adam,
    draft: true,
    headline: { lead: 'Warm intros,', accent: 'without the spreadsheet' },
    quote: '“I used to keep a spreadsheet of who knew who. Now I just ask Happenstance, and the warmest intro is right there.”',
  },
  {
    name: 'Olivia Moore',
    photo: olivia,
    draft: true,
    headline: { lead: 'The right person,', accent: 'in minutes' },
    quote: '“I found three people who could introduce me to the team I wanted, faster than I could write a cold email.”',
  },
  {
    name: 'Garry Tan',
    photo: garry,
    headline: { lead: 'The best social network search,', accent: 'according to YC' },
    quote: '“Happenstance is by far the best social network search I have ever seen.”',
    role: 'President & CEO, Y Combinator',
  },
  {
    name: 'Marc Hamel',
    photo: marc,
    draft: true,
    headline: { lead: 'My network,', accent: 'finally searchable' },
    quote: '“It surfaced people I’d forgotten I even knew. That’s exactly who you want vouching for you.”',
  },
  {
    name: 'Yann Sarfati',
    photo: yann,
    draft: true,
    headline: { lead: 'The first search', accent: 'I run every morning' },
    quote: '“Before any meeting, I check who we know in common. It changes the whole conversation.”',
  },
];

// Production builds keep only the name and photo for draft entries.
export const testimonials: Testimonial[] = entries.map((t) =>
  t.draft && !import.meta.env.DEV ? { name: t.name, photo: t.photo } : t,
);

/** Index of the testimonial that is centred on load (Garry Tan, as in Figma). */
export const initialTestimonial = 2;
