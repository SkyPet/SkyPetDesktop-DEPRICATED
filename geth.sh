#!/usr/bin/env bash
echo "Starting Geth"
./geth --rpc --testnet --datadir=$HOME/.ethereum --light --ipcpath=$HOME/.ethereum/testnet/geth.ipc --verbosity=3 2>> eth.log &

disown
