import "core-js/stable";
import "regenerator-runtime/runtime";

import FlightSuretyApp from '../../build/contracts/FlightSuretyApp.json';
import Config from './config.json';
import Web3 from 'web3';
import express from 'express';
import { web } from 'webpack';


let config = Config['localhost'];
let web3 = new Web3(new Web3.providers.WebsocketProvider(config.url.replace('http', 'ws')));
web3.eth.defaultAccount = web3.eth.accounts[0];
let flightSuretyApp = new web3.eth.Contract(FlightSuretyApp.abi, config.appAddress);


flightSuretyApp.events.OracleRequest({
  fromBlock: 0
}, function (error, event) {
  if (error) console.log(error)
  console.log(event)
});

async function registerOracles() {

  let accounts = await web3.eth.getAccounts();
  let slicedAccounts = accounts.slice(20, 40);
  let fee = web3.utils.toWei('1', 'ether');

  for (const account of slicedAccounts) {
    // console.log('account: ' + account);

    try {

      await flightSuretyApp.methods.registerOracle().send({
        from: account, value: fee, gas: 6721975,
        gasPrice: 20000000000
      });
    } catch (e) {
      console.log('registerOracle error: ' + e);
    }

    try {
      let indexes = await flightSuretyApp.methods.getMyIndexes().call({
        from: account
      });

      console.log(`Oracle Registered: ${indexes} at ${account}`);
    } catch (e) {
      console.log('getMyIndexes error: ' + e);
    }
  }

}

setTimeout(registerOracles, 1000);

const app = express();
app.get('/api', (req, res) => {
  res.send({
    message: 'An API for use with your Dapp!'
  })
})

export default app;


