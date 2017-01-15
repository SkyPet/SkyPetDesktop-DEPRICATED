const Web3 = require('web3');
const os=require('os');
const spawn = require('child_process').spawn;
const uuid = require('node-uuid');
const web3=new Web3();
const exec = require( 'child_process' ).exec;
var CryptoJS = require("crypto-js");
const url = require('url');
const path = require('path');
const fs = require('fs');
const gethPath=process.env.gethPath?process.env.gethPath:os.homedir()+"/.ethereum/";
const gethLocations={
  production:gethPath,
  testing:gethPath+'testnet/'
};
const contractAddress='0x72c1bba9cabab4040c285159c8ea98fd36372858';
const passwordFileName='pswd.txt';
const testing=true;

const parseResults=(result)=>{ 
    //result can be in the following two formats:
    //{addedEncryption:"encryptedjsonstring""}
    //"unencryptedjsonstring""
    try{ //should always work if encrypted.  If not, tough luck.  Its the person who entered the data's fault
        const parsedResult=JSON.parse(result);
        console.log(parsedResult);
    }catch(e){
        console.log(e);
        return {attrType:"string", attrValue:result};
    }
    return parsedResult.addedEncryption?{attrType:'generic', attrValue:parsedResult.addedEncryption, isEncrypted:true}:
    Object.keys(parsedResult).reduce((cumulator, key)=>{
        return {
            attrValue:cumulator.attrValue+', '+parsedResult[key],
            attrType:cumulator.attrType+', '+key,
            isEncrypted:false
        }        
    }, {attrType:'', attrValue:'', isEncrypted:false});
}
const getAttributes=(contract, hashId, unHashedId, event)=>{
    const maxIndex=contract.getNumberOfAttributes(hashId).c[0];
    const searchResults=Array(maxIndex).fill(0).map((val, index)=>{
        const attrVal=contract.getAttribute(hashId, index);
        const parsedResult=CryptoJS.AES.decrypt(attrVal[1], unHashedId).toString(CryptoJS.enc.Utf8);
        return Object.assign(parseResults(parsedResults), {timestamp:new Date(attrVal[0].c[0]*1000)});
        //isEncrypted=false;
    });
    //results={retrievedData:searchResults};
    event.sender.send('retrievedData',JSON.stringify(searchResults));
    //wss.broadcast(JSON.stringify(results));
}

