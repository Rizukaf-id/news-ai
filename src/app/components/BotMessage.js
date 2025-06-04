export default function BotMessage({ message }) {
  const {
    content = '',
    learningPath = [],
    references = [],
    timestamp
  } = message;

  // Function to format content blocks
  const formatContent = (text) => {
    if (!text) return null;

    // Split content by markdown headers
    const sections = text.split(/(?=###\s[^\n]+)/g).filter(Boolean);
    
    return sections.map((section, sIndex) => {
      // Handle headers (###)
      if (section.startsWith('###')) {
        const [header, ...content] = section.split('\n');
        return (
          <div key={`section-${sIndex}`}>
            <h3 className="font-bold text-lg text-gray-800 mt-4 mb-3">
              {header.replace('###', '').trim()}
            </h3>
            <div className="space-y-2">
              {formatSectionContent(content.join('\n'))}
            </div>
          </div>
        );
      }
      return formatSectionContent(section);
    });
  };
  // Function to format section content (bullet points, text)
  const formatSectionContent = (content) => {
    if (!content) return null;
    
    // Split by bullet points while preserving bullets
    const parts = content.split(/(?=\n-\s[^\n]+)/g).filter(Boolean);
    
    return parts.map((part, pIndex) => {
      // Handle bullet points
      if (part.trim().startsWith('- ')) {
        const bulletContent = part.substring(part.indexOf('-') + 1).trim();
        return (
          <div key={`bullet-${pIndex}`} className="flex items-start space-x-2 py-1">
            <span className="text-blue-600 mt-1.5">•</span>
            <span className="text-gray-700 flex-1">{bulletContent}</span>
          </div>
        );
      }
      
      // Handle regular text
      const text = part.trim();
      if (!text) return null;
      
      return (
        <div key={`text-${pIndex}`} className="text-gray-700 whitespace-pre-wrap leading-relaxed">
          {text}
        </div>
      );
    });
  };  return (
    <div className="w-full">
      <div className={`
        bg-white p-4 rounded-xl border border-gray-200 
        shadow-sm w-full hover:shadow-md transition-shadow duration-200
        ${!timestamp ? 'animate-pulse-subtle' : ''}
      `}>
        <div className="prose prose-sm w-full">
          {/* Bot Icon */}
          <div className="flex items-center mb-3">
            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mr-2">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <span className="text-sm font-medium text-gray-700">Assistant</span>
          </div>

          {/* Main Content */}
          <div className="text-gray-800 leading-relaxed">
            {formatContent(content)}
          </div>
          
          {/* Learning Path Section */}
          {learningPath && learningPath.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="flex items-center text-sm font-bold text-primary-800 mb-3">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 13v-1m4 1v-3m4 3V8M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                </svg>
                Alur Pembelajaran yang Direkomendasikan:
              </h4>
              <ol className="list-decimal pl-5 space-y-2">
                {learningPath.map((step, index) => (
                  <li key={index} className="text-sm text-gray-700 pl-2">
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
          
          {/* References Section */}
          {references && references.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h4 className="flex items-center text-sm font-bold text-primary-800 mb-3">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Sumber Belajar:
              </h4>
              <div className="grid gap-3">
                {references.map((ref, index) => (
                  <a 
                    key={index}
                    href={ref.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-primary-700 hover:text-primary-800">
                        {ref.title}
                      </span>
                      <span className="text-xs text-gray-500 truncate mt-1">
                        {ref.url}
                      </span>
                      {ref.description && (
                        <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                          {ref.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {ref.type && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
                            {ref.type}
                          </span>
                        )}
                        {ref.difficulty && (
                          <span className={`
                            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${ref.difficulty === 'beginner' ? 'bg-green-50 text-green-700' :
                              ref.difficulty === 'intermediate' ? 'bg-yellow-50 text-yellow-700' :
                              'bg-red-50 text-red-700'}
                          `}>
                            {ref.difficulty === 'beginner' ? 'Pemula' :
                             ref.difficulty === 'intermediate' ? 'Menengah' :
                             'Lanjutan'}
                          </span>
                        )}
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
          
          {/* Timestamp */}
          {timestamp && (
            <p className="text-xs text-gray-400 mt-4">
              {new Date(timestamp).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}