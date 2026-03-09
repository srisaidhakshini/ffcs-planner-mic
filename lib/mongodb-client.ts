import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI || '';
const options = {};

let client: MongoClient | undefined;

// Export a function that returns a Promise<MongoClient> so the connection
// is created lazily at runtime instead of during module evaluation. This
// prevents startup crashes when env vars are not yet loaded during build.
export default function getClientPromise(): Promise<MongoClient> {
    if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI is not configured');
    }

    if (process.env.NODE_ENV === 'development') {
        // debug: print the resolved URI to help diagnose parsing issues
        console.log('Resolved MONGODB_URI:', uri);
        // @ts-expect-error: Attach to global for reuse in dev
        if (!global._mongoClientPromise) {
            client = new MongoClient(uri, options);
            // @ts-expect-error: _mongoClientPromise is a custom property on global
            global._mongoClientPromise = client.connect();
        }
        // @ts-expect-error: _mongoClientPromise is a custom property on global
        return global._mongoClientPromise as Promise<MongoClient>;
    }

    client = new MongoClient(uri, options);
    return client.connect();
}
