import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

/**
 * Enhanced learning response generation using Llama-4-Maverick model
 */
export async function generateLearningResponse(query, searchResults) {
  try {
    const cleanQuery = query.toLowerCase().trim();

    // Format prompt to request structured response with learning resources
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPEN_ROUTE_API_KEY}`,
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'Learning Assistant'
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-maverick:free',
        messages: [
          {
            role: 'system',            content: `Kamu adalah asisten pembelajaran yang ramah dan membantu. 
Berikan jawaban yang terstruktur dengan format berikut dalam Bahasa Indonesia yang mudah dipahami:

👋 Mulai dengan sapaan yang ramah dan personal.

### Penjelasan Utama
- Jelaskan konsep dengan bahasa yang sederhana
- Sertakan contoh konkret yang relevan
- Bagi menjadi poin-poin yang mudah diikuti
- Gunakan analogi jika membantu pemahaman

### Sumber Belajar
- Link artikel/dokumentasi resmi (format: [Judul](link))
- Video pembelajaran terpilih dengan deskripsi singkat
- Rekomendasi kursus online yang relevan
- Repository kode contoh jika ada

### Langkah Selanjutnya
- Topik-topik lanjutan yang sebaiknya dipelajari
- Project latihan yang disarankan
- Tips implementasi praktis

Gunakan markdown untuk format yang rapi dan jelas. Sertakan emoji yang relevan untuk meningkatkan keterbacaan. Pastikan setiap respons bersifat personal dan memotivasi pembelajaran.`
          },
          {
            role: 'user',
            content: `Berikut adalah beberapa referensi yang relevan:

${searchResults}

Berdasarkan referensi tersebut, tolong bantu saya belajar tentang: ${cleanQuery}`
          }
        ],        temperature: 0.8,    // Slightly more creative responses
        max_tokens: 2000,   // Allow longer responses for better explanations
        top_p: 0.95,       // More diverse vocabulary while staying focused
        stream: false
      })
    });

    const data = await response.json();
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Maaf, model tidak memberikan respons yang valid. Silakan coba lagi.');
    }

    return data.choices[0].message.content.trim();

  } catch (error) {
    console.error('Error in enhanced learning response:', error);
    throw new Error(
      'Maaf, terjadi kesalahan saat memproses permintaan Anda. ' + 
      (error.message || 'Silakan coba lagi dalam beberapa saat.')
    );
  }
}
