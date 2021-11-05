
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

        assert.equal(await config.flightSuretyApp.isAirline.call(config.firstAirline), true, "Airline should be registered");

        let amount = web3.utils.toWei('10', 'ether');
        await config.flightSuretyApp.fundAirline(amount, { from: config.firstAirline });



        let fundedResult = await config.flightSuretyData.hasAirlineFunded.call(config.firstAirline);
        assert.equal(fundedResult.funded, 10, "Airline should be funded " + JSON.stringify(fundedResult));
        assert.equal(fundedResult.amount, true, "Airline should be funded");

        let registerAirlineResult = await config.flightSuretyApp.registerAirline(newAirline, { from: config.firstAirline });
        assert.equal(registerAirlineResult, 32, "Airline should be able to register another airline if it has provided funding");

        let result = await config.flightSuretyApp.isAirline.call(newAirline);

        // ASSERT
        assert.equal(result, true, "Airline should be able to register another airline if it has provided funding");

    });


});
