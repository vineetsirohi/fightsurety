// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";

contract FlightSuretyData {
    using SafeMath for uint256;

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    address private contractOwner; // Account used to deploy contract
    bool private operational = true; // Blocks all state changes throughout the contract if false

    mapping(address => bool) private authorizedCallers; // App contract addresses authorized to call this data contract

    // Airlines
    struct Airline {
        bool isRegistered;
        uint256 funds;
    }
    uint256 registeredAirlinesCount = 1;
    uint256 fundedAirlinesCount = 1;
    mapping(address => Airline) private airlines;

    // Insurance
    struct FlightInsurance {
        uint256 amount;
        bool isCredited;
    }

    // Flight Insurance
    mapping(bytes32 => FlightInsurance) private flightInsurances; // insurance key to insurance
    mapping(bytes32 => address[]) private passengers; // flight key to passengers

    // Passenger Insurance Claims
    mapping(bytes32 => uint256) public creditedClaims;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Constructor
     *      The deploying account becomes contractOwner
     */
    constructor(address airlineAddress) {
        contractOwner = msg.sender;
        airlines[airlineAddress] = Airline(true, 0);
    }

    /********************************************************************************************/
    /*                                       FUNCTION MODIFIERS                                 */
    /********************************************************************************************/

    // Modifiers help avoid duplication of code. They are typically used to validate something
    // before a function is allowed to be executed.

    /**
     * @dev Modifier that requires the "operational" boolean variable to be "true"
     *      This is used on all state changing functions to pause the contract in
     *      the event there is an issue that needs to be fixed
     */
    modifier requireIsOperational() {
        require(operational, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    // airline modifiers
    modifier requireNotAlreadyRegistered(address airline) {
        require(
            !airlines[airline].isRegistered,
            "Airline is already registered"
        );
        _;
    }

    modifier requireRegistered(address airline) {
        require(airlines[airline].isRegistered, "Airline is not registered");
        _;
    }

    modifier requireFunded(address airline) {
        require(
            airlines[airline].funds >= 10 ether,
            "Airline is not sufficiently contributed to the funds"
        );
        _;
    }

    modifier requireAuthorizedCaller() {
        require(
            authorizedCallers[msg.sender],
            "Calling contract is not authorized to access data"
        );
        _;
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    /**
     * @dev Get operating status of contract
     *
     * @return A bool that is the current operating status
     */
    function isOperational() public view returns (bool) {
        return operational;
    }

    /**
     * @dev Sets contract operations on/off
     *
     * When operational mode is disabled, all write transactions except for this one will fail
     */
    function setOperatingStatus(bool mode) external requireContractOwner {
        operational = mode;
    }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/

    function authorizeCaller(address contractAddress)
        external
        requireContractOwner
    {
        authorizedCallers[contractAddress] = true;
    }

    function deauthorizeContract(address contractAddress)
        external
        requireContractOwner
    {
        delete authorizedCallers[contractAddress];
    }

    /**
     * @dev Add an airline to the registration queue
     *      Can only be called from FlightSuretyApp contract
     *
     */
    function registerAirline(address airline)
        external
        requireIsOperational
        requireAuthorizedCaller
        requireNotAlreadyRegistered(airline)
    {
        airlines[airline] = Airline(true, 0);
        registeredAirlinesCount += 1;
    }

    function isAirlineRegistered(address airline) external view returns (bool) {
        return airlines[airline].isRegistered;
    }

    /**
     * @dev Initial funding for the insurance. Unless there are too many delayed flights
     *      resulting in insurance payouts, the contract should be self-sustaining
     *
     */
    function fund(address airline, uint256 amount)
        public
        payable
        requireIsOperational
        requireRegistered(airline)
    {
        airlines[airline].funds += amount;
    }

    function isFunded(address airline) external view returns (bool) {
        uint256 funds = airlines[airline].funds;
        return funds >= (10 ether);
    }

    function getFunds(address airline) external view returns (uint256 amount) {
        return airlines[airline].funds;
    }

    function getRegisteredAirlinesCount() external view returns (uint256) {
        return registeredAirlinesCount;
    }

    /**
     * @dev Buy insurance for a flight
     *
     */
    function buy(
        bytes32 flight,
        address airline,
        address passenger,
        uint256 amount
    ) external requireIsOperational {
        bool funded = airlines[airline].funds >= 10;
        require(
            funded,
            "Airline you are buying insurance from should have contributed to insurance funds"
        );

        bytes32 insuranceKey = getInsuranceKey(passenger, flight);
        require(
            flightInsurances[insuranceKey].amount == 0,
            "Passenger is already insured"
        );

        flightInsurances[insuranceKey] = FlightInsurance(amount, false);
        fund(airline, amount);

        passengers[flight].push(passenger);
    }

    /**
     *  @dev Credits payouts to insurees
     */
    function creditInsurees(bytes32 flight) external {
        for (uint256 i = 0; i < passengers[flight].length; i++) {
            address passenger = passengers[flight][i];
            bytes32 key = getInsuranceKey(passenger, flight);
            uint256 amount = flightInsurances[key].amount.mul(3).div(2);

            creditedClaims[key] = amount;
        }
    }

    function creditedAmount(address passenger, bytes32 flight)
        public
        view
        returns (uint256)
    {
        return creditedClaims[getInsuranceKey(passenger, flight)];
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function pay(address passenger, bytes32 flight) external {
        bytes32 key = getInsuranceKey(passenger, flight);
        uint256 amount = creditedClaims[key];
        require(amount > 0, "Credited amount should be greater than zero");

        delete creditedClaims[key];

        payable(passenger).transfer(amount);
    }

    function getInsuranceKey(address passenger, bytes32 flight)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(passenger, flight));
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    /**
     * @dev Fallback function for funding smart contract.
     *
     */
    fallback() external payable {
        fund(msg.sender, msg.value);
    }

    receive() external payable {
        // custom function code
    }
}
