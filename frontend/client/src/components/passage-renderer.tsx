import React from 'react';
import Latex from 'react-latex-next';

/**
 * @interface PassageRendererProps
 * @property {string} content - The string content to be rendered, which may contain text, LaTeX, and image URLs.
 */
interface PassageRendererProps {
  content: string;
}

const imageUrlRegex = /(https?:\/\/[^\s,]+|\@assets\/[^\s,]+)/g;

/**
 * Resolves local asset paths to their public URLs.
 *
 * This function checks if a URL is a local asset path (starting with '@assets/')
 * and converts it to the corresponding public path.
 *
 * @param {string} url - The image URL to resolve.
 * @returns {string} The resolved, public-facing image URL.
 */
const resolveImageUrl = (url: string) => {
  if (url.startsWith('@assets/')) {
    return url.replace('@assets/', '/attached_assets/');
  }
  return url;
};

/**
 * Renders content that may include text, LaTeX, and image URLs.
 *
 * This component parses a string to distinguish between regular text (which is
 * processed for LaTeX) and image URLs. It then renders the text and displays
* the images accordingly.
 *
 * @param {PassageRendererProps} props - The props for the component.
 * @returns {JSX.Element} The rendered content with formatted text and images.
 */
export function PassageRenderer({ content }: PassageRendererProps) {
  const parts = content.split(imageUrlRegex).filter(Boolean);

  return (
    <div className="prose max-w-none text-foreground leading-relaxed preserve-whitespace">
      {parts.map((part, index) => {
        if (part.match(imageUrlRegex)) {
          const imageUrls = part.split(',');
          return (
            <span key={index} className="flex flex-wrap gap-2">
              {imageUrls.map((url, i) => (
                <img key={i} src={resolveImageUrl(url.trim())} alt={`Passage image`} className="max-w-full h-auto rounded-lg" />
              ))}
            </span>
          );
        } else {
          return <Latex key={index}>{part}</Latex>;
        }
      })}
    </div>
  );
}