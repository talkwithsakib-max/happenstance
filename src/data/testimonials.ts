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
}

// Order matches the Figma stage from left to right. Only Garry Tan's copy exists in the
// design; the other entries carry just the name and photo until their copy is supplied.
export const testimonials: Testimonial[] = [
  { name: 'Adam Novak', photo: adam },
  { name: 'Olivia Moore', photo: olivia },
  {
    name: 'Garry Tan',
    photo: garry,
    headline: { lead: 'The best social network search,', accent: 'according to YC' },
    quote: '“Happenstance is by far the best social network search I have ever seen.”',
    role: 'President & CEO, Y Combinator',
  },
  { name: 'Marc Hamel', photo: marc },
  { name: 'Yann Sarfati', photo: yann },
];

/** Index of the testimonial that is centred on load (Garry Tan, as in Figma). */
export const initialTestimonial = 2;
