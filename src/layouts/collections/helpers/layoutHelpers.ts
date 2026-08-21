// src/layouts/collections/helpers/layoutHelpers.ts
/**
 * Layout Helper Functions
 * 
 * Utility functions for extracting data from collection entries
 * in a consistent way across different layout components.
 * 
 * Handles various data formats and provides safe defaults.
 */

/**
 * Resolve author name from various author formats
 * 
 * Author can be:
 * - String: 'Jane Doe'
 * - Object with name: { name: 'Jane Doe' }
 * - Object with title: { title: 'Jane Doe' }
 * - Object with id: { id: 'jane-doe' }
 * 
 * @param author - Author in any supported format
 * @returns Author display name or empty string
 */
export function getAuthorName(author: any): string {
  if (!author) return '';
  if (typeof author === 'string') return author;
  if (author.name) return author.name;
  if (author.title) return author.title;
  if (author.id) return author.id;
  return '';
}

/**
 * Extract image URL from various image formats
 * 
 * Image can be:
 * - String: '/images/photo.jpg' or '@/assets/photo.jpg'
 * - Object with src: { src: '/images/photo.jpg' }
 * - Nested object: { src: { src: '/images/photo.jpg' } }
 * 
 * @param image - Image in any supported format
 * @returns Image URL string or empty string
 */
export function getImageSrc(image: any): string {
  if (!image) return '';
  
  // Direct string path
  if (typeof image === 'string') {
    // Convert Astro alias to relative path
    if (image.startsWith('@/')) {
      return image.replace('@/', '/src/');
    }
    return image;
  }
  
  // Object with src property
  if (image.src) {
    // String src
    if (typeof image.src === 'string') return image.src;
    // Nested src object
    if (image.src.src) return image.src.src;
    return image.src;
  }
  
  return '';
}