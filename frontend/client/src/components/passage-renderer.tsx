import React from 'react';
import Latex from 'react-latex-next';

interface PassageRendererProps {
  content: string;
}

const imageUrlRegex = /(https?:\/\/[^\s,]+|\@assets\/[^\s,]+)/g;

const resolveImageUrl = (url: string) => {
  if (url.startsWith('@assets/')) {
    return url.replace('@assets/', '/attached_assets/');
  }
  return url;
};

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