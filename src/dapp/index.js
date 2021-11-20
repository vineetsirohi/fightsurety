
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
            let flight = DOM.elid('flight-number').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display('Oracles', 'Trigger oracles', [{ label: 'Fetch Flight Status', error: error, value: JSON.stringify(result) }]);
            });
        })

        DOM.elid('register-airline').addEventListener('click', () => {
            let airlineAddress = DOM.elid('airline-address').value;

            contract.registerAirline(airlineAddress, (error, result) => {
                console.log('Registering airline ' + error.message);
                displaySimple('Airline', 'Register', [{label: '', error: error.message, value: result}]);
            });
        })

        DOM.elid('fund').addEventListener('click', () => {
            let airlineAddress = DOM.elid('airline-address').value;

            contract.fundAirline(airlineAddress, (error, result) => {
                display('Airline', 'fund', [{ label: 'fund airline', error: error, value: result.airline + ' ' + result.timestamp }]);
            });
        })

        DOM.elid('buy-insurance').addEventListener('click', () => {
            let airlineAddress = DOM.elid('insurance-airline').value;
            let amount = DOM.elid('insurance-amount').value;

            contract.buyInsurance(airlineAddress, amount, (error, result) => {
                display('Airline', 'fund', [{ label: 'Buy Insurance', error: error, value: JSON.stringify(result) }]);
            });
        })

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

function displaySimple(title, description, results) {

    let displayDiv = DOM.elid("registration-display-wrapper");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({ className: 'row' }));
        // row.appendChild(DOM.div({ className: 'col-sm-4 field' }, result.label));
        row.appendChild(DOM.div({ className: 'col-sm-8 field-value-simple' }, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })

    displayDiv.append(section);
}







