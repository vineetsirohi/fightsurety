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

        // Change the address with the those generated by ganache/ truffle
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
        let self = this;
        this.web3.eth.getAccounts(async (error, accts) => {

            this.owner = self.addresses[0];
            console.log("Owner Account: " + self.owner);

            try {
                self.authorizeCaller((error, result) => {
                    console.log('Authorize caller: ' + error + ', ' + result);
                });
            } catch (e) {

            }


            let counter = 1;

            while (this.airlines.length < 5) {
                this.airlines.push(self.addresses[counter]);

                counter++;
            }
            console.log("Airlines: " + self.airlines);

            while (this.passengers.length < 5) {
                this.passengers.push(self.addresses[counter++]);
            }
            console.log("Passengers: " + self.passengers);

            callback();


        });




    }

    isOperational(callback) {
        let self = this;
        self.flightSuretyApp.methods
            .isOperational()
            .call({ from: self.owner }, callback);
    }

    async fetchFlightStatus(airlineAddress, flight, callback) {
        let self = this;
        let user = await window.ethereum.request({ method: 'eth_requestAccounts' });

        let payload = {
            airline: airlineAddress,
            flight: flight,
            timestamp: Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .fetchFlightStatus(payload.airline, payload.flight, payload.timestamp)
            .send({ from: user[0] }, (error, result) => {
                callback(error, payload);
            });
    }

    async registerAirline(airline, callback) {
        let self = this;
        let user = await window.ethereum.request({ method: 'eth_requestAccounts' });
        console.log("Metamask account: " + JSON.stringify(user[0]) + ', ' + JSON.stringify(self.owner) + ', ' + (user == self.owner));

        try {
            await this.flightSuretyApp.methods
                .registerAirline(airline)
                .send({ from: user[0] }, (error, result) => {
                    callback(error, result);
                });
        } catch (e) {
            callback(e, {});
        }
    }

    async fundAirline(callback) {
        let self = this;
        let fee = this.web3.utils.toWei("10", "ether");
        let user = await window.ethereum.request({ method: 'eth_requestAccounts' });

        let payload = {
            airline: user[0],
            timestamp: Math.floor(Date.now() / 1000)
        }

        self.flightSuretyApp.methods
            .fundAirline()
            .send({ from: user[0], value: fee }, (error, result) => {
                callback(error, payload);
            });

    }

    async buyInsurance(flight, airline, amount, callback) {
        let self = this;
        let user = await window.ethereum.request({ method: 'eth_requestAccounts' });
        let fee = this.web3.utils.toWei("" + amount, "ether");

        let payload = {
            flight: flight,
            airline: airline,
            amount: fee,
            timestamp: Math.floor(Date.now() / 1000)
        }
        self.flightSuretyApp.methods
            .buyInsurance(flight, airline)
            .send({ from: user[0], value: fee }, (error, result) => {
                callback(error, payload);
            });
    }

    async creditPassenger(flight, airline, callback) {
        let self = this;
        let user = await window.ethereum.request({ method: 'eth_requestAccounts' });

        self.flightSuretyApp.methods
            .creditPassenger(flight, airline)
            .send({ from: user[0] }, (error, result) => {
                callback(error, result);
            });
    }

    async checkCreditedMoney(flight, airline) {
        let self = this;
        let user = await window.ethereum.request({ method: 'eth_requestAccounts' });

        let amount = await self.flightSuretyApp.methods
            .creditedAmount(flight, airline)
            .call({ from: user[0] });
        return amount;
    }

    async getContractBalance() {
        let user = await window.ethereum.request({ method: 'eth_requestAccounts' });
        return await this.flightSuretyApp.methods.getContractBalance().call({ from: user[0] });
    }

    async authorizeCaller(callback) {
        let self = this;
        let user = await window.ethereum.request({ method: 'eth_requestAccounts' });

        if (self.owner != user[0]) {
            callback({ message: "Error: only owner, " + self.owner + ", of the contract can authorize" }, {});
        } else {
            // self.flightSuretyApp.methods
            // .creditPassenger(flight, airline)
            // .send({ from: user[0] }, (error, result) => {
            //     callback(error, result);
            // });

            self.flightSuretyData.methods.authorizeCaller(self.config.appAddress)
                .send({ from: user[0] }, (error, result) => {
                    callback(error, result);
                });
        }
    }

}