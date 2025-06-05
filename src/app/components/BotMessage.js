'use client';
import ReactMarkdown from 'react-markdown';

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};

const getDisplayUrl = (url) => {
  try {
    const urlObject = new URL(url);
    return urlObject.hostname;
  } catch (_) {
    return url.length > 50 ? url.substring(0, 47) + '...' : url;
  }
};

export default function BotMessage({ message }) {
  const {
    content = '',
    references = [],
    timestamp,
    articles = []  // Add articles array with fallback to empty array
  } = message;

  // Filter out invalid URLs
  const validReferences = references.filter(isValidUrl);

  return (
    <div className="w-full">
      <div className={`
        bg-white p-6 rounded-2xl border border-slate-200 
        shadow-sm hover:shadow-md transition-all duration-200
        ${!timestamp ? 'animate-pulse' : ''}
      `}>
        {/* Bot Icon & Timestamp */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
              </svg>
            </div>
            <div>
              <span className="font-medium text-slate-800">News AI</span>
              {timestamp && (
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Main Content with Enhanced Markdown Styling */}
        <article className="max-w-none">
          <div className="markdown-content">
            <ReactMarkdown 
              components={{
                h1: ({node, ...props}) => <h1 className="text-3xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-6" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-2xl font-semibold text-slate-800 mt-8 mb-4" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-xl font-medium text-slate-700 mt-6 mb-3" {...props} />,
                p: ({node, ...props}) => <p className="text-slate-600 leading-7 mb-4" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc pl-5 my-4 space-y-2" {...props} />,
                li: ({node, ...props}) => <li className="text-slate-600" {...props} />,
                blockquote: ({node, ...props}) => (
                  <blockquote className="border-l-4 border-blue-200 bg-blue-50 p-4 my-6 rounded-r-lg" {...props} />
                ),
                a: ({node, ...props}) => (
                  <a className="text-blue-600 hover:text-blue-800 underline" {...props} target="_blank" rel="noopener noreferrer" />
                ),
                code: ({node, inline, ...props}) => (
                  inline ? 
                    <code className="bg-slate-100 px-1.5 py-0.5 rounded text-sm text-slate-800" {...props} /> :
                    <code className="block bg-slate-100 p-4 rounded-lg overflow-x-auto text-sm text-slate-800" {...props} />
                )
              }}
            >
              {content}
            </ReactMarkdown>

            {/* References Section */}
            {(validReferences.length > 0 || articles.length > 0) && (
              <div className="mt-6 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-medium text-slate-700 mb-4">Sumber Berita:</h4>
                <ul className="space-y-4">
                  {articles.map((article, index) => (
                    <li key={index} className="bg-slate-50 rounded-lg p-4 hover:bg-slate-100 transition-colors duration-200">
                      <div className="space-y-2">
                        <h5 className="font-medium text-slate-900">
                          <a 
                            href={article.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="hover:text-blue-600"
                          >
                            {article.title}
                          </a>
                        </h5>
                        {article.description && (
                          <p className="text-sm text-slate-600 line-clamp-2">
                            {article.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium">{getDisplayUrl(article.url)}</span>
                          {article.publishedAt && (
                            <>
                              <span>•</span>
                              <time>
                                {new Date(article.publishedAt).toLocaleDateString('id-ID', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </time>
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                  
                  {/* Show remaining references that aren't in articles */}
                  {validReferences
                    .filter(ref => !articles.some(article => article.url === ref))
                    .map((ref, index) => (
                      <li key={`ref-${index}`} className="text-sm">
                        <div className="flex flex-col space-y-1">
                          <a href={ref} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            {getDisplayUrl(ref)}
                          </a>
                          <a href={ref} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-slate-500 hover:text-slate-700 text-xs break-all"
                          >
                            {ref}
                          </a>
                        </div>
                      </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>
      </div>
    </div>
  );
}