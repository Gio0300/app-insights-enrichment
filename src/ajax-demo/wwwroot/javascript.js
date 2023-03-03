function appInsightsInit(sdk) {
    //*************************************************************************
    // Application Insights callbacks are called in the following order:
    //
    // addDependencyListener
    // addDependencyInitializer
    // addTelemetryInitializer
    //
    // NOTE: in this context the term 'Initializer' refers to the
    // Application Insights SDK constructs, as in, initializing the telemetry constructs 
    // before they are sent to the Application Insights collection endpoint.
    // *************************************************************************
    // addDependencyListener is called before the dependency is called from the browser
    sdk.addDependencyListener((dependencyDetails) => {
        // add a custom function to the dependency context that we can interrogate after the dependency is completed.
        dependencyDetails.context.isAborted = () => {
            if (dependencyDetails.xhr !== undefined) {
                return (dependencyDetails.xhr.ajaxData.aborted == 1);
            }
            if (dependencyDetails.init !== undefined) {
                return dependencyDetails.init.signal?.aborted;
            }
            return false;
        };
    });

    // addDependencyInitializer is called after the dependency is called from the browser but before the telemetry is packaged up to be sent to Application Insights
    sdk.addDependencyInitializer((dependencyDetails) => {
        // bubble up the isAborted function from the dependency callbacks to the telemetry callbacks. Here the item property represents the baseData property of the telemetry envelope (see the Telemetry Initializer)
        // so we bubble up our custom function so we can execute the function during addTelemetryInitializer.
        dependencyDetails.item.isAborted = dependencyDetails.context.isAborted;
    });

    // addTelemetryInitializer is called before the telemetry data is sent to Application Insights, last chance to enrich the telemetry data
    sdk.addTelemetryInitializer((envelope) => {
        if (envelope.baseData.responseCode == 0 && typeof envelope.baseData.isAborted === 'function') {
            //enrich the telemetry data with the aborted property
            envelope.data.aborted = envelope.baseData.isAborted();
            //optionally add your own custom response code to easily distinguish between request aborted by the client and other reasons for why the request failed.
            if (envelope.data.aborted) {
                envelope.baseData.responseCode = 299; //299 is an arbitrary response code. Feel free to chose a response code that better suits your needs.
                envelope.baseData.success = true;
            }

        }
    });
}

document.addEventListener("DOMContentLoaded", (event) => {

    let btnSuccessfulXHR = document.getElementById('btnSuccessfulXHR');
    btnSuccessfulXHR.addEventListener('click', async () => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener("load", (e) => console.log(e.target.response));
        xhr.open("GET", "/fastEndpoint");
        xhr.send();
    });


    let btnClientAbortXHR = document.getElementById('btnClientAbortXHR');
    btnClientAbortXHR.addEventListener('click', async () => {
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", (e) => console.log(e.target.response));
        xhr.open("GET", "/slowEndpoint");
        xhr.send();
        // abort the call before it's completed at the server
        setTimeout(() => xhr.abort(), 1500); //abort in 1.5 seconds
    });


    let btnUndefinedResponseXHR = document.getElementById('btnUndefinedResponseXHR');
    btnUndefinedResponseXHR.addEventListener('click', async () => {
        let xhr = new XMLHttpRequest();
        xhr.addEventListener("load", (e) => console.log(e.target.response));
        xhr.open("GET", "/simulateUndefinedResp");
        xhr.send();
    });


    let btnSuccessfulFetch = document.getElementById('btnSuccessfulFetch');
    btnSuccessfulFetch.addEventListener('click', async () => {
        await fetch('/fastEndpoint')
            .then((response) => response.json())
            .then((data) => console.log(data));
    });


    let btnClientAbortFetch = document.getElementById('btnClientAbortFetch');
    btnClientAbortFetch.addEventListener('click', async () => {
        let abortController = new AbortController();
        // abort the call before it's completed at the server
        setTimeout(() => abortController.abort(), 1500); //abort in 1.5 seconds

        await fetch('/slowEndpoint', {
            signal: abortController.signal
        })
            .then((response) => response.json())
            .then((data) => console.log(data));
    });


    let btnUndefinedResponseFetch = document.getElementById('btnUndefinedResponseFetch');
    btnUndefinedResponseFetch.addEventListener('click', async () => {
        await fetch('/simulateUndefinedResp')
            .then((response) => response.json())
            .then((data) => console.log(data));
    });
});