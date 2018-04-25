var workHelp = {};
if (window.Worker) {
    console.log("Workers available, loading functions");
    
    workHelp.makeWorker = function(code) {

        return new Worker(code);
    }

    workHelp.sendMessage(worker, obj);
    error working here;
} else {
    console.log("Workers unavailable");
}