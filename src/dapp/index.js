
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';

(async () => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            console.log(error, result);
            display('Operational Status', 'Check if contract is operational', [{ label: 'Operational Status', error: error, value: result }]);
        });

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let airline = DOM.elid('status-airline').value;
            let flight = DOM.elid('status-flight').value;
            // Write transaction
            contract.fetchFlightStatus(airline, flight, (error, result) => {
                // display('Oracles', 'Trigger oracles', [{ label: 'Fetch Flight Status', error: error, value: JSON.stringify(result) }]);
                console.log('Fetch Flight Status: ' + JSON.stringify(error));
                displaySimple([{ label: 'Fetch Flight Status', error: error, value: result }], "status-display-wrapper");
            });
        })

        DOM.elid('register-airline').addEventListener('click', () => {
            let airlineAddress = DOM.elid('airline-address').value;

            contract.registerAirline(airlineAddress, (error, result) => {
                // console.log('Registering airline ' + error.message);
                displaySimple([{ label: 'Registering airline', error: error.message, value: result }], "registration-display-wrapper");
            });
        })

        DOM.elid('fund').addEventListener('click', () => {
            let airlineAddress = DOM.elid('airline-address').value;

            contract.fundAirline((error, result) => {
                // displaySimple('Airline', 'fund', [{ label: 'fund airline', error: error, value: result.airline + ' ' + result.timestamp }]);
                displaySimple([{ label: 'Airline funding result', error: error, value: JSON.stringify(result) }], "funding-display-wrapper");
            });
        })

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let airlineAddress = DOM.elid('insurance-airline').value;
            let flight = DOM.elid('insurance-flight').value;
            let amount = DOM.elid('insurance-amount').value;

            contract.buyInsurance(flight, airlineAddress, amount, (error, result) => {
                displaySimple([{ label: 'Buy Insurance', error: error, value: JSON.stringify(result) }], "insurance-display-wrapper");
            });
        })

    });


    contract.flightSuretyApp.events.AirlineRegistered({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log("Airline registered event " + JSON.stringify(event.returnValues))
        displaySimple([{ label: 'Airline registered event', error: error, value: JSON.stringify(event.returnValues) }], "registration-display-wrapper");
    });

    contract.flightSuretyApp.events.AirlineRegistrationConsensus({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log("Airline registration consensus event " + JSON.stringify(event.returnValues))
        displaySimple([{ label: 'Airline registration consensus event', error: error, value: JSON.stringify(event.returnValues) }], "registration-display-wrapper");
    });

    contract.flightSuretyApp.events.AirlineFunded({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log("Airline funded event " + JSON.stringify(event.returnValues))
        displaySimple([{ label: 'Airline funded event', error: error, value: JSON.stringify(event.returnValues) }], "funding-display-wrapper");
    });

    contract.flightSuretyApp.events.InsurancePurchased({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log("Insurance purchased event " + JSON.stringify(event.returnValues))
        displaySimple([{ label: 'Insurance purchased event', error: error, value: JSON.stringify(event.returnValues) }], "insurance-display-wrapper");
    });

    contract.flightSuretyApp.events.PassengerCredited({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log("Passenger credited event " + JSON.stringify(event.returnValues))
        displaySimple([{ label: 'Passenger credited event', error: error, value: JSON.stringify(event.returnValues) }], "insurance-display-wrapper");
    });

    contract.flightSuretyApp.events.CreditInsurees({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log("Credit insurees event " + JSON.stringify(event.returnValues))
        displaySimple([{ label: 'Credit insurees event', error: error, value: JSON.stringify(event.returnValues) }], "insurance-display-wrapper");
    });

    contract.flightSuretyApp.events.OracleRequest({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log("OracleRequest event " + JSON.stringify(event.returnValues))
        displaySimple([{ label: 'OracleRequest event', error: error, value: JSON.stringify(event.returnValues) }], "oracle-request-display-wrapper");
    });

    contract.flightSuretyApp.events.OracleReport({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log("OracleReport event " + JSON.stringify(event.returnValues))
        displaySimple([{ label: 'OracleReport event', error: error, value: JSON.stringify(event.returnValues) }], "oracle-report-display-wrapper");
    });

    contract.flightSuretyApp.events.FlightStatusInfo({
        fromBlock: 0
    }, function (error, event) {
        if (error) console.log(error)
        console.log("FlightStatusInfo event " + JSON.stringify(event.returnValues))
        displaySimple([{ label: 'FlightStatusInfo event', error: error, value: JSON.stringify(event.returnValues) }], "status-display-wrapper");
    });

})();


function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value' }, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}

function displaySimple(results, divId) {

    let displayDiv = DOM.elid(divId);
    let section = DOM.section();
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        // row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
        row.appendChild(DOM.p({ className: 'col-sm-12 field-value' }, result.label + ': ' +
            (result.error ? String(result.error) : String(result.value))));
        section.appendChild(row);
    })

    while (displayDiv.hasChildNodes()) {
        displayDiv.removeChild(displayDiv.firstChild);
    }
    displayDiv.appendChild(section);
}







