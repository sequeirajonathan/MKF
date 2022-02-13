const _ = require('lodash');
const moment = require('moment-timezone');

/**
 * @param {Date} date - date object
 * @returns {boolean} daylight savings observsation
 */
const dstObserved = (date = new Date()) => {
  const january = new Date(date.getFullYear(), 0, 1).getTimezoneOffset();
  const july = new Date(date.getFullYear(), 6, 1).getTimezoneOffset();

  return Math.max(january, july) !== date.getTimezoneOffset();
};

/**
 * @param {string} time12H - time string in 12h format
 * @returns {string} converted time string to 24h format
 */
const convertTime12to24 = (time12h) => {
  const [time, modifier] = time12h.split(' ');

  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier === 'PM') {
    hours = parseInt(hours, 10) + 12;
  }

  return `${hours}:${minutes}`;
};

/**
 * Merges the date and time properties of the event objects and returns an ISO formatted string
 * @param {Date} date - date object
 * @param {string} time - time string in hh:mm AM/PM format
 * @returns {string} ISO date string
 */
const convertDateToISO = (date, time) => {
  // check if time string matches "HH:MM Timezone/noTimezone"
  const timeReg = new RegExp(
    /([0-9]|0[0-9]|1[0-9]|2[0-3]):([0-5][0-9])\s*([AaPp][Mm])/
  );

  try {
    if (timeReg.test(time)) {
      let convertedTime = `${convertTime12to24(time)}:00`; //moment(time.replace('ET', ''), ['h:mm A']).format('HH:mm:ss');
      let convertedDate = moment(new Date(date)).format('YYYY-MM-DD');
      let dateTimeString = `${convertedDate} ${convertedTime}`;
      let gmt = 'GMT-5';

      if (dstObserved(new Date(dateTimeString))) {
        gmt = 'GMT-4';
      }

      let dateTimeObject = new Date(`${dateTimeString} ${gmt}`);
      return dateTimeObject.toISOString();
    }
  } catch (err) {
    return '';
  }

  return '';
};


/**
 * Converts object to object array
 * @param {Object} obj - events object array
 * @param {Object[string]} slateEventKeys - keys for slate events
 * @returns {Object[]} - converted object to array
 */
const convertKeysToObjectArray = (obj, slateEventKeys) => {
  let objArray = [];

  _.forOwn(obj, (value, key) => {
    if (slateEventKeys.includes(key)) {
      objArray.push({event: value, isSlate:true});
    } else {
      objArray.push({ event: value, isSlate:false });
    }
  });

  return objArray;
};


/**
 * Converts segmentKey property to new value string
 * @param {string} segment - Incoming segment property value
 * @returns {Object[boolean, string]} Array of values that determine if segment matches a string and the new name value for the property
 */
const renameSegmentKeyProps = (segment) => {
  switch (segment) {
    case '1st Game':
      return [true, 'firstGame'];
    case '2nd Game':
      return [true, 'secondGame'];
    case '3rd Game':
      return [true, 'thirdGame'];
    case '4th Game':
      return [true, 'fourthGame'];
    case '5th Game':
      return [true, 'fifthGame'];
    default:
      return [false, ''];
  }
};

/**
 * Used to determing if object should be grouped into an event array
 * @param {string} segment - Incoming segment property value
 * @returns {boolean} A match for the incoming segment
 */
const isOrderedSegment = (segment) => {
  switch (segment) {
    case 'secondGame':
    case 'thirdGame':
    case 'fourthGame':
    case 'fifthGame':
      return true;
    default:
      return false;
  }
};

module.exports = {
  convertKeysToObjectArray,
  convertDateToISO,
  renameSegmentKeyProps,
  isOrderedSegment
};
