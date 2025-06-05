import { load } from 'cheerio';

export async function fetchNewsForTopic(topic) {
  try {
    const searchUrl = `https://www.googleapis.com/customsearch/v1?` +
      new URLSearchParams({
        key: process.env.NEXT_PUBLIC_GOOGLE_API_KEY,
        cx: process.env.NEXT_PUBLIC_GOOGLE_CSE_ID,
        q: `${topic} berita`,
        num: '5', // Number of results
        dateRestrict: 'd1', // Last 24 hours
        sort: 'date' // Sort by date
      });
    
    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error('Failed to fetch news');
    }

    const data = await response.json();
    
    return data.items.map(item => ({
      title: item.title,
      description: item.snippet,
      url: item.link,
      source: item.displayLink,
      publishedAt: item.pagemap?.metatags?.[0]?.['article:published_time'] || new Date().toISOString(),
      imageUrl: item.pagemap?.cse_image?.[0]?.src || null
    }));
    
  } catch (error) {
    console.error('Error fetching news:', error);
    throw error;
  }
}