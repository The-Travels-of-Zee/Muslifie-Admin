// // pages/api/admin/analytics/firebase-events.js
// import { google } from 'googleapis';

// const analytics = google.analyticsdata('v1beta');

// // Get Firebase Analytics auth
// const getAnalyticsAuth = () => {
//   const credentials = {
//     client_email: process.env.FIREBASE_CLIENT_EMAIL,
//     private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//   };

//   return new google.auth.JWT(
//     credentials.client_email,
//     null,
//     credentials.private_key,
//     ['https://www.googleapis.com/auth/analytics.readonly']
//   );
// };

// export default async function handler(req, res) {
//   if (req.method !== 'POST') {
//     return res.status(405).json({ message: 'Method not allowed' });
//   }

//   try {
//     const { period, eventFilter, includeErrors } = req.body;
//     const auth = getAnalyticsAuth();
//     await auth.authorize();

//     const propertyId = `properties/${process.env.FIREBASE_GA_PROPERTY_ID}`;
//     const dateRange = calculateDateRange(period);

//     // Fetch events based on your AnalyticsService events
//     const eventsReport = await analytics.properties.runReport({
//       auth,
//       property: propertyId,
//       requestBody: {
//         dateRanges: [dateRange],
//         dimensions: [
//           { name: 'eventName' },
//           { name: 'customEvent:user_id' },
//           { name: 'platform' },
//           { name: 'dateHourMinute' }
//         ],
//         metrics: [{ name: 'eventCount' }],
//         dimensionFilter: eventFilter !== 'all' && eventFilter !== 'errors' ? {
//           filter: {
//             fieldName: 'eventName',
//             stringFilter: {
//               matchType: 'EXACT',
//               value: eventFilter
//             }
//           }
//         } : {
//           filter: {
//             fieldName: 'eventName',
//             inListFilter: {
//               values: [
//                 'login',
//                 'sign_up', 
//                 'view_item', // tour_viewed
//                 'purchase', // tour_booked
//                 'search',
//                 'tour_created',
//                 'prayer_time_viewed',
//                 'guide_verification_status',
//                 'guide_profile_completed',
//                 'add_to_wishlist',
//                 'share',
//                 'notification_interaction'
//               ]
//             }
//           }
//         },
//         orderBys: [{ dimension: { dimensionName: 'dateHourMinute' }, desc: true }],
//         limit: 100
//       }
//     });

//     // Fetch error events if requested
//     let errorsReport = null;
//     if (includeErrors) {
//       errorsReport = await analytics.properties.runReport({
//         auth,
//         property: propertyId,
//         requestBody: {
//           dateRanges: [dateRange],
//           dimensions: [
//             { name: 'customEvent:error_type' },
//             { name: 'customEvent:error_message' },
//             { name: 'customEvent:user_id' },
//             { name: 'customEvent:screen_name' },
//             { name: 'platform' },
//             { name: 'dateHourMinute' }
//           ],
//           metrics: [{ name: 'eventCount' }],
//           dimensionFilter: {
//             filter: {
//               fieldName: 'eventName',
//               stringFilter: {
//                 matchType: 'EXACT',
//                 value: 'app_error'
//               }
//             }
//           },
//           orderBys: [{ dimension: { dimensionName: 'dateHourMinute' }, desc: true }],
//           limit: 50
//         }
//       });
//     }

//     // Get additional event parameters
//     const eventDetailsReport = await analytics.properties.runReport({
//       auth,
//       property: propertyId,
//       requestBody: {
//         dateRanges: [dateRange],
//         dimensions: [
//           { name: 'eventName' },
//           { name: 'customEvent:tour_id' },
//           { name: 'customEvent:tour_name' },
//           { name: 'customEvent:city' },
//           { name: 'customEvent:price' },
//           { name: 'customEvent:login_method' },
//           { name: 'customEvent:user_type' },
//           { name: 'customEvent:search_term' },
//           { name: 'customEvent:prayer_name' },
//           { name: 'customEvent:guide_id' }
//         ],
//         metrics: [{ name: 'eventCount' }],
//         limit: 100
//       }
//     });

//     // Process the data
//     const events = processEventsData(eventsReport.data, eventDetailsReport.data);
//     const errors = includeErrors ? processErrorsData(errorsReport?.data) : [];
//     const stats = calculateStats(events, errors);

//     res.status(200).json({
//       success: true,
//       data: {
//         events,
//         errors,
//         stats
//       },
//       period,
//       lastUpdated: new Date().toISOString()
//     });

//   } catch (error) {
//     console.error('Firebase Events API Error:', error);
//     res.status(500).json({
//       success: false,
//       message: 'Failed to fetch Firebase events data',
//       error: error.message
//     });
//   }
// }

// // Helper function to process events data
// function processEventsData(eventsData, detailsData) {
//   if (!eventsData.rows) return [];

//   const eventDetails = new Map();
  
//   // Build a map of event details
//   if (detailsData?.rows) {
//     detailsData.rows.forEach(row => {
//       const eventName = row.dimensionValues[0]?.value;
//       const key = eventName;
      
//       if (!eventDetails.has(key)) {
//         eventDetails.set(key, {});
//       }
      
//       const details = eventDetails.get(key);
      
