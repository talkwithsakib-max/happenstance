import type { ImageMetadata } from 'astro';
import garry from '../assets/testimonials/garry-tan.png';
import daniel from '../assets/testimonials/sample-daniel.png';
import nora from '../assets/testimonials/sample-nora.png';
import lucas from '../assets/testimonials/sample-lucas.png';
import owen from '../assets/testimonials/sample-owen.png';

export interface Testimonial {
  name: string;
  photo: ImageMetadata;
  /** Headline shown above the quote; the `accent` part renders in slate. */
  headline?: { lead: string; accent: string };
  quote?: string;
  role?: string;
  /**
   * Illustrative sample: a fictional person (AI-generated portrait, made-up name and quote).
   * The section labels these as samples. Swap in real customers' words and photos when available.
   */
  sample?: boolean;
}

// Order matches the Figma stage from left to right. Garry Tan's quote is real; the rest are samples.
export const testimonials: Testimonial[] = [
  {
    name: 'Daniel Reyes',
    photo: daniel,
    sample: true,
    headline: { lead: 'Warm intros,', accent: 'without the spreadsheet' },
    quote: '“I used to keep a spreadsheet of who knew who. Now I just ask Happenstance, and the warmest intro is right there.”',
    role: 'Product Engineer',
  },
  {
    name: 'Nora Whitfield',
    photo: nora,
    sample: true,
    headline: { lead: 'The right person,', accent: 'in minutes' },
    quote: '“I found three people who could introduce me to the team I wanted, faster than I could write a cold email.”',
    role: 'Seed Investor',
  },
  {
    name: 'Garry Tan',
    photo: garry,
    headline: { lead: 'The best social network search,', accent: 'according to YC' },
    quote: '“Happenstance is by far the best social network search I have ever seen.”',
    role: 'President & CEO, Y Combinator',
  },
  {
    name: 'Lucas Bennett',
    photo: lucas,
    sample: true,
    headline: { lead: 'My network,', accent: 'finally searchable' },
    quote: '“It surfaced people I’d forgotten I even knew. That’s exactly who you want vouching for you.”',
    role: 'Startup Founder',
  },
  {
    name: 'Owen Fletcher',
    photo: owen,
    sample: true,
    headline: { lead: 'The first search', accent: 'I run every morning' },
    quote: '“Before any meeting, I check who we know in common. It changes the whole conversation.”',
    role: 'Head of Operations',
  },
];

/** Index of the testimonial that is centred on load (Garry Tan, as in Figma). */
export const initialTestimonial = 2;
