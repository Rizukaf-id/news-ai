'use client';

import { db } from './firebase';
import {
    collection,
    addDoc,
    query,
    where,
    orderBy,
    getDocs,
    serverTimestamp,
    limit as limitQuery
} from 'firebase/firestore';

const CHATS_COLLECTION = 'news_chats';

export async function saveChat({ userId, sessionId, message, response, timestamp }) {
    if (!userId || !sessionId) {
        console.error('Missing required fields:', { userId, sessionId });
        return;
    }    try {
        // Normalize the data for news bot
        const chatData = {
            userId,
            sessionId,
            query: message || '',  // Search query from user
            response: {
                content: response?.content || '',
                references: response?.references || [],
                articles: response?.articles || []
            },
            metadata: {
                resultsCount: response?.articles?.length || 0,
                sources: (response?.articles || []).map(article => article.source).filter(Boolean),
                queryTime: new Date().toISOString()
            },
            createdAt: serverTimestamp(),
            timestamp: timestamp || new Date().toISOString()
        };

        // Save to Firestore
        await addDoc(collection(db, CHATS_COLLECTION), chatData);

    } catch (error) {
        console.error('Error saving news chat:', error);
        throw error;
    }
}

export async function getChatHistory(userId, limit = 20) {
    if (!userId) {
        console.error('User ID is required to fetch chat history');
        return [];
    }

    try {
        // Query messages with news-specific ordering
        const messagesQuery = query(
            collection(db, CHATS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limitQuery(limit)
        );

        const snapshot = await getDocs(messagesQuery);
        
        // Map and normalize the news chat data
        return snapshot.docs.map(doc => {
            const data = doc.data();            return {
                id: doc.id,
                type: 'bot',
                content: data.response?.content || '',
                references: data.response?.references || [],
                articles: data.response?.articles || [],
                timestamp: data.timestamp,
                metadata: {
                    query: data.query,
                    resultsCount: data.metadata?.resultsCount || 0,
                    sources: data.metadata?.sources || [],
                    queryTime: data.metadata?.queryTime
                }
            };
        });

    } catch (error) {
        console.error('Error fetching news chat history:', error);
        return [];
    }
}