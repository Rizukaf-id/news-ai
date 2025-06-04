export const handleFirestoreError = (error) => {
  console.error('Firestore Error:', error);
  
  switch (error.code) {
    case 'permission-denied':
      console.error('Firebase permissions error. Please check your security rules and authentication status.');
      return 'Permission denied. Please check your authentication status.';
    
    case 'unavailable':
      console.error('Firebase service is currently unavailable.');
      return 'Service temporarily unavailable. Please try again later.';
    
    case 'not-found':
      console.error('Requested document not found in Firestore.');
      return 'Requested data not found.';
    
    default:
      console.error('Unexpected Firebase error:', error);
      return 'An unexpected error occurred. Please try again.';
  }
};
