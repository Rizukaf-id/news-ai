'use client';

import { db } from './firebase';
import {
    collection,
    addDoc,
    updateDoc,
    doc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    limit as limitQuery,
    increment,
    arrayUnion,
    setDoc
} from 'firebase/firestore';

const CHATS_COLLECTION = 'chats';
const MESSAGES_COLLECTION = 'messages';
const TOPICS_COLLECTION = 'topics';

// Enhanced topic extraction using NLP-like patterns
function extractTopics(message) {
    const topics = [];
    const keywords = message.toLowerCase().split(' ');
    
    // Common learning-related prefixes
    const learningPrefixes = ['belajar', 'learn', 'pelajari', 'study', 'understand'];
    
    for (const prefix of learningPrefixes) {
        const index = keywords.indexOf(prefix);
        if (index !== -1 && keywords[index + 1]) {
            topics.push(keywords[index + 1]);
        }
    }
    
    // Extract potential topics after "about", "mengenai", "tentang"
    const aboutPrefixes = ['about', 'mengenai', 'tentang'];
    for (const prefix of aboutPrefixes) {
        const index = keywords.indexOf(prefix);
        if (index !== -1 && keywords[index + 1]) {
            topics.push(keywords[index + 1]);
        }
    }
    
    return [...new Set(topics)]; // Remove duplicates
}

export async function saveChat({ userId, sessionId, message, response, timestamp }) {
    if (!userId || !sessionId) {
        console.error('Missing required fields:', { userId, sessionId });
        return;
    }

    try {
        const topics = extractTopics(message);
        
        // Normalize the data with enhanced metadata
        const chatData = {
            userId,
            sessionId,
            message: message || '',
            response: {
                content: response?.content || '',
                learningPath: response?.learningPath || [],
                references: response?.references || [],
                timestamp: timestamp || new Date().toISOString()
            },
            topics,
            metadata: {
                hasLearningPath: response?.learningPath?.length > 0,
                hasReferences: response?.references?.length > 0,
                difficulty: response?.references?.[0]?.difficulty || 'beginner',
                topicCount: topics.length
            },
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Update chat session
        const chatQuery = query(
            collection(db, CHATS_COLLECTION),
            where('userId', '==', userId),
            where('sessionId', '==', sessionId)
        );

        const chatSnapshot = await getDocs(chatQuery);

        if (chatSnapshot.empty) {
            await addDoc(collection(db, CHATS_COLLECTION), chatData);
        } else {
            await updateDoc(doc(db, CHATS_COLLECTION, chatSnapshot.docs[0].id), {
                ...chatData,
                updatedAt: serverTimestamp()
            });
        }

        // Save message with enhanced metadata
        const messageDoc = await addDoc(collection(db, MESSAGES_COLLECTION), {
            userId,
            sessionId,
            message,
            response: chatData.response,
            topics,
            metadata: chatData.metadata,
            timestamp: serverTimestamp()
        });

        // Update topics collection for better topic tracking
        for (const topic of topics) {
            const topicRef = doc(db, TOPICS_COLLECTION, topic.toLowerCase());
            try {
                await updateDoc(topicRef, {
                    count: increment(1),
                    lastUsed: serverTimestamp(),
                    messageRefs: arrayUnion(messageDoc.id)
                });
            } catch (error) {
                // If topic doesn't exist, create it
                await setDoc(topicRef, {
                    topic: topic.toLowerCase(),
                    count: 1,
                    created: serverTimestamp(),
                    lastUsed: serverTimestamp(),
                    messageRefs: [messageDoc.id]
                });
            }
        }

    } catch (error) {
        console.error('Error saving chat:', error);
        throw error;
    }
}

export async function getChatHistory(userId, limit = 50, retryCount = 0) {
    if (!userId) {
        console.error('User ID is required to fetch chat history');
        return [];
    }

    try {
        // Query messages with enhanced filtering
        const messagesQuery = query(
            collection(db, MESSAGES_COLLECTION),
            where('userId', '==', userId),
            orderBy('timestamp', 'desc'),
            limitQuery(limit)
        );

        const snapshot = await getDocs(messagesQuery);
        
        // Map and normalize the data with enhanced metadata
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                message: data.message || '',
                response: {
                    content: data.response?.content || '',
                    learningPath: data.response?.learningPath || [],
                    references: data.response?.references || [],
                    timestamp: data.response?.timestamp || null
                },
                topics: data.topics || [],
                metadata: data.metadata || {
                    hasLearningPath: false,
                    hasReferences: false,
                    difficulty: 'beginner',
                    topicCount: 0
                },
                timestamp: data.timestamp?.toDate?.() || new Date()
            };
        });

    } catch (error) {
        console.error('Error fetching chat history:', error);
        
        if (error.code === 'failed-precondition' && retryCount < 3) {
            console.log(`Index not ready, retrying in ${(retryCount + 1) * 2} seconds...`);
            // Wait for progressively longer intervals
            await new Promise(resolve => setTimeout(resolve, (retryCount + 1) * 2000));
            return getChatHistory(userId, limit, retryCount + 1);
        }

        // If it's not an index error or we've exhausted retries, try a simpler query
        if (retryCount >= 3) {
            console.log('Falling back to simple query without ordering...');
            try {
                const simpleQuery = query(
                    collection(db, MESSAGES_COLLECTION),
                    where('userId', '==', userId),
                    limitQuery(limit)
                );
                const simpleSnapshot = await getDocs(simpleQuery);
                return simpleSnapshot.docs
                    .map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            message: data.message || '',
                            response: {
                                content: data.response?.content || '',
                                learningPath: data.response?.learningPath || [],
                                references: data.response?.references || [],
                                timestamp: data.response?.timestamp || null
                            },
                            topics: data.topics || [],
                            metadata: data.metadata || {
                                hasLearningPath: false,
                                hasReferences: false,
                                difficulty: 'beginner',
                                topicCount: 0
                            },
                            timestamp: data.timestamp?.toDate?.() || new Date()
                        };
                    })
                    .sort((a, b) => b.timestamp - a.timestamp); // Sort in memory
            } catch (fallbackError) {
                console.error('Even simple query failed:', fallbackError);
            }
        }
        
        return [];
    }
}