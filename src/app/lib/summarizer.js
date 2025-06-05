export async function summarizeNews(articles) {
  try {
    if (!articles || articles.length === 0) {
      return 'Tidak ada berita yang ditemukan untuk topik ini.';
    }

    const articlesText = articles.map(article => 
      `Judul: ${article.title}\nDeskripsi: ${article.description}\nSumber: ${article.source}\n`
    ).join('\n\n');    console.log('🔄 Sending request to OpenRouter API...');
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPEN_ROUTE_API_KEY}`,
        'HTTP-Referer': 'https://learning-chatbot.com',
        'X-Title': 'News AI Chatbot',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick:free',
        messages: [{
          role: 'system',
          content: `Kamu adalah asisten yang ahli dalam merangkum berita. Berikan rangkuman yang informatif dan objektif menggunakan format markdown berikut:

# [Topik Utama]

## Ringkasan Utama
[Paragraf singkat yang merangkum inti dari semua berita]

## Poin-Poin Penting
[Daftar bullet point dari informasi penting]

## Detail Berita
### [Subtopik 1]
- [Detail poin 1]
- [Detail poin 2]

### [Subtopik 2]
- [Detail poin 1]
- [Detail poin 2]

## Konteks
- [Informasi tambahan yang relevan]
- [Implikasi atau dampak]

> **Catatan**: Rangkuman ini dibuat berdasarkan berita dari berbagai sumber tepercaya.`
        }, {
          role: 'user',
          content: `Tolong rangkum berita-berita berikut ini menggunakan format yang ditentukan:\n\n${articlesText}`
        }],
        temperature: 0.7,
        max_tokens: 1000,
      })
    });    console.log('📡 OpenRouter API Status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { error: errorText };
      }
      console.error('OpenRouter API Error:', errorData);
      console.error('Full error response:', errorText);
      throw new Error(`Failed to summarize news: ${response.status} ${errorData.error || errorText}`);
    }    console.log('Response status:', response.status);
    const data = await response.json();
    
    // Log the full response for debugging
    console.log('OpenRouter API Response:', JSON.stringify(data, null, 2));
    console.log('API Key present:', !!process.env.OPEN_ROUTE_API_KEY);
    
    if (!data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error('API response missing choices array:', data);
      throw new Error(`API response missing choices array. Status: ${response.status}`);
    }

    const firstChoice = data.choices[0];
    if (!firstChoice.message) {
      console.error('First choice missing message:', firstChoice);
      throw new Error('API response choice missing message');
    }

    if (typeof firstChoice.message.content !== 'string') {
      console.error('Message content is not a string:', firstChoice.message);
      throw new Error('API response message content is not a string');
    }

    console.log('✅ Successfully generated summary');
    return firstChoice.message.content;

  } catch (error) {
    console.error('Error in summarizeNews:', error);
    // Fallback to simple summary if AI fails
    return createFallbackSummary(articles);
  }
}

function createFallbackSummary(articles) {
  if (!articles || articles.length === 0) {
    return 'Tidak ada berita yang ditemukan.';
  }

  return `# Rangkuman Berita Terkini

## Berita Utama
**${articles[0].title}**

${articles[0].description}

> *Sumber: ${articles[0].source}*

## Berita Terkait
${articles.slice(1).map((article, index) => `
### ${article.title}
${article.description || 'Tidak ada deskripsi tersedia.'}

> *Sumber: ${article.source}*`).join('\n\n')}

---
*Rangkuman ini dibuat secara otomatis dari sumber-sumber berita terpercaya.*`;
}
