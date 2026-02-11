function prepare_url(url) {
    // Handle URL input if provided
        if (url.value.trim()) {
            url = url.value.trim()
        }
        // Process nimble.nexus URLs
        if (url.includes('nimble.nexus')) {
            const afterNexus = url.split('nimble.nexus')[1]
            
            // Validate that the URL contains collections or monsters
            if (!afterNexus.includes('/collections') && !afterNexus.includes('/monsters')) {
                alert('Invalid URL format. The URL must contain either "/collections" or "/monsters" after "nimble.nexus".')
                return
            }
            
            // Add /api after nimble.nexus if not already present
            if (!afterNexus.startsWith('/api')) {
                url = url.replace('nimble.nexus', 'nimble.nexus/api')
            }
            
            // If it's a collection URL, add ?include=monsters
            if (afterNexus.includes('/collections') && !url.includes('?include=monsters')) {
                url += '?include=monsters'
            }

            if (afterNexus.includes('/monsters') && !url.includes('?include=families')) {
                url += '?include=families'
            }
        }
    
    return url
}

async function get_data(url) {
    console.log('Fetching from URL:', url)
                
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
        },
        mode: 'cors', // Handle CORS
    })
    
    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} - ${response.statusText}`)
    }
    
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
        console.warn('Response is not JSON, attempting to parse anyway. Content-Type:', contentType)
    }
    
    const data = await response.json()

    console.log(data)

    return data
}

export { prepare_url, get_data }