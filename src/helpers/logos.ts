/**
 * Brand logos shipped in `public/logos`, so they land in the build output (and
 * therefore in the template assets of the dist zip) at stable, unhashed paths.
 *
 * BASE_URL keeps them correct under the Portal Page base path — `/p/<name>/` in
 * a build, `/pl/<name>/` under pp-dev — so the same code works in both.
 */
const asset = (file: string) => `${import.meta.env.BASE_URL}logos/${file}`;

export const LOGOS = {
  /** Full lockup, white — for the dark hero banner. */
  whiteFull: asset('truist-logo-white-full.svg'),
  /** Square mark, white — for dark surfaces. */
  whiteMark: asset('truist-logo-white-mark.svg'),
  /** Full lockup, Truist Purple — for light surfaces. */
  purpleFull: asset('truist-logo-purple.svg'),
  /** Square mark, Truist Purple — for the 72px sidebar rail. */
  purpleMark: asset('truist-logo-purple-mark.svg'),
} as const;
