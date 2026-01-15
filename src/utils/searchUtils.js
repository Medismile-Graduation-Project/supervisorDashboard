/**
 * Search Utilities for IR (Information Retrieval) System
 * Provides highlighting and formatting functions for search results
 */

/**
 * Highlights matched text in search results
 * @param {string} text - The text to highlight
 * @param {string} query - The search query
 * @returns {Array} Array of text parts with highlighted matches
 */
export const highlightText = (text, query) => {
  if (!text || !query) return [{ text: text?.toString() || '', isMatch: false }];
  
  const textStr = text.toString();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);
  
  // Escape special regex characters
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Create regex pattern for all query words
  const pattern = queryWords.map(word => escapeRegex(word)).join('|');
  const regex = new RegExp(`(${pattern})`, 'gi');
  
  const parts = [];
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(textStr)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push({
        text: textStr.substring(lastIndex, match.index),
        isMatch: false,
      });
    }
    
    // Add matched text
    parts.push({
      text: match[0],
      isMatch: true,
    });
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < textStr.length) {
    parts.push({
      text: textStr.substring(lastIndex),
      isMatch: false,
    });
  }
  
  return parts.length > 0 ? parts : [{ text: textStr, isMatch: false }];
};

/**
 * Highlights matched text and returns JSX-ready array
 * @param {string} text - The text to highlight
 * @param {string} query - The search query
 * @returns {Array} Array of objects with text and isMatch flag
 */
export const highlightMatches = (text, query) => {
  return highlightText(text, query);
};

/**
 * Truncates text with ellipsis while preserving highlighted matches
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} query - Search query for highlighting
 * @returns {Array} Array of highlighted parts
 */
export const truncateAndHighlight = (text, maxLength, query) => {
  if (!text) return [];
  
  const textStr = text.toString();
  const truncated = textStr.length > maxLength 
    ? textStr.substring(0, maxLength) + '...' 
    : textStr;
  
  return highlightMatches(truncated, query);
};

