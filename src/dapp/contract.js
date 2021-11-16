import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import FlightSuretyData from '../../build/contracts/FlightSuretyData.json';
import Config from './config.json';
import Web3 from 'web3';

export default class Contract {

    constructor(network, callback) {

        this.config = Config[network];
        // this.web3 = new Web3(new Web3.providers.HttpProvider(config.url));
        this.web3 = new Web3(window.ethereum);
        this.flightSuretyApp = new this.web3.eth.Contract(FlightSuretyApp.abi, this.config.appAddress);
        this.flightSuretyData = new this.web3.eth.Contract(FlightSuretyData.abi, this.config.dataAddress);
        this.initialize(callback);
        this.owner = null;
        this.airlines = [];
        this.passengers = [];

        this.addresses = ['0x90f6a129a8f1384c8458629ca7a38a79d4bd08a0',
        '0xf59f23b03c53af29a972c0dd8eda935cbbae5efc',
        '0x03340bc262b9cdbc4227baaefcc443d4dddcbc70',
        '0x8df11573e8a48ab8bf17550de997b9adf3b115cf',
        '0x8042422cb4878cb82cb0565dae22bdeb679f22e6',
        '0xe30f1bb97809a2a36c466a01407a349454a94bf9',
        '0x040f9d6a885f5b115555a214a1031ebe76328886',
        '0x6844058c3998538d591ef8941366fcd878ff9377',
        '0x9325661cf10e9aec1c9d2f71b4039accbc97d4c1',
        '0xe1eeadd9ac5412989f59b43cde92e5be0a3f341f',
        '0x4a0846c543bba93ce07657b968d0de1ec91540be'];

    }

    initialize(callback) {
        this.web3.eth.getAccounts((error, accts) => {

            this.owner = this.addresses[0];
            console.log("Owner Account: " + this.owner);

            this.flightSuretyData.methods.authorizeCaller(this.config.appAddress)
            .send({ from: this.owner }, (error, result) => {
                        
            });

            let counter = 1;

            while (this.airlines.length < 5) {
                console.log("Registering Account: " + this.addresses[counter]);

                this.flightSuretyApp.methods
                    .registerAirline(this.addresses[counter])
                    .send({ from: this.owner }, (error, result) => {
                        
                    });

                this.airlines.push(this.addresses[counter]);

                counter++;
            }

            while (this.passengers.length < 5) {
                this.passengers.push(this.addresses[counter++]);
            }

            callback();
        });
    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner }, callback);
    }

    fetchFlightStatus(flight, callback) {
        let self = this;
        let payload = {
            airline: self.airlines[0],
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: self.owner }, (error, result) => {
                callback(error, payload);
            });
    }

    fundAirline(airlineAddress, callback) {
        let self = this;
        let fee = this.web3.utils.toWei("10", "ether");

        let payload = {
            airline: airlineAddress,
            timestamp: Math.floor(Date.now() / 1000)
        }

        self.flightSuretyApp.methods
            .fundAirline()
            .send({ from: airlineAddress, value: fee }, (error, result) => {
                callback(error, payload);
            });

    }
}