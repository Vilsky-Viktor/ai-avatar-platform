(async () => {
    const { Firestore } = await import('@google-cloud/firestore');
    const db = new Firestore({ projectId: 'loom24-mvp', databaseId: 'ai-avatar-db' });

    const snapshot = await db.collection('voices').get();

    const ages       = new Set();
    const categories = new Set();
    const languages  = new Set();
    const useCases   = new Set();

    for (const doc of snapshot.docs) {
        const data = doc.data();
        if (data.age)      ages.add(data.age);
        if (data.category) categories.add(data.category);
        if (data.language) languages.add(data.language);
        if (data.useCase)  useCases.add(data.useCase);
    }

    console.log('ages:',       [...ages].sort());
    console.log('categories:', [...categories].sort());
    console.log('languages:',  [...languages].sort());
    console.log('useCases:',   [...useCases].sort());
})();
