(async () => {
    const apiKey = '';

    // Fetch user's own voices (paginated with next_page_token)
    const myVoices = [];
    let nextPageToken = null;
    do {
        const url = new URL('https://api.elevenlabs.io/v2/voices');
        url.searchParams.set('page_size', '100');
        if (nextPageToken) url.searchParams.set('next_page_token', nextPageToken);

        const res = await fetch(url.toString(), { headers: { 'xi-api-key': apiKey } });
        if (!res.ok) throw new Error(`voices error: ${res.status}`);
        const data = await res.json();
        myVoices.push(...data.voices);
        nextPageToken = data.next_page_token ?? null;
    } while (nextPageToken);

    console.log(`My voices: ${myVoices.length}`);

    // Fetch shared voice library (paginated with page number)
    const sharedVoices = [];
    let page = 1;
    while (true) {
        const url = new URL('https://api.elevenlabs.io/v1/shared-voices');
        url.searchParams.set('page_size', '100');
        url.searchParams.set('page', page);

        const res = await fetch(url.toString(), { headers: { 'xi-api-key': apiKey } });
        if (!res.ok) throw new Error(`shared-voices error: ${res.status}`);
        const data = await res.json();

        if (!data.voices || data.voices.length === 0) break;
        sharedVoices.push(...data.voices);
        console.log(`Shared voices fetched: ${sharedVoices.length} / ${data.total_count}...`);

        if (!data.has_more) break;
        page++;
    }

    const allVoices = [...myVoices, ...sharedVoices];
    console.log(`\nTotal: ${allVoices.length} (${myVoices.length} own + ${sharedVoices.length} shared)`);

    const { Firestore } = await import('@google-cloud/firestore');
    const db = new Firestore({ projectId: 'loom24-mvp', databaseId: 'ai-avatar-db' });
    const collection = db.collection('voices');

    const existingRefs = await collection.listDocuments();
    const existingIds = new Set(existingRefs.map(ref => ref.id));
    console.log(`Existing voices in DB: ${existingIds.size}`);

    let created = 0, updated = 0;
    for (let i = 0; i < allVoices.length; i += 500) {
        const batch = db.batch();
        const chunk = allVoices.slice(i, i + 500);
        for (const voice of chunk) {
            const doc = collection.doc(voice.voice_id);
            const data = {
                id: voice.voice_id,
                name: voice.name,
                category: voice.category === 'middle_aged' ? 'middle-aged' : voice.category,
                language: voice.language ?? voice.labels?.language ?? null,
                gender: voice.gender ?? voice.labels?.gender ?? null,
                age: voice.age ?? voice.labels?.age ?? null,
                accent: voice.accent ?? voice.labels?.accent ?? null,
                useCase: voice.use_case ?? voice.labels?.use_case ?? null,
                description: voice.description ?? null,
                previewUrl: voice.preview_url ?? null,
            };
            if (existingIds.has(voice.voice_id)) {
                batch.update(doc, data);
                updated++;
            } else {
                batch.set(doc, data);
                created++;
            }
        }
        await batch.commit();
        console.log(`Progress: ${created + updated} / ${allVoices.length} (${created} created, ${updated} updated)...`);
    }

    console.log(`Done. Created: ${created}, Updated: ${updated}`);
})();