//       // Add parameters based on event type
//       if (row.dimensionValues[1]?.value && row.dimensionValues[1].value !== '(not set)') {
//         details.tourId = row.dimensionValues[1].value;
//       }
//       if (row.dimensionValues[2]?.value && row.dimensionValues[2].value !== '(not set)') {
//         details.tourName = row.dimensionValues[2].value;
//       }
//       if (row.dimensionValues[3]?.value && row.dimensionValues[3].value !== '(not set)') {
//         details.city = row.dimensionValues[3].value;
//       }
//       if (row.dimensionValues[4]?.value && row.dimensionValues[4].value !== '(not set)') {
//         details.price = parseFloat(row.dimensionValues[4].value);
//       }
//       if (row.dimensionValues[5]?.value && row.dimensionValues[5].value !== '(not set)') {
//         details.loginMethod = row.dimensionValues[5].value;
//       }
//       if (row.dimensionValues[6]?.value && row.dimensionValues[6].value !== '(not set)') {
//         details.userType = row.dimensionValues[6].value;
//       }
//       if (row.dimensionValues[7]?.value && row.dimensionValues[7].value !== '(not set)') {
//         details.searchTerm = row.dimensionValues[7].value;
//       }
//       if (row.dimensionValues[8]?.value && row.dimensionValues[8].value !== '(not set)') {
//         details.prayerName = row.dimensionValues[8].value;
//       }
//       if (row.dimensionValues[9]?.value && row.dimensionValues[9].value !== '(not set)') {
//         details.guideId = row.dimensionValues[9].value;
//       }
//     });
//   }

//   // Process main events data
//   return eventsData.rows.map((row, index) => {
//     const eventName = row.dimensionValues[0]?.value || 'unknown';
//     const userId = row.dimensionValues[1]?.value || 'anonymous';
//     const platform = row.dimensionValues[2]?.value || 'unknown';
//     const dateTime = row.dimensionValues[3]?.value || '';
    
//     // Convert dateHourMinute (YYYYMMDDHHMM) to ISO timestamp
//     const timestamp = convertDateHourMinuteToISO(dateTime);
    
//     // Get event-specific parameters
//     const details = eventDetails.get(eventName) || {};
    
//     return {
//       id: index + 1,
//       eventName: mapEventName(eventName),
//       timestamp,
//       parameters: details,
//       userId,
//       platform: platform.toLowerCase()
//     };
//   }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
// }

// // Helper function to process errors data
// function processErrorsData(errorsData) {
//   if (!errorsData?.rows) return [];

//   return errorsData.rows.map((row, index) => {
//     const errorType = row.dimensionValues[0]?.value || 'unknown_error';
//     const errorMessage = row.dimensionValues[1]?.value || 'Unknown error';
//     const userId = row.dimensionValues[2]?.value || 'anonymous';
//     const screenName = row.dimensionValues[3]?.value || 'unknown_screen';
//     const platform = row.dimensionValues[4]?.value || 'unknown';
//     const dateTime = row.dimensionValues[5]?.value || '';
    
//     const timestamp = convertDateHourMinuteToISO(dateTime);
    
//     return {
//       id: index + 1,
//       errorType,
//       errorMessage,
//       stackTrace: 'Stack trace not available from Analytics', // Analytics doesn't store full stack traces
//       timestamp,
//       userId,
//       screenName,
//       platform: platform.toLowerCase()
//     };
//   }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
// }

// // Helper function to calculate stats
// function calculateStats(events, errors) {
//   const eventCounts = {};
//   let activeUsers = new Set();

//   events.forEach(event => {
//     eventCounts[event.eventName] = (eventCounts[event.eventName] || 0) + 1;
//     activeUsers.add(event.userId);
//   });

//   return {
//     totalEvents: events.length,
//     totalErrors: errors.length,
//     activeUsers: activeUsers.size,
//     topEvents: eventCounts
//   };
// }

// // Helper function to map Firebase event names to your app event names
// function mapEventName(firebaseEventName) {
//   const eventMap = {
//     'view_item': 'tour_viewed',
//     'purchase': 'tour_booked',
//     'add_to_wishlist': 'wishlist_action'
//   };
  
//   return eventMap[firebaseEventName] || firebaseEventName;
// }

// // Helper function to convert dateHourMinute to ISO timestamp
// function convertDateHourMinuteToISO(dateHourMinute) {
//   if (!dateHourMinute || dateHourMinute.length !== 12) {
//     return new Date().toISOString();
//   }
  
//   const year = dateHourMinute.substr(0, 4);
//   const month = dateHourMinute.substr(4, 2);
//   const day = dateHourMinute.substr(6, 2);
//   const hour = dateHourMinute.substr(8, 2);
//   const minute = dateHourMinute.substr(10, 2);
  
//   const date = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
//   return date.toISOString();
// }

// // Helper function to calculate date range
// function calculateDateRange(period) {
//   const endDate = new Date();
//   const startDate = new Date();
  
//   switch (period) {
//     case '1h':
//       startDate.setHours(endDate.getHours() - 1);
//       break;
//     case '24h':
//       startDate.setDate(endDate.getDate() - 1);
//       break;
//     case '7d':
//       startDate.setDate(endDate.getDate() - 7);
//       break;
//     case '30d':
//       startDate.setDate(endDate.getDate() - 30);
//       break;
//     default:
//       startDate.setDate(endDate.getDate() - 1);
//   }

//   return {
//     startDate: startDate.toISOString().split('T')[0],
//     endDate: endDate.toISOString().split('T')[0]
//   };
// }