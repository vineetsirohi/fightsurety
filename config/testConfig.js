var FlightSuretyApp = artifacts.require("FlightSuretyApp");
var FlightSuretyData = artifacts.require("FlightSuretyData");
var BigNumber = require('../node_modules/bignumber.js');

var Config = async function(accounts) {
    
    // These test addresses are useful when you need to add
    // multiple users in test scripts
    let testAddresses = [
        "0x69e1CB5cFcA8A311586e3406ed0301C06fb839a2",
        "0xF014343BDFFbED8660A9d8721deC985126f189F3",
        "0x0E79EDbD6A727CfeE09A2b1d0A59F7752d5bf7C9",
        "0x9bC1169Ca09555bf2721A5C9eC6D69c8073bfeB4",
        "0xa23eAEf02F9E0338EEcDa8Fdd0A73aDD781b2A86",
        "0x6b85cc8f612d5457d49775439335f83e12b8cfde",
        "0xcbd22ff1ded1423fbc24a7af2148745878800024",
        "0xc257274276a4e539741ca11b590b9447b26a8051",
        "0x2f2899d6d35b1a48a4fbdc93a37a72f264a9fca7"
    ];

//     Accounts:
// (0) 0x90f6a129a8f1384c8458629ca7a38a79d4bd08a0
// (1) 0xf59f23b03c53af29a972c0dd8eda935cbbae5efc
// (2) 0x03340bc262b9cdbc4227baaefcc443d4dddcbc70
// (3) 0x8df11573e8a48ab8bf17550de997b9adf3b115cf
// (4) 0x8042422cb4878cb82cb0565dae22bdeb679f22e6
// (5) 0xe30f1bb97809a2a36c466a01407a349454a94bf9
// (6) 0x040f9d6a885f5b115555a214a1031ebe76328886
// (7) 0x6844058c3998538d591ef8941366fcd878ff9377
// (8) 0x9325661cf10e9aec1c9d2f71b4039accbc97d4c1
// (9) 0xe1eeadd9ac5412989f59b43cde92e5be0a3f341f


    let owner = accounts[0];
    let firstAirline = accounts[1];

    let flightSuretyData = await FlightSuretyData.new(firstAirline);
    let flightSuretyApp = await FlightSuretyApp.new(flightSuretyData.address);

    
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