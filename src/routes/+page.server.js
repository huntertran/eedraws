// return data fetched from https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json
export const load = async ({ fetch }) => {
    try {
        const response = await fetch(
            'https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json'
        )
        if (!response.ok) {
            throw new Error(`HTTP error: ${response.status}`)
        }
        return await response.json()
        // return { data }
    } catch (error) {
        console.error(error)
        return { error: 'Unable to fetch draws' }
    }
}