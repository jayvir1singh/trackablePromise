# trackablePromise
## Example
`const trackablePromise = require("trackablePromise");`
`var prom = new trackablePromise;`
`prom.whenResolved((value) => {`
`console.log("Promise resolved synchronously. ", value);`
`});`
`prom.then((value) => {`
`console.log("Promise resolved asynchronously. ", value);`
`});`
`prom.resolve("hello world");`
`console.log("Promise resolve function called.")`
`console.log("Promise status: " + prom.status);`
`console.log("Promise value: " + prom.value);`

## output
`Promise resolved synchronously. hello world`
`Promise resolve function called.`
`Promise status: resolved `
`Promise value: hello world `
`Promise resolved asynchronously. hello world`
