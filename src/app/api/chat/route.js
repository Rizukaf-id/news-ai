import { NextResponse } from 'next/server';
import { fetchNewsForTopic } from '../../lib/newsService';
import { summarizeNews } from '../../lib/summarizer';

export async function POST(request) {
  try {
    const { message, userId, sessionId } = await request.json();
    console.log('📩 Received news request for topic:', message);
    
    // Fetch news articles based on user query
    const newsArticles = await fetchNewsForTopic(message);
    console.log('📰 Found', newsArticles.length, 'news articles');
    
    // Generate AI summary of the news using LLama-4
    const summary = await summarizeNews(newsArticles);
    console.log('🤖 Generated AI summary');
    
    // Format references from news articles
    const references = newsArticles.map(article => ({
      title: article.title,
      url: article.url,
      source: article.source,
      type: 'news',
      publishedAt: article.publishedAt,
      imageUrl: article.imageUrl
    }));

    const response = {
      content: summary,
      references: references,
      timestamp: new Date().toISOString()
    };

    console.log('📤 Sending response with', references.length, 'references');
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('❌ Error processing news request:', error);
    return NextResponse.json({
      error: 'Failed to process news request',
      message: error.message
    }, { status: 500 });
  }
}