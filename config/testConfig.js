var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('../node_modules/bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x90f6a129a8f1384c8458629ca7a38a79d4bd08a0",
        "0xf59f23b03c53af29a972c0dd8eda935cbbae5efc",
        "0x03340bc262b9cdbc4227baaefcc443d4dddcbc70",
        "0x8df11573e8a48ab8bf17550de997b9adf3b115cf",
        "0x8042422cb4878cb82cb0565dae22bdeb679f22e6",
        "0xe30f1bb97809a2a36c466a01407a349454a94bf9",
        "0x040f9d6a885f5b115555a214a1031ebe76328886",
        "0x6844058c3998538d591ef8941366fcd878ff9377",
        "0x9325661cf10e9aec1c9d2f71b4039accbc97d4c1",
        "0xe1eeadd9ac5412989f59b43cde92e5be0a3f341f"
    ];


    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new(firstAirline);
    let flightSuretyApp = await FlightSuretyApp.new(FlightSuretyData.address);

    
    return {
        owner: owner,
        firstAirline: firstAirline,
        weiMultiple: (new BigNumber(10)).pow(18),
        testAddresses: testAddresses,
        flightSuretyData: flightSuretyData,
        flightSuretyApp: flightSuretyApp
    }
}

module.exports = {
    Config: Config
};