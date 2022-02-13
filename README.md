The sample JSON (input.json) file has two sets of events, sporting_events and slate_events. Please create an array that is an union of those events and the resultant array should be based on the following criteria:

1. The events should be sorted(ascending) by date and time.
2. If an event is from the slate_events array, add an attribute 'isSlate' and set it to true
3. If the teams and the event date/time are the same then combine them in a single event and store all the relevant information inside the parent array

A few things to note:
1. The total execution time of the code should not exceed 10ms.
2. The code should be written in JS (ES6/ES7) 
3. Please do not use large libraries/frameworks to get the desired result. Feel free to use utilities, like Ramda or Lodash.

Please use the output json (output.json) to test your code