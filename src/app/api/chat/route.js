import { NextResponse } from 'next/server';
import { enhancedSearch } from '../../lib/enhancedSearch';
import { generateLearningResponse } from '../../lib/llm';

export async function POST(request) {
  try {
    console.log('📩 Received chat request');
    const { message } = await request.json();
    console.log('💭 User message:', message);
    
    const response = await processUserQuery(message);
    console.log('📤 Sending response:', JSON.stringify(response, null, 2));
    
    return NextResponse.json({ response });
  } catch (error) {
    console.error('❌ Error processing chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processUserQuery(message) {
  try {
    console.log('🔄 Processing query:', message);
    console.log('🔍 Starting enhanced web search...');
    const searchResults = await enhancedSearch(message);
    console.log('📊 Enhanced search results:', JSON.stringify(searchResults, null, 2));
    
    if (!searchResults || searchResults.length === 0) {
      console.log('⚠️ No search results, returning default response');
      return {
        content: `Untuk topik "${message}", saya sarankan untuk memulai dengan konsep dasarnya dulu. Apa yang ingin Anda ketahui secara spesifik?`,
        references: [],
        timestamp: new Date().toISOString()
      };
    }

    // Extract text for summarization
    const searchContent = searchResults
      .map(r => `${r.title}\n${r.description}`)
      .join('\n\n');
    console.log('📝 Content for summarization:', searchContent);

    // Generate natural learning response
    console.log('🤖 Generating learning response...');
    const summary = await generateLearningResponse(message, searchContent);
    console.log('📋 Generated summary:', summary);

    // Format references
    const references = searchResults.map(result => ({
      title: result.title,
      url: result.url,
      description: result.description,
      type: result.type,
      difficulty: result.difficulty,
      metadata: result.metadata
    }));
    
    const finalResponse = {
      content: summary,
      references: references,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ Final formatted response:', JSON.stringify(finalResponse, null, 2));
    return finalResponse;

  } catch (error) {
    console.error('❌ Error in processUserQuery:', error);
    console.error('Error details:', error.stack);
    return {
      content: 'Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi.',
      references: [],
      timestamp: new Date().toISOString()
    };
  }
}