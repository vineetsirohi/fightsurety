// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// It's important to avoid vulnerabilities due to numeric overflow bugs
// OpenZeppelin's SafeMath library, when used correctly, protects agains such bugs
// More info: https://www.nccgroup.trust/us/about-us/newsroom-and-events/blog/2018/november/smart-contract-insecurity-bad-arithmetic/

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "./FlightSuretyData.sol";

/************************************************** */
/* FlightSurety Smart Contract                      */
/************************************************** */
contract FlightSuretyApp {
    using SafeMath for uint256; // Allow SafeMath functions to be called for all uint256 types (similar to "prototype" in Javascript)

    /********************************************************************************************/
    /*                                       DATA VARIABLES                                     */
    /********************************************************************************************/

    // Flight status codees
    uint8 private constant STATUS_CODE_UNKNOWN = 0;
    uint8 private constant STATUS_CODE_ON_TIME = 10;
    uint8 private constant STATUS_CODE_LATE_AIRLINE = 20;
    uint8 private constant STATUS_CODE_LATE_WEATHER = 30;
    uint8 private constant STATUS_CODE_LATE_TECHNICAL = 40;
    uint8 private constant STATUS_CODE_LATE_OTHER = 50;

    address private contractOwner; // Account used to deploy contract

    // Airlines
    // airline-to-register to airlines voting; for consensus checking
    mapping(address => address[]) public airlinesForRegistration;

    // Flights
    struct Flight {
        bool isRegistered;
        uint8 statusCode;
        uint256 updatedTimestamp;
        address airline;
    }
    mapping(bytes32 => Flight) private flights;

    /********************************************************************************************/
    /*                                       EVENT DEFINITIONS                                  */
    /********************************************************************************************/

    event AirlineRegistered(address airline, uint256 count);
    event AirlineFunded(address airline, uint256 funds);

    event InsurancePurchased(uint256 timestamp, address airline, address passenger, uint256 amount);
    event PassengerCredited(address passenger, uint256 amount);

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
        // Modify to call data contract's status
        require(true, "Contract is currently not operational");
        _; // All modifiers require an "_" which indicates where the function body will be added
    }

    /**
     * @dev Modifier that requires the "ContractOwner" account to be the function caller
     */
    modifier requireContractOwner() {
        require(msg.sender == contractOwner, "Caller is not contract owner");
        _;
    }

    // Reference Flight Surety data contract
    FlightSuretyData flightSuretyData;

    /********************************************************************************************/
    /*                                       CONSTRUCTOR                                        */
    /********************************************************************************************/

    /**
     * @dev Contract constructor
     *
     */
    constructor(address payable flightSuretyDataAddress) {
        contractOwner = msg.sender;
        flightSuretyData = FlightSuretyData(flightSuretyDataAddress);
    }

    /********************************************************************************************/
    /*                                       UTILITY FUNCTIONS                                  */
    /********************************************************************************************/

    function isOperational() public view returns (bool) {
        return flightSuretyData.isOperational(); // Modify to call data contract's status
    }

    // airlines

    // airline modifiers
    modifier requireNotAlreadyRegistered(address airline) {
        require(
            !flightSuretyData.isAirlineRegistered(airline),
            "Airline is already registered"
        );
        _;
    }

    // modifier requireFunded(address airline) {
    //     require(
    //         flightSuretyData.isFunded(airline),
    //         "Airline has not sufficiently contributed to the funds"
    //     );
    //     _;
    // }

    /********************************************************************************************/
    /*                                     SMART CONTRACT FUNCTIONS                             */
    /********************************************************************************************/
    function isAirline(address airline) external view returns (bool) {
        return flightSuretyData.isAirlineRegistered(airline);
    }

    /**
     * @dev Add an airline to the registration queue
     *
     */
    function registerAirline(address airline)
        public
        payable
        requireIsOperational
        requireNotAlreadyRegistered(airline)
        returns (bool success, uint256 votes)
    {
        if (flightSuretyData.getRegisteredAirlinesCount() < 4) {
            flightSuretyData.registerAirline(airline);

            if (flightSuretyData.isAirlineRegistered(airline)) {
                emit AirlineRegistered(
                    airline,
                    flightSuretyData.getRegisteredAirlinesCount()
                );
            }

            return (true, 33);
        } else {
            // Check consensus if more than or equal to 4 registered airlines

            // Check if not already voted
            bool isVoted = false;
            for (
                uint256 i = 0;
                i < airlinesForRegistration[airline].length;
                i++
            ) {
                if (airlinesForRegistration[airline][i] == msg.sender) {
                    isVoted = true;
                    break;
                }
            }
            require(!isVoted, "Airline has already been voted for");

            airlinesForRegistration[airline].push(msg.sender);

            // Check if enough votes to register airline
            if (
                (airlinesForRegistration[airline].length * 100).div(
                    flightSuretyData.getRegisteredAirlinesCount()
                ) >= 50
            ) {
                flightSuretyData.registerAirline(airline);

                if (flightSuretyData.isAirlineRegistered(airline)) {
                    emit AirlineRegistered(
                        airline,
                        flightSuretyData.getRegisteredAirlinesCount()
                    );
                }

                return (true, airlinesForRegistration[airline].length);
            }
            return (false, airlinesForRegistration[airline].length);
        }
    }

    function fundAirline() public payable {
        flightSuretyData.fund(msg.sender, msg.value);

        if (flightSuretyData.isFunded(msg.sender)) {
            emit AirlineFunded(
                msg.sender,
                flightSuretyData.getFunds(msg.sender)
            );
        }
    }

    function isFunded(address airline) external view returns (bool) {
        return flightSuretyData.isFunded(airline);
    }

    function buyInsurance(uint256 timestamp, address airline)
        external
        payable
        requireIsOperational
    {
        // Check if amount range is greater than 0 ether and less than 1 ether.
        require(
            (msg.value > 0 ether) && (msg.value <= 1 ether),
            "Insurance amount should be between 0 and 1 ether"
        );

        bytes32 flight = getFlightKey(timestamp, airline);

        flightSuretyData.buy(flight, airline, msg.sender, msg.value);

        emit InsurancePurchased(timestamp, airline, msg.sender, msg.value);
    }

    /**
     *  @dev Transfers eligible payout funds to insuree
     *
     */
    function creditPassenger(uint256 timestamp, address airline)
        external
        requireIsOperational
    {
        bytes32 flight = getFlightKey(timestamp, airline);
        uint256 amount = flightSuretyData.creditedAmount(msg.sender, flight);
        require(amount > 0, "No balance to withdraw");

        flightSuretyData.pay(msg.sender, flight);

        emit PassengerCredited(msg.sender, amount);
    }

    /**
     * @dev Register a future flight for insuring.
     *
     */
    function registerFlight(uint256 timestamp, address airline)
        external
    {
        bytes32 flight = getFlightKey(timestamp, airline);

        require(!flights[flight].isRegistered, "Flight is already registered");

        flights[flight] = Flight(
            true,
            STATUS_CODE_UNKNOWN,
            timestamp,
            airline
        );
    }

    function getFlightKey(uint256 timestamp, address airline)
        internal
        pure
        returns (bytes32)
    {
        return keccak256(abi.encodePacked(timestamp, airline));
    }

    /**
     * @dev Called after oracle has updated flight status
     *
     */
    function processFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) internal pure {}

    // Generate a request for oracles to fetch flight information
    function fetchFlightStatus(
        address airline,
        string memory flight,
        uint256 timestamp
    ) external {
        uint8 index = getRandomIndex(msg.sender);

        // Generate a unique key for storing the request
        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );

        // oracleResponses[key] = ResponseInfo({
        //                                         requester: msg.sender,
        //                                         isOpen: true
        //                                     });

        oracleResponses[key].requester = msg.sender;
        oracleResponses[key].isOpen = true;

        emit OracleRequest(index, airline, flight, timestamp);
    }

    // region ORACLE MANAGEMENT

    // Incremented to add pseudo-randomness at various points
    uint8 private nonce = 0;

    // Fee to be paid when registering oracle
    uint256 public constant REGISTRATION_FEE = 1 ether;

    // Number of oracles that must respond for valid status
    uint256 private constant MIN_RESPONSES = 3;

    struct Oracle {
        bool isRegistered;
        uint8[3] indexes;
    }

    // Track all registered oracles
    mapping(address => Oracle) private oracles;

    // Model for responses from oracles
    struct ResponseInfo {
        address requester; // Account that requested status
        bool isOpen; // If open, oracle responses are accepted
        mapping(uint8 => address[]) responses; // Mapping key is the status code reported
        // This lets us group responses and identify
        // the response that majority of the oracles
    }

    // Track all oracle responses
    // Key = hash(index, flight, timestamp)
    mapping(bytes32 => ResponseInfo) private oracleResponses;

    // Event fired each time an oracle submits a response
    event FlightStatusInfo(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    event OracleReport(
        address airline,
        string flight,
        uint256 timestamp,
        uint8 status
    );

    // Event fired when flight status request is submitted
    // Oracles track this and if they have a matching index
    // they fetch data and submit a response
    event OracleRequest(
        uint8 index,
        address airline,
        string flight,
        uint256 timestamp
    );

    // Register an oracle with the contract
    function registerOracle() external payable {
        // Require registration fee
        require(msg.value >= REGISTRATION_FEE, "Registration fee is required");

        uint8[3] memory indexes = generateIndexes(msg.sender);

        oracles[msg.sender] = Oracle({isRegistered: true, indexes: indexes});
    }

    function getMyIndexes() external view returns (uint8[3] memory) {
        require(
            oracles[msg.sender].isRegistered,
            "Not registered as an oracle"
        );

        return oracles[msg.sender].indexes;
    }

    // Called by oracle when a response is available to an outstanding request
    // For the response to be accepted, there must be a pending request that is open
    // and matches one of the three Indexes randomly assigned to the oracle at the
    // time of registration (i.e. uninvited oracles are not welcome)
    function submitOracleResponse(
        uint8 index,
        address airline,
        string memory flight,
        uint256 timestamp,
        uint8 statusCode
    ) external {
        require(
            (oracles[msg.sender].indexes[0] == index) ||
                (oracles[msg.sender].indexes[1] == index) ||
                (oracles[msg.sender].indexes[2] == index),
            "Index does not match oracle request"
        );

        bytes32 key = keccak256(
            abi.encodePacked(index, airline, flight, timestamp)
        );
        require(
            oracleResponses[key].isOpen,
            "Flight or timestamp do not match oracle request"
        );

        oracleResponses[key].responses[statusCode].push(msg.sender);

        // Information isn't considered verified until at least MIN_RESPONSES
        // oracles respond with the *** same *** information
        emit OracleReport(airline, flight, timestamp, statusCode);
        if (
            oracleResponses[key].responses[statusCode].length >= MIN_RESPONSES
        ) {
            emit FlightStatusInfo(airline, flight, timestamp, statusCode);

            // Handle flight status as appropriate
            processFlightStatus(airline, flight, timestamp, statusCode);
        }
    }

    function getFlightKey(
        address airline,
        string memory flight,
        uint256 timestamp
    ) internal pure returns (bytes32) {
        return keccak256(abi.encodePacked(airline, flight, timestamp));
    }

    // Returns array of three non-duplicating integers from 0-9
    function generateIndexes(address account)
        internal
        returns (uint8[3] memory)
    {
        uint8[3] memory indexes;
        indexes[0] = getRandomIndex(account);

        indexes[1] = indexes[0];
        while (indexes[1] == indexes[0]) {
            indexes[1] = getRandomIndex(account);
        }

        indexes[2] = indexes[1];
        while ((indexes[2] == indexes[0]) || (indexes[2] == indexes[1])) {
            indexes[2] = getRandomIndex(account);
        }

        return indexes;
    }

    // Returns array of three non-duplicating integers from 0-9
    function getRandomIndex(address account) internal returns (uint8) {
        uint8 maxValue = 10;

        // Pseudo random number...the incrementing nonce adds variation
        uint8 random = uint8(
            uint256(
                keccak256(
                    abi.encodePacked(blockhash(block.number - nonce++), account)
                )
            ) % maxValue
        );

        if (nonce > 250) {
            nonce = 0; // Can only fetch blockhashes for last 256 blocks so we adapt
        }

        return random;
    }

    // endregion
}
