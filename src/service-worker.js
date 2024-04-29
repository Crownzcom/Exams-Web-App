/* eslint-disable no-restricted-globals */

// This service worker can be customized!
// See https://developers.google.com/web/tools/workbox/modules
// for the list of available Workbox modules, or add any other
// code you'd like.
// You can also remove this file if you'd prefer not to use a
// service worker, and the Workbox build step will be skipped.

import { clientsClaim } from 'workbox-core';
import { ExpirationPlugin } from 'workbox-expiration';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate } from 'workbox-strategies';
import db from './db.js'; // Your IndexedDB setup

clientsClaim();

// Precache all of the assets generated by your build process.
// Their URLs are injected into the manifest variable below.
// This variable must be present somewhere in your service worker file,
// even if you decide not to use precaching. See https://cra.link/PWA
precacheAndRoute(self.__WB_MANIFEST);

// Set up App Shell-style routing, so that all navigation requests
// are fulfilled with your index.html shell. Learn more at
// https://developers.google.com/web/fundamentals/architecture/app-shell
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }) => {
    // If this isn't a navigation, skip.
    if (request.mode !== 'navigate') {
      return false;
    } // If this is a URL that starts with /_, skip.

    if (url.pathname.startsWith('/_')) {
      return false;
    } // If this looks like a URL for a resource, because it contains // a file extension, skip.

    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    } // Return true to signal that we want to use the handler.

    return true;
  },
  createHandlerBoundToURL(process.env.PUBLIC_URL + '/index.html')
);

// An example runtime caching route for requests that aren't handled by the
// precache, in this case same-origin .png requests like those from in public/
registerRoute(
  // Add in any other file extensions or routing criteria as needed.
  ({ url }) => url.origin === self.location.origin && url.pathname.endsWith('.png'), // Customize this strategy as needed, e.g., by changing to CacheFirst.
  new StaleWhileRevalidate({
    cacheName: 'images',
    plugins: [
      // Ensure that once this runtime cache reaches a maximum size the
      // least-recently used images are removed.
      new ExpirationPlugin({ maxEntries: 150 }),
    ],
  })
);

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

/* ============================ CUSTOM SERVICE - WORKERS ============================ */
// SERVER-SIDE URLs
// const serverUrl = 'http://45.136.71.186:3001'; //ExamPrepTutor Server URL
// const serverUrl = 'http://localhost:3005'; //Localhost
// const serverUrl = 'https://jz8w6z-3005.csb.app' //Derrick codesandbox
const serverUrl = 'https://9rtmcd-3005.csb.app' //Derrick123 codesandbox
// const serverUrl = 'https://nk7rt3-3005.csb.app' //Crownzcom codesandbox
// const serverUrl = rootUrl; // Same server as the backend server-side

// Event listener to trigger the sync event when online
self.addEventListener('online', async () => {
  try {
    // Register a sync event to trigger when the user goes online
    const registration = await self.registration;
    await registration.sync.register('SYNC_EXAM_ANSWERS');
  } catch (error) {
    console.error('Error registering sync event:', error);
  }
});

//Fecth 5 exams for each enrolled subject and saves to indexDB
// self.addEventListener('message', async (event) => {
//   if (event.data && event.data.type === 'FETCH_EXAMS') {
//     const { subjects, userId, educationLevel } = event.data;



//     for (const subject of subjects) {
//       try {
//         for (let i = 0; i < 5; i++) {
//           try {
//             const url = `${serverUrl}/exam/fetch-exam?subjectName=${subject}&userId=${userId}&educationLevel=${educationLevel}`;
//             const response = await fetch(url);

//             if (!response.ok) {
//               throw new Error(`HTTP error! status: ${response.status}`);
//             }

//             const data = await response.json();

//             const exam = {
//               userId,
//               educationLevel,
//               subjectName: subject,
//               examData: data.questions,
//             };

//             // Store the exam immediately and await completion
//             await db.exams.add(exam);

//             // console.log(`Exam - ${i} for subject ${subject} stored successfully`);

//           } catch (error) {
//             console.error(`Error fetching exam data for subject ${subject}:`, error);
//             break;  // Exit loop on error
//           }
//         }
//       } catch (error) {
//         console.error(`Error processing subject ${subject}:`, error);
//       }
//     }
//   }
// });

self.addEventListener('message', async (event) => {
  if (event.data && event.data.type === 'FETCH_EXAMS') {
    const { subjects, userId, educationLevel } = event.data;

    // Array to hold image paths
    const imagePaths = [];

    // Recursive function to extract image paths from exam data
    async function extractImagePaths(obj) {
      if (Array.isArray(obj)) {
        // If it's an array, iterate through its elements
        obj.forEach((item) => extractImagePaths(item));
      } else if (typeof obj === 'object' && obj !== null) {
        // If it's an object, iterate through its properties
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            if (typeof value === 'string' && /\.(jpg|jpeg|png|gif|bmp|tiff|webp|svg)$/.test(value.toLowerCase())) {
              // If it's an image path, add it to the array
              console.log('Adding image path: ' + value);
              imagePaths.push(value);
            } else {
              // Recurse if it's another object or array
              extractImagePaths(value);
            }
          }
        }
      }
    }

    for (const subject of subjects) {
      try {
        for (let i = 0; i < 5; i++) {
          const url = `${serverUrl}/exam/fetch-exam?subjectName=${subject}&userId=${userId}&educationLevel=${educationLevel}`;
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();

          const exam = {
            userId,
            educationLevel,
            subjectName: subject,
            examData: data.questions,
          };

          // Extract image paths from the fetched exam data
          await extractImagePaths(exam.examData);

          // Store the exam in IndexDB
          await db.exams.add(exam);

        }
      } catch (error) {
        console.error(`Error processing subject ${subject}:`, error);
      }
    }

    // Cache the extracted image paths
    const CACHE_NAME = 'my-app-images-cache-v1';
    const cache = await caches.open(CACHE_NAME);

    await cache.addAll(imagePaths);

    console.log('Image paths cached:', imagePaths);
  }
});

// Service worker background sync event to check 'examAnswers' when online
self.addEventListener('sync', async (event) => {
  if (event.tag === 'SYNC_EXAM_ANSWERS') {
    // console.log('Sync event triggered to process exam answers');

    try {
      // Check if the 'examAnswers' table has any data
      const examAnswersCount = await db.examAnswers.count();

      if (examAnswersCount === 0) {
        // console.log('No exam answers to process');
        return;  // Exit if there's no data to process
      }

      const examAnswers = await db.examAnswers.toArray();  // Fetch all data from the table

      for (const answer of examAnswers) {
        const response = await fetch(`${serverUrl}/exam/submit`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(answer),
        });

        if (response.ok) {
          await db.examAnswers.delete(answer.id);  // Delete successful submissions

          const serverResponse = await response.json();

          // Properly define 'clients' before using it
          const openClients = await self.clients.matchAll();  // Retrieve all open clients

          openClients.forEach((client) => {
            client.postMessage({
              type: 'SYNC_RESULTS',
              points: serverResponse.points,  // Send points
              allResults: serverResponse.allResults,  // Send allResults
            });
          });

          // console.log(`Exam answer for subject ${answer.subject} submitted and deleted from IndexedDB`);
        } else {
          console.error(`Failed to submit exam answer for subject ${answer.subject}`);
        }
      }
    } catch (error) {
      console.error('Error processing exam answers:', error);
    }
  }
});


