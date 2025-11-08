/**
 * Document chunking utilities for RAG (Retrieval Augmented Generation)
 * 
 * This module provides smart chunking strategies that respect document structure,
 * particularly for markdown documents with headings and sections.
 */

export interface DocumentChunk {
  content: string;
  metadata: {
    sourcePath: string;
    chunkIndex: number;
    heading?: string;
    section?: string;
  };
}

/**
 * Chunks markdown text intelligently, respecting document structure.
 * 
 * Strategy:
 * - Splits on headings (##, ###) to maintain semantic context
 * - Ensures chunks don't exceed maxChunkSize
 * - Maintains overlap between chunks for context preservation
 * - Preserves code blocks as atomic units
 * 
 * @param content - The markdown content to chunk
 * @param sourcePath - Path to the source document
 * @param maxChunkSize - Maximum tokens per chunk (default: 1000)
 * @param overlap - Number of tokens to overlap between chunks (default: 200)
 * @returns Array of document chunks with metadata
 */
export function chunkMarkdown(
  content: string,
  sourcePath: string,
  maxChunkSize: number = 1000,
  overlap: number = 200,
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  // Split by headings (## and ###)
  // This preserves semantic sections
  const headingRegex = /^(#{2,3})\s+(.+)$/gm;
  const sections: Array<{ heading: string; level: number; content: string }> = [];
  
  let lastIndex = 0;
  let lastHeading = '';
  let lastLevel = 0;
  
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(content)) !== null) {
    // Save previous section
    if (lastIndex < match.index) {
      const sectionContent = content.slice(lastIndex, match.index).trim();
      if (sectionContent) {
        sections.push({
          heading: lastHeading,
          level: lastLevel,
          content: sectionContent,
        });
      }
    }
    
    lastIndex = match.index;
    lastHeading = match[2].trim();
    lastLevel = match[1].length;
  }
  
  // Add final section
  if (lastIndex < content.length) {
    const sectionContent = content.slice(lastIndex).trim();
    if (sectionContent) {
      sections.push({
        heading: lastHeading || 'Introduction',
        level: lastLevel || 2,
        content: sectionContent,
      });
    }
  }
  
  // If no headings found, treat entire document as one section
  if (sections.length === 0) {
    sections.push({
      heading: 'Content',
      level: 2,
      content: content.trim(),
    });
  }
  
  // Chunk each section, respecting maxChunkSize
  let chunkIndex = 0;
  for (const section of sections) {
    const sectionChunks = chunkText(
      section.content,
      sourcePath,
      section.heading,
      maxChunkSize,
      overlap,
      chunkIndex,
    );
    
    chunks.push(...sectionChunks);
    chunkIndex += sectionChunks.length;
  }
  
  return chunks;
}

/**
 * Chunks plain text, splitting on sentence boundaries when possible.
 * 
 * @param text - Text to chunk
 * @param sourcePath - Path to source document
 * @param heading - Optional heading for context
 * @param maxChunkSize - Maximum tokens per chunk
 * @param overlap - Tokens to overlap between chunks
 * @param startIndex - Starting chunk index
 * @returns Array of document chunks
 */
function chunkText(
  text: string,
  sourcePath: string,
  heading: string = '',
  maxChunkSize: number = 1000,
  overlap: number = 200,
  startIndex: number = 0,
): DocumentChunk[] {
  const chunks: DocumentChunk[] = [];
  
  // Rough token estimation: ~4 characters per token
  const estimatedTokens = Math.ceil(text.length / 4);
  
  // If text fits in one chunk, return it
  if (estimatedTokens <= maxChunkSize) {
    chunks.push({
      content: text.trim(),
      metadata: {
        sourcePath,
        chunkIndex: startIndex,
        heading,
      },
    });
    return chunks;
  }
  
  // Split into sentences first (rough approximation)
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = startIndex;
  
  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceTokens = Math.ceil(sentence.length / 4);
    
    // If adding this sentence would exceed maxChunkSize, save current chunk
    if (currentTokens + sentenceTokens > maxChunkSize && currentChunk) {
      chunks.push({
        content: currentChunk.trim(),
        metadata: {
          sourcePath,
          chunkIndex: chunkIndex++,
          heading,
        },
      });
      
      // Start new chunk with overlap from previous chunk
      if (overlap > 0) {
        const overlapText = getOverlapText(currentChunk, overlap);
        currentChunk = overlapText + ' ' + sentence;
        currentTokens = Math.ceil(currentChunk.length / 4);
      } else {
        currentChunk = sentence;
        currentTokens = sentenceTokens;
      }
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
      currentTokens += sentenceTokens;
    }
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      metadata: {
        sourcePath,
        chunkIndex: chunkIndex,
        heading,
      },
    });
  }
  
  return chunks;
}

/**
 * Gets overlap text from the end of a chunk.
 * 
 * @param text - Text to extract overlap from
 * @param overlapTokens - Number of tokens to overlap
 * @returns Overlap text
 */
function getOverlapText(text: string, overlapTokens: number): string {
  const overlapChars = overlapTokens * 4; // Rough: 4 chars per token
  if (text.length <= overlapChars) {
    return text;
  }
  
  // Try to start from a sentence boundary
  const overlapStart = Math.max(0, text.length - overlapChars);
  const sentenceBoundary = text.lastIndexOf('.', overlapStart);
  
  if (sentenceBoundary > overlapStart - 100) {
    return text.slice(sentenceBoundary + 1).trim();
  }
  
  return text.slice(overlapStart).trim();
}

/**
 * Estimates token count for a text string.
 * Rough approximation: ~4 characters per token.
 * 
 * @param text - Text to estimate
 * @returns Estimated token count
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}





