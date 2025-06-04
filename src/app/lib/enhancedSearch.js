const GOOGLE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
const GOOGLE_CSE_ID = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

/**
 * Enhanced search implementation that combines multiple search methods
 * @param {string} query - The search query
 * @returns {Promise<Array>} - Combined and deduplicated search results
 */
/**
 * Enhanced search implementation that combines Google Custom Search with fallback options
 */
export async function enhancedSearch(query) {
    try {
        console.log('🔍 Starting enhanced search for:', query);
        
        // Format query for learning-focused results
        const searchQuery = `${query} tutorial OR guide OR documentation OR course`;
        const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_API_KEY}&cx=${GOOGLE_CSE_ID}&q=${encodeURIComponent(searchQuery)}`;
        
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok || !data.items || data.items.length === 0) {
            console.log('⚠️ No Google API results, using fallback');
            return getFallbackSearchResults(query);
        }        // Process initial search results
        const initialResults = data.items
            .filter(item => isRelevantResult(item.link))
            .map(item => ({
                title: item.title,
                url: item.link,
                description: item.snippet,
                type: categorizeContent(item.title, item.link),
                difficulty: assessDifficulty(item.title, item.snippet),
                metadata: {
                    datePublished: item.pagemap?.metatags?.[0]?.['article:published_time'],
                    author: item.pagemap?.person?.[0]?.name,
                    publisher: item.pagemap?.organization?.[0]?.name,
                    language: detectLanguage(item.title + ' ' + item.snippet),
                    readabilityScore: calculateReadabilityScore(item.snippet)
                }
            }));

        // Add initial quality indicators
        const resultsWithIndicators = initialResults.map(result => ({
            ...result,
            metadata: {
                ...result.metadata,
                qualityIndicators: {
                    hasCode: /\b(code|coding|program|script|function|class|method)\b/i.test(result.description),
                    hasExamples: /\b(example|sample|demo|tutorial|guide)\b/i.test(result.description),
                    isInteractive: /\b(interactive|hands-on|practice|exercise|quiz)\b/i.test(result.description),
                    isComprehensive: result.description.length > 200
                }
            }
        }));

        // Deduplicate results
        const uniqueResults = deduplicateResults(resultsWithIndicators);
        
        // Enhance results with additional metadata
        const finalResults = await enhanceResults(uniqueResults);
        
        // Sort by relevance and difficulty
        return sortResults(finalResults);
        
    } catch (error) {
        console.error('Error in enhanced search:', error);
        return getFallbackSearchResults(query);
    }
}

/**
 * Deduplicate search results based on URL
 */
function deduplicateResults(results) {
    const seen = new Set();
    return results.filter(result => {
        const url = normalizeUrl(result.url);
        if (seen.has(url)) return false;
        seen.add(url);
        return true;
    });
}

/**
 * Normalize URLs for comparison
 */
function normalizeUrl(url) {
    try {
        // Remove protocol, www, trailing slashes, and query parameters
        return url.toLowerCase()
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/$/, '')
            .split('?')[0];
    } catch {
        return url;
    }
}

/**
 * Enhance search results with additional metadata
 */
async function enhanceResults(results) {
    return Promise.all(results.map(async result => {
        try {
            // Add timestamp if not present
            if (!result.metadata?.timestamp) {
                result.metadata = {
                    ...result.metadata,
                    timestamp: new Date().toISOString()
                };
            }

            // Add language detection
            result.metadata.language = detectLanguage(result.title + ' ' + result.description);

            // Add readability score
            result.metadata.readabilityScore = calculateReadabilityScore(result.description);

            // Add content quality indicators
            result.metadata.qualityIndicators = {
                hasCode: /\b(code|coding|program|script|function|class|method)\b/i.test(result.description),
                hasExamples: /\b(example|sample|demo|tutorial|guide)\b/i.test(result.description),
                isInteractive: /\b(interactive|hands-on|practice|exercise|quiz)\b/i.test(result.description),
                isComprehensive: result.description.length > 200
            };

            return result;
        } catch (error) {
            console.error('Error enhancing result:', error);
            return result;
        }
    }));
}

/**
 * Detect the primary language of the text
 */
function detectLanguage(text) {
    const indonesianPatterns = /\b(yang|dan|atau|dengan|untuk|di|ke|dari|dalam|ini|itu|juga|sudah|saya|anda|bisa|ada|akan|bisa|saat|serta|para|pada|sebuah|tersebut)\b/gi;
    const indonesianMatches = (text.match(indonesianPatterns) || []).length;
    
    return indonesianMatches > 5 ? 'id' : 'en';
}

/**
 * Calculate a basic readability score
 */
function calculateReadabilityScore(text) {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[.!?]+/).length;
    const avgWordsPerSentence = words / sentences;
    
    // Simple readability score based on average words per sentence
    // Lower score (closer to 1) means more readable
    return Math.min(Math.max(avgWordsPerSentence / 20, 1), 5);
}

/**
 * Sort results by relevance and other factors
 */
function sortResults(results) {
    return results.sort((a, b) => {
        // Prioritize high-quality comprehensive content
        const qualityScoreA = calculateQualityScore(a);
        const qualityScoreB = calculateQualityScore(b);
        
        // Sort by quality score, highest first
        return qualityScoreB - qualityScoreA;
    }).slice(0, 10); // Limit to top 10 results
}

/**
 * Calculate a quality score for a search result
 */
function calculateQualityScore(result) {
    let score = 0;
    
    // Base relevance score
    score += result.relevanceScore || 0;
    
    // Prefer beginner-friendly content slightly
    if (result.difficulty === 'beginner') score += 0.3;
    else if (result.difficulty === 'intermediate') score += 0.2;
    
    // Boost interactive content
    if (result.metadata?.qualityIndicators?.isInteractive) score += 0.5;
    
    // Boost content with examples
    if (result.metadata?.qualityIndicators?.hasExamples) score += 0.4;
    
    // Boost comprehensive content
    if (result.metadata?.qualityIndicators?.isComprehensive) score += 0.3;
    
    // Boost content in the user's language
    if (result.metadata?.language === 'id') score += 0.2;
    
    // Penalize hard-to-read content
    score -= (result.metadata?.readabilityScore || 3) * 0.1;
    
    return score;
}

/**
 * Extended fallback search results
 */
function getFallbackSearchResults(query) {
    const queryLower = query.toLowerCase();
    
    // Common programming topics with curated resources
    const topicResources = {
        'web development': [
            {
                title: 'MDN Web Docs - Learn web development',
                url: 'https://developer.mozilla.org/en-US/docs/Learn',
                description: 'Tutorial lengkap pengembangan web dari Mozilla',
                type: 'documentation',
                difficulty: 'beginner',
                metadata: {
                    qualityIndicators: {
                        hasCode: true,
                        hasExamples: true,
                        isInteractive: true,
                        isComprehensive: true
                    },
                    language: 'en',
                    readabilityScore: 2
                }
            },
            {
                title: 'W3Schools - Web Tutorials',
                url: 'https://www.w3schools.com',
                description: 'Tutorial interaktif untuk HTML, CSS, JavaScript, dan lainnya',
                type: 'tutorial',
                difficulty: 'beginner',
                metadata: {
                    qualityIndicators: {
                        hasCode: true,
                        hasExamples: true,
                        isInteractive: true,
                        isComprehensive: true
                    },
                    language: 'en',
                    readabilityScore: 1.5
                }
            }
        ],
        'javascript': [
            {
                title: 'Modern JavaScript Tutorial',
                url: 'https://javascript.info',
                description: 'Panduan JavaScript modern dengan penjelasan mendalam',
                type: 'tutorial',
                difficulty: 'intermediate',
                metadata: {
                    qualityIndicators: {
                        hasCode: true,
                        hasExamples: true,
                        isInteractive: true,
                        isComprehensive: true
                    },
                    language: 'en',
                    readabilityScore: 2.5
                }
            }
        ],
        'python': [
            {
                title: 'Python Documentation',
                url: 'https://docs.python.org/3/',
                description: 'Dokumentasi resmi Python dengan tutorial lengkap',
                type: 'documentation',
                difficulty: 'intermediate',
                metadata: {
                    qualityIndicators: {
                        hasCode: true,
                        hasExamples: true,
                        isInteractive: false,
                        isComprehensive: true
                    },
                    language: 'en',
                    readabilityScore: 3
                }
            }
        ]
    };

    // Check for topic-specific resources
    for (const [topic, resources] of Object.entries(topicResources)) {
        if (queryLower.includes(topic)) {
            return resources;
        }
    }

    // Default resources if no specific match
    return [
        {
            title: 'Coursera - Online Learning',
            url: 'https://www.coursera.org/search',
            description: `Temukan kursus online terbaik tentang ${query}`,
            type: 'course',
            difficulty: 'beginner',
            metadata: {
                qualityIndicators: {
                    hasCode: false,
                    hasExamples: true,
                    isInteractive: true,
                    isComprehensive: true
                },
                language: 'en',
                readabilityScore: 2
            }
        },
        {
            title: 'edX - Free Online Courses',
            url: 'https://www.edx.org',
            description: `Pelajari ${query} dari universitas terbaik dunia`,
            type: 'course',
            difficulty: 'intermediate',
            metadata: {
                qualityIndicators: {
                    hasCode: false,
                    hasExamples: true,
                    isInteractive: true,
                    isComprehensive: true
                },
                language: 'en',
                readabilityScore: 2
            }
        }
    ];
}

/**
 * Verify trusted and relevant domains
 */
function isRelevantResult(url) {
    const trustedDomains = [
        'developer.mozilla.org',
        'w3schools.com',
        'github.com',
        'stackoverflow.com',
        'medium.com',
        'dev.to',
        'freecodecamp.org',
        'coursera.org',
        'udemy.com',
        'edx.org',
        'dicoding.com',
        'codepolitan.com',
        'docs.microsoft.com',
        'tutorialspoint.com',
        'geeksforgeeks.org',
        'guru99.com',
        'javatpoint.com',
        'programiz.com',
        'petanikode.com',
        'belajarpython.com'
    ];
    return trustedDomains.some(domain => url.toLowerCase().includes(domain));
}

/**
 * Categorize content type based on URL and title
 */
function categorizeContent(title, url) {
    const lowerUrl = url.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    // Documentation
    if (lowerUrl.includes('docs.') || 
        lowerUrl.includes('/docs/') || 
        lowerUrl.includes('documentation') ||
        lowerTitle.includes('documentation') ||
        lowerTitle.includes('reference') ||
        lowerTitle.includes('docs')) {
        return 'documentation';
    }
    
    // Tutorials
    if (lowerUrl.includes('tutorial') || 
        lowerUrl.includes('guide') || 
        lowerUrl.includes('learn') ||
        lowerTitle.includes('tutorial') ||
        lowerTitle.includes('guide') ||
        lowerTitle.includes('how to')) {
        return 'tutorial';
    }
    
    // Courses
    if (lowerUrl.includes('course') || 
        lowerUrl.includes('class') || 
        lowerUrl.includes('bootcamp') ||
        lowerUrl.match(/udemy|coursera|edx|dicoding/)) {
        return 'course';
    }
    
    // Articles
    if (lowerUrl.includes('blog') || 
        lowerUrl.includes('article') || 
        lowerUrl.match(/medium\.com|dev\.to|hashnode\.com/)) {
        return 'article';
    }
    
    return 'other';
}

/**
 * Assess content difficulty level
 */
function assessDifficulty(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    
    // Check for explicit difficulty indicators
    if (text.match(/\b(advanced|expert|lanjut|ahli|kompleks|advanced-level)\b/)) {
        return 'advanced';
    }
    
    if (text.match(/\b(intermediate|menengah|medium|moderate|intermediate-level)\b/)) {
        return 'intermediate';
    }
    
    if (text.match(/\b(beginner|pemula|basic|dasar|start|fundamental|beginner-level)\b/)) {
        return 'beginner';
    }
    
    // Use content complexity as a fallback
    const complexityIndicators = {
        advanced: /\b(optimization|architecture|scale|security|advanced|expert|complex)\b/i,
        intermediate: /\b(implementation|integration|practice|develop|build|create)\b/i,
        beginner: /\b(introduction|basic|fundamental|start|learn|tutorial|simple)\b/i
    };
    
    if (complexityIndicators.advanced.test(text)) return 'advanced';
    if (complexityIndicators.intermediate.test(text)) return 'intermediate';
    return 'beginner';
}
