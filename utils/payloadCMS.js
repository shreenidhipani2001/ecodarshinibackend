// Payload CMS Integration Utility
const PAYLOAD_URL = process.env.PAYLOAD_CMS_URL || 'http://localhost:3001'
import pLimit from 'p-limit';

// Reduce concurrency to avoid rate limits
const limit = pLimit(3);

// In-memory cache for images (TTL: 10 minutes)
const imageCache = new Map();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Track in-flight requests to deduplicate
const pendingRequests = new Map();

// Get full image URL from CMS
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  if (imagePath.startsWith('http')) return imagePath
  return `${PAYLOAD_URL}${imagePath}`
}

// Check if cache entry is still valid
const isCacheValid = (entry) => {
  return entry && (Date.now() - entry.timestamp) < CACHE_TTL;
}

// Fetch single image by ID with caching
export const getImageById = async (imageId) => {
  try {
    // Skip invalid IDs
    if (!imageId || imageId.length !== 24) {
      return null
    }

    // Check cache first
    const cached = imageCache.get(imageId);
    if (isCacheValid(cached)) {
      return cached.data;
    }

    // Check if there's already a pending request for this image
    if (pendingRequests.has(imageId)) {
      return pendingRequests.get(imageId);
    }

    // Create the fetch promise
    const fetchPromise = (async () => {
      const res = await fetch(`${PAYLOAD_URL}/api/media/${imageId}?depth=1`);

      // Handle rate limiting
      if (res.status === 429) {
        console.warn(`Rate limited for image ${imageId}, will retry later`);
        return null;
      }

      if (!res.ok) {
        // Cache null for 404s to avoid repeated requests
        imageCache.set(imageId, { data: null, timestamp: Date.now() });
        return null;
      }

      const data = await res.json();
      const imageData = {
        id: data.id,
        url: getImageUrl(data.url),
        thumbnail: data.sizes?.thumbnail?.url ? getImageUrl(data.sizes.thumbnail.url) : null,
        card: data.sizes?.card?.url ? getImageUrl(data.sizes.card.url) : null,
        full: data.sizes?.full?.url ? getImageUrl(data.sizes.full.url) : null,
        alt: data.alt || '',
      };

      // Cache the result
      imageCache.set(imageId, { data: imageData, timestamp: Date.now() });
      return imageData;
    })();

    // Store pending request
    pendingRequests.set(imageId, fetchPromise);

    try {
      const result = await fetchPromise;
      return result;
    } finally {
      // Remove from pending after completion
      pendingRequests.delete(imageId);
    }
  } catch (err) {
    console.error(`Error fetching image ${imageId}:`, err.message);
    return null;
  }
}

// Fetch multiple images for a product with deduplication
export const getImagesForProduct = async (imageIds) => {
  if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) return []

  // Deduplicate image IDs
  const uniqueIds = [...new Set(imageIds)];

  const images = await Promise.all(
    uniqueIds.map(id => limit(() => getImageById(id)))
  )

  return images.filter(Boolean)
}

// Add images to product object
export const attachImagesToProduct = async (product) => {
  if (!product) return product

  const images = await getImagesForProduct(product.cms_image_ids)
  return {
    ...product,
    images,
  }
}

// Add images to multiple products (with batch deduplication)
export const attachImagesToProducts = async (products) => {
  if (!products || !Array.isArray(products)) return products

  // Collect all unique image IDs across all products
  const allImageIds = new Set();
  products.forEach(product => {
    if (product.cms_image_ids && Array.isArray(product.cms_image_ids)) {
      product.cms_image_ids.forEach(id => allImageIds.add(id));
    }
  });

  // Pre-fetch all unique images in parallel (with rate limiting)
  await Promise.all(
    [...allImageIds].map(id => limit(() => getImageById(id)))
  );

  // Now attach images to each product (will use cache)
  return Promise.all(
    products.map(product => attachImagesToProduct(product))
  )
}

// Clear cache (useful for testing or memory management)
export const clearImageCache = () => {
  imageCache.clear();
}
