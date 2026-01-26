// Payload CMS Integration Utility
const PAYLOAD_URL = process.env.PAYLOAD_CMS_URL || 'http://localhost:3001'

// Get full image URL from CMS
export const getImageUrl = (imagePath) => {
  if (!imagePath) return null
  // If path already starts with http, return as-is
  if (imagePath.startsWith('http')) return imagePath
  // Otherwise prepend the base URL
  return `${PAYLOAD_URL}${imagePath}`
}

// Fetch single image by ID
export const getImageById = async (imageId) => {
  try {
    // Skip invalid/placeholder IDs (real MongoDB IDs are 24 characters)
    if (!imageId || imageId.length !== 24) {
      return null
    }

    const res = await fetch(`${PAYLOAD_URL}/api/media/${imageId}?depth=1`)
    if (!res.ok) {
      console.log(`Image ${imageId} not found in CMS`)
      return null
    }

    const data = await res.json()
    console.log(`Fetched image ${imageId} from CMS`)
    return {
      id: data.id,
      url: getImageUrl(data.url),
      thumbnail: data.sizes?.thumbnail?.url ? getImageUrl(data.sizes.thumbnail.url) : null,
      card: data.sizes?.card?.url ? getImageUrl(data.sizes.card.url) : null,
      full: data.sizes?.full?.url ? getImageUrl(data.sizes.full.url) : null,
      alt: data.alt || '',
    }
  } catch (err) {
    console.error(`Error fetching image ${imageId}:`, err.message)
    return null
  }
}

// Fetch multiple images for a product
export const getImagesForProduct = async (imageIds) => {
  if (!imageIds || !Array.isArray(imageIds) || imageIds.length === 0) {
    return []
  }

  const images = await Promise.all(
    imageIds.map(id => getImageById(id))
  )

  return images.filter(Boolean) // Remove nulls
}

// Add images to product object
export const attachImagesToProduct = async (product) => {
  if (!product) return product

  const images = await getImagesForProduct(product.cms_image_ids)
  return {
    ...product,
    images, // Full image objects with URLs
  }
}

// Add images to multiple products
export const attachImagesToProducts = async (products) => {
  if (!products || !Array.isArray(products)) return products

  return Promise.all(
    products.map(product => attachImagesToProduct(product))
  )
}
