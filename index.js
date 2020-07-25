//#region 
/*
Note: 
    Bug test code should output "status" as "resolved" and "value" as "33" for both "a" and "b". 
    If yes then remove bug fix code from the code else if problem 
    persistes then change "If statement" to refelct to nodejs version range that is affected with bug.

        var prom = new Promise((resolve) => {
            resolve(Promise.resolve(33)); 
        });

        //--------------------------------------------------------------------------------------------------------------------------------------

        var a = new trackablePromise();
        var b = new trackablePromise();
        a.resolve(b);
        b.resolve("frfrf");
*/
//#endregion

const EventEmitter = require('events');

class customEventEmitter extends EventEmitter {}

if(process.version.startsWith("v14")) {
    console.warn(`TrackablePromise Bug: Promise can not be resolved with another promise in this version of NodeJS. The result would be an never ending pending promise. Ignore this message if the bug does not occur.`);
}

class trackablePromise extends Promise {
    constructor(executor = () => {}) {
        var resolveWrapper;
        var rejectWrapper;
        super((resolve, reject) => {
            resolveWrapper = (value) => {
                if(this.status === "pending") {
                    if(this._aborted) return;
                    if(value instanceof Object && typeof value.then === 'function') {
                        value.then((value) => {
                            resolveWrapper(value);
                        }).catch((e) => {
                            rejectWrapper(e);
                        });
                    }
                    else {
                        this.value = value;
                        this.status = "resolved";
                        try {
                            this.emit("settled", value);
                        }
                        catch(e) {
                            logErr(e);
                        }
                        try {
                            this.emit("resolved", value);
                        }
                        catch(e) {
                            logErr(e);
                        }
                    }
                    return resolve(value);
                }
            };
            rejectWrapper = (value) => {
                if(this.status === "pending") {
                    if(this._aborted) return;
                    this.value = value;
                    this.status = "rejected";
                    try {
                        this.emit("settled", value);
                    }
                    catch(e) {
                        logErr(e);
                    }
                    try {
                        this.emit("rejected", value);
                    }
                    catch(e) {
                        logErr(e);
                    }
                    return reject(value);
                }
            };
        });

        this.resolve = resolveWrapper;
        this.reject = rejectWrapper;
        this.status = "pending";
        this.value = undefined;
        this._aborted = false;
        this._executor = executor;

        var myEmitter = new customEventEmitter;
        for(let prop in myEmitter) {
            if(myEmitter.hasOwnProperty(prop)) {
                Object.defineProperty(this, prop, {
                    get() {
                        return myEmitter[prop];
                    },
                    set(val) {
                        return myEmitter[prop] = val;
                    }
                });
            }
        }

        executor(resolveWrapper, rejectWrapper);
    }
    get resolved() {
        return this.status === "resolved";
    }
    get rejected() {
        return this.status === "rejected";
    }
    get settled() {
        return this.status !== "pending";
    }
    whenResolved(func) {
        if(this.resolved) {
            try {
                func(this.value);
            }
            catch(e) {
                logErr(e);
            }
        }
        else {
            this.once("resolved", func);
        }
    }
    whenRejected(func) {
        if(this.rejected) {
            try {
                func(this.value);
            }
            catch(e) {
                logErr(e);
            }
        }
        else {
            this.once("resolved", func);
        }
    }
    whenSettled(func) {
        if(this.settled) {
            try {
                func(this.value);
            }
            catch(e) {
                logErr(e);
            }
        }
        else {
            this.once("settled", func);
        }
    }
    abort() {
        this._aborted = true;
    }
    cancel() {
        this.reject({canceled:true});
    }
}

for(let prop in customEventEmitter) {
    Object.defineProperty(trackablePromise, prop, {
        get() {
            return customEventEmitter[prop];
        },
        set(val) {
            return customEventEmitter[prop] = val;
        }
    })
}

//TODO: check if _proto_ is cloned
for(let prop in customEventEmitter.prototype) {
    Object.defineProperty(trackablePromise.prototype, prop, {
        get() {
            return customEventEmitter.prototype[prop];
        },
        set(val) {
            return customEventEmitter.prototype[prop] = val;
        }
    })
}

module.exports = trackablePromise;