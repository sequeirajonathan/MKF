//Dependencies
const fs = require('fs');

const {
  convertKeysToObjectArray,
  convertDateToISO,
  renameSegmentKeyProps,
  isOrderedSegment,
} = require('./utils/utils');

var startTime = performance.now();

// Get input data from data folder
const jsonData = fs.readFileSync('./data/input.json');

// Parse JSON
const parsedData = JSON.parse(jsonData);

// Combine objects and pre-append isSlate property
const eventObjects = convertKeysToObjectArray({
  ...Object.assign({}, parsedData.data.slate_events),
  ...parsedData.data.sporting_events,
}, Object.keys(parsedData.data.slate_events));

// Store sorted event objects with new properties to match output file
const eventsObjectSorted = [];

// sort eventObjects array
eventObjects.sort((a, b) => {
  // Create temp object to store new key value data
  let ev = {
    event: {
      id:
        a.isSlate !== true
          ? a.event.iGameCodeGlobalId
          : a.event.szDescriptor.toLowerCase().replace(/ /g, '_'),
      gameType: '18',
      date: convertDateToISO(a.event.date, a.event.time),
      time: a.event.time,
      gameID: a.event.iGameCodeGlobalId,
      homeTeam: a.isSlate !== true ? a.event.homeTeam : null,
      homeTeamName: a.isSlate !== true ? a.event.homeTeamName : null,
      homeTeamCity: a.isSlate !== true ? '' : null,
      homeTeamLogoUri: a.isSlate !== true ? a.event.homeTeamLogoUri : null,
      visitingTeam: a.isSlate !== true ? a.event.visitingTeam : null,
      visitingTeamName: a.isSlate !== true ? a.event.visitingTeamName : null,
      visitingTeamCity: a.isSlate !== true ? '' : null,
      visitingTeamLogoUri:
        a.isSlate !== true ? a.event.visitingTeamLogoUri : null,
      teams: a.isSlate !== true ? a.event.teams : null,
      sp: a.event.sp,
      section: 'featured',
      segment: a.event.segment,
      bestOf:
        a.isSlate !== true && a.event?.szGameType
          ? parseInt(a.event.szGameType.replace(/[^0-9]/g, ''))
          : 1,
      gameMode: a.event.eGameMode,
      assoc: a.isSlate !== true ? a.event.assoc : null,
      tournamentDisplayName:
        a.isSlate !== true ? a.event.szTournamentDisplayName : null,
      segmentKey:
        a.isSlate !== true && renameSegmentKeyProps(a.event.segment)[0]
          ? renameSegmentKeyProps(a.event.segment)[1]
          : a.event.segment,
    },
    isSlate: a.isSlate,
    isStacked: false,
    sp: a.event.sp,
  };

  // Remove object properties from temp object with null values
  Object.keys(ev.event).forEach((key) => {
    ev.event[key] == null && delete ev.event[key];
    if (ev.event[key] == '') ev.event[key] = null;
  });

  //Push sorted object to eventsObjectSorted array
  eventsObjectSorted.push(ev);

  // Sort objects by date ISO values
  return a.event.date < b.event.date ? -1 : a.event.date > b.event.date ? 1 : 0;
});

const groupedEvents = eventsObjectSorted.reduce((accArray, currentObject, index) => {
    // Array is empty
    if (accArray.length === 0) {
      // if current object has a segmentKey of firstGame then insert an array of event {event: []}
      if (currentObject.event.segmentKey === 'firstGame') {
        accArray.push({
          event: [currentObject],
          isSlate: currentObject.isSlate,
          isStacked: true,
          sp: currentObject.event.sp,
        });
      } else { // insert object
        accArray.push({
          event: currentObject.event,
          isSlate: currentObject.isSlate,
          isStacked: false,
          sp: currentObject.event.sp,
        });
      }
    } 
    // Check if the previous event object is an array and if bestOf value mathes the length of the event array
    else if (Array.isArray(accArray[accArray.length - 1]?.event) && accArray[accArray.length - 1].event.length !== accArray[accArray.length - 1].event[0].bestOf ) {
      // if event is an array search through eventsObjectSorted and group if the meet the conditions
      for (let i = index ; i < eventsObjectSorted.length; i++) {
          if (
            eventsObjectSorted[i]?.event.date.split('T')[0] === currentObject.event.date.split('T')[0] &&
            eventsObjectSorted[i]?.event.teams === currentObject.event.teams &&
            isOrderedSegment(eventsObjectSorted[i]?.event.segmentKey)
          ) {
            if(accArray[accArray.length - 1].event.length < accArray[accArray.length - 1].event[0].bestOf ){
              accArray[accArray.length - 1].event.push(eventsObjectSorted[i].event);
            } else {
              break;
            }
          }
        }
      } // run logic when previous object event is not an array and check if the oject has a segment key og firtGame to push event array
      else if (currentObject.event.segmentKey === 'firstGame') {
        accArray.push({
          event: [currentObject.event],
          isSlate: currentObject.isSlate,
          isStacked: true,
          sp: currentObject.event.sp,
        });
      } 
      // Becaause the reducer keeps going with the current event if event is an isOrderedSegment then skip  if not insert the object
      else {
        if(!isOrderedSegment(currentObject.event.segmentKey))
          accArray.push({
            event: currentObject.event,
            isSlate: currentObject.isSlate,
            isStacked: false,
            sp: currentObject.event.sp,
          });
      }

    // returns the next iteration  
    return accArray;
  },
  []
);

// Write file to data/output.json
fs.writeFile(
  './data/output.json',
  JSON.stringify(groupedEvents, null, 4),
  (err) => {
    let endTime = performance.now();
    if (err) {
      console.error('Check JSON file for errors');
    }
    console.log(`Completion time:  ${endTime - startTime} ms`);
  }
);
