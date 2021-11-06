
var Test = require('../config/testConfig.js');
// var BigNumber = require('../node_modules/bignumber.js');
var Web3 = require('web3');

const {
    BN,           // Big Number support
    constants,    // Common constants, like the zero address and largest integers
    expectEvent,  // Assertions for emitted events
    expectRevert, // Assertions for transactions that should fail
} = require('@openzeppelin/test-helpers');



contract('Flight Surety Tests', async (accounts) => {

    var config;
    before('setup contract', async () => {
        config = await Test.Config(accounts);
        // await config.flightSuretyData.authorizeCaller(config.flightSuretyApp.address);
    });

    /****************************************************************************************/
    /* Operations and Settings                                                              */
    /****************************************************************************************/

    it(`(multiparty) has correct initial isOperational() value`, async function () {

        // Get operating status
        let status = await config.flightSuretyData.isOperational.call();
        assert.equal(status, true, "Incorrect initial operating status value");

    });

    it(`(multiparty) can block access to setOperatingStatus() for non-Contract Owner account`, async function () {

        // Ensure that access is denied for non-Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false, { from: config.testAddresses[2] });
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, true, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can allow access to setOperatingStatus() for Contract Owner account`, async function () {

        // Ensure that access is allowed for Contract Owner account
        let accessDenied = false;
        try {
            await config.flightSuretyData.setOperatingStatus(false);
        }
        catch (e) {
            accessDenied = true;
        }
        assert.equal(accessDenied, false, "Access not restricted to Contract Owner");

    });

    it(`(multiparty) can block access to functions using requireIsOperational when operating status is false`, async function () {

        await config.flightSuretyData.setOperatingStatus(false);

        let reverted = false;
        try {
            await config.flightSurety.setTestingMode(true);
        }
        catch (e) {
            reverted = true;
        }
        assert.equal(reverted, true, "Access not blocked for requireIsOperational");

        // Set it back for other tests to work
        await config.flightSuretyData.setOperatingStatus(true);

    });

    it('(airline) cannot register an Airline using registerAirline() if it is not funded', async () => {

        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        await expectRevert(
            config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline }),
            "Airline has not sufficiently contributed to the funds"
        );

        let result = await config.flightSuretyApp.isAirline.call(newAirline);

        // ASSERT
        assert.equal(result, false, "Airline should not be able to register another airline if it hasn't provided funding");

    });

    it('Can register an Airline if it has contributed funds', async () => {

        // ARRANGE
        let newAirline = accounts[2];

        // ACT
        // console.log("First airline: " + config.firstAirline);

        assert.equal(await config.flightSuretyApp.isAirline.call(config.firstAirline), true, "Airline should be registered");

        let amount = web3.utils.toWei('10', 'ether');


        let fundResult = await config.flightSuretyApp.fundAirline(amount, { from: config.firstAirline });

        let isFunded = await config.flightSuretyApp.isFunded.call(config.firstAirline);
        assert.equal(isFunded, true, "Airline should be funded ");

        let registerResult = await config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline });

        let result = await config.flightSuretyApp.isAirline.call(newAirline);

        // ASSERT
        assert.equal(result, true, "Airline should be able to register another airline if it has provided funding");

        // EVENTS
        await expectEvent(fundResult, "AirlineFunded");
        await expectEvent(registerResult, "AirlineRegistered", {
            count: "2"
        });
    });

    it('Registration of fifth and subsequent airlines requires multi-party consensus of 50% of registered airlines', async () => {

        // ARRANGE
        let secondAirline = accounts[2];
        let thirdAirline = accounts[3];
        let fourthAirline = accounts[4];
        let fifthAirline = accounts[5];

        // ACT


        // three airlines can be registered by the first airline
        await expectRevert(
            config.flightSuretyApp.registerAirline(secondAirline, { from: config.firstAirline }),
            "Airline is already registered"
        );

        await config.flightSuretyApp.registerAirline(thirdAirline, { from: config.firstAirline });
        await config.flightSuretyApp.registerAirline(fourthAirline, { from: config.firstAirline });

        // fifth airline can't be registered by single airline
        await config.flightSuretyApp.registerAirline(fifthAirline, { from: config.firstAirline });

        // ASSERT
        assert.equal(await config.flightSuretyApp.isAirline.call(thirdAirline), true, "Third airline should be registered");
        assert.equal(await config.flightSuretyApp.isAirline.call(fourthAirline), true, "Fourth airline should be registered");
        assert.equal(await config.flightSuretyApp.isAirline.call(fifthAirline), false, "Fifth airline should not be registered");


    });

    it('Airline can be registered, but does not participate in contract until it submits funding of 10 ether (make sure it is not 10 wei)', async () => {
        let amount = web3.utils.toWei('10', 'ether');
        let secondAirline = accounts[2];
        let fifthAirline = accounts[5];

        // Airline can be registered, but does not participate in contract until it submits funding of 10 ether
        await expectRevert(
            config.flightSuretyApp.registerAirline(fifthAirline, { from: secondAirline }),
            "Airline has not sufficiently contributed to the funds"
        );

        // fund second airline and use it to register the fifth airline
        await config.flightSuretyApp.fundAirline(amount, { from: secondAirline });
        let fifthRegistration = await config.flightSuretyApp.registerAirline(fifthAirline, { from: secondAirline });
        assert.equal(await config.flightSuretyApp.isAirline.call(fifthAirline), true, "Fifth airline should be registered");

        // EVENTS
        await expectEvent(fifthRegistration, "AirlineRegistered", {
            count: "5"
        });
    });
});