export const addAttribute=(message, hashId, unHashedId, event)=>{
    if(contract.costToAdd().greaterThan(web3.eth.getBalance(web3.eth.defaultAccount))){
        event.sender.send('error',"Not enough Ether!");
       // wss.broadcast(JSON.stringify({error:"Not enough Ether!"}));
        return;
    }
    contract.addAttribute.sendTransaction(hashId, CryptoJS.AES.encrypt(message, unHashedId).toString(),
    {value:contract.costToAdd(), gas:3000000}, (err, results)=>{
        if(err){
            console.log(err);
            //console.log(results);
        }
        else{
            console.log(results);
        }
    });
    contract.attributeAdded({_petid:hashId}, (error, result)=>{
        if(error){
            console.log(error);
            return;
        }
        console.log(result);
        getAttributes(contract, hashId, unHashedId, event);
        event.sender.send('moneyInAccount',JSON.stringify(web3.fromWei(web3.eth.getBalance(web3.eth.defaultAccount))))
    });
}
function runWeb3(event, cb){
    web3.setProvider(new web3.providers.HttpProvider('http://localhost:8545'));
    var abi =[{"constant":false,"inputs":[],"name":"kill","outputs":[],"payable":false,"type":"function"},{"constant":false,"inputs":[],"name":"getRevenue","outputs":[],"payable":true,"type":"function"},{"constant":true,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"index","type":"uint256"}],"name":"getAttribute","outputs":[{"name":"","type":"uint256"},{"name":"","type":"string"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"owner","outputs":[{"name":"","type":"address"}],"payable":false,"type":"function"},{"constant":true,"inputs":[],"name":"costToAdd","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":true,"inputs":[{"name":"_petid","type":"bytes32"}],"name":"getNumberOfAttributes","outputs":[{"name":"","type":"uint256"}],"payable":false,"type":"function"},{"constant":false,"inputs":[{"name":"_petid","type":"bytes32"},{"name":"_attribute","type":"string"}],"name":"addAttribute","outputs":[],"payable":true,"type":"function"},{"inputs":[],"type":"constructor"},{"payable":false,"type":"fallback"},{"anonymous":false,"inputs":[{"indexed":false,"name":"_petid","type":"bytes32"},{"indexed":false,"name":"_attribute","type":"string"}],"name":"attributeAdded","type":"event"}];
    console.log(web3.eth.accounts[0]);
    if(web3.eth.accounts.length>0){
        web3.eth.defaultAccount=web3.eth.accounts[0];
    }
    contract=web3.eth.contract(abi).at(contractAddress);
    cb?cb(contract):console.log("Contract Initiated");
    console.log(contract);

    event.sender.send('accounts', JSON.stringify(web3.eth.defaultAccount));
    event.sender.send('constractAddress', JSON.stringify(contractAddress));
    event.sender.send('cost', web3.fromWei(contract.costToAdd()).toString());
    event.sender.send('moneyInAccount', web3.fromWei(web3.eth.getBalance(web3.eth.defaultAccount)));
    
    
    
}
const getGethPath=(fileName, isTest)=>{
  return (isTest?gethLocations.testing:gethLocations.production)+fileName;
}
const runGeth=(password, event, ipcPath, cb)=>{
  exec('./geth --exec "personal.unlockAccount(eth.accounts[0], \''+password+'\', 0)" attach ipc:'+ipcPath, (err, stdout, stderr)=>{
      stdout=stdout.trim();
      if(err||(stdout!=="true")){
          return console.log(err||stdout);
      }
      else{
          console.log("open");
          runWeb3(event, cb);
      }
  });
}
const checkPswd=(datadir, event,ipcPath, cb)=>{
  const pswd=path.join(__dirname, passwordFileName);
  exec('./geth '+datadir+'  account list', (err, stdout, stderr)=>{
        if(err||!stdout){
            var value=uuid.v1().replace(/-/g, "");
            fs.writeFile(pswd, value, (err)=>{
                if(err) {
                    return console.log(err);
                }
                exec('./geth '+datadir+' --password '+passwordFileName+' account new', (err, stdout, stderr)=>{
                    if(err){
                        return console.log(err);
                    }
                    runGeth(value,event, ipcPath, cb);
                });
            });
        }
        else{
            fs.readFile(pswd, 'utf8', (err, data)=>{
                if(err){
                    return console.log(err);
                }
                runGeth(data, event, ipcPath,  cb);
            });
        }
        
    });
}
const getHeaders=(data)=>{
    const headerIndex=data.indexOf("headers");
    const numHeaders=data.substring(headerIndex-4, headerIndex).trim();
    //console.log(numHeaders);
    return numHeaders?parseFloat(numHeaders):100;

}
export const getEthereumStart=(event)=>{
    const ipcPath=getGethPath('geth.ipc', testing);
    const ethPath=getGethPath("", false);
    const datadir='--datadir '+getGethPath('geth/lightchaindata', testing);
    const geth = spawn("./geth", ['--rpc', '--testnet', '--datadir='+getGethPath("", false), '--light', '--ipcpath='+ipcPath]);

    var isFirst=true;
    geth.stdout.on('data', (data) => {
        console.log(`stdout: ${data}`);
    });
    
    geth.stderr.on('data', (data) => {
        console.log(getHeaders(data+""));
        if(getHeaders(data+"")>1&&isFirst){
            event.sender.send('sync', 'syncing');
        }
        else{
            event.sender.send('sync', 'complete');
            if(testing){
                var unHashedId="MyId4";
                checkPswd(datadir, event, ipcPath, (contract)=>{
                    hashId=web3.sha3(unHashedId);
                    event.sender.send('petId', hashId);
                    getAttributes(contract, hashId, unHashedId);
                });
            }
            else{
                checkPswd(datadir, event, ipcPath);
            }
            isFirst=false;
        }
        /*if(isFirst){
            if(testing){
                var unHashedId="MyId4";
                checkPswd(datadir, event, ipcPath, (contract)=>{
                    hashId=web3.sha3(unHashedId);
                    event.sender.send('petId', hashId);
                    getAttributes(contract, hashId, unHashedId);
                });
            }
            else{
                checkPswd(datadir, event, ipcPath);
            }
            isFirst=false;
        }*/
    });

    geth.on('close', (code) => {
        console.log(`child process exited with code ${code}`);
    });  
}