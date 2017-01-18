import React,  {  Component } from 'react';
import injectTapEventPlugin from 'react-tap-event-plugin';
// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();
const CryptoJS = require("crypto-js");
const {ipcRenderer} = require('electron');
import Dialog from 'material-ui/Dialog';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import FlatButton from 'material-ui/FlatButton';
import RaisedButton from 'material-ui/RaisedButton';
import lightBaseTheme from 'material-ui/styles/baseThemes/lightBaseTheme';
import {Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarTitle} from 'material-ui/Toolbar';
import TextField from 'material-ui/TextField';
import Checkbox from 'material-ui/Checkbox';
import {Table, TableBody, TableHeader, TableHeaderColumn, TableRow, TableRowColumn} from 'material-ui/Table';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import CircularProgress from 'material-ui/CircularProgress';

import {
  Step,
  Stepper,
  StepLabel,
} from 'material-ui/Stepper';
/*import {SocialLogin} from 'react-social-login';*/

//const contractAddress='0x69De4ADbb566c1c68e8dB1274229adA4A3D9f8A8';
const blockChainView='https://testnet.etherscan.io/address/';
const selection=[
    "Temperament",
    "Name",
    "Owner", //this can be encrypted
    "Address" //this can be encrypted
];
//const port=4000;
//const url='ws://'+window.location.hostname+':'+port; 
const formatAttribute=(attributeType, attributeValue)=>{
  var obj={};
  obj[attributeType]=attributeValue;
  return obj;
}
const decrypt=(password, text)=>{ //attributeText
    var decrypted="";
    try{
      decrypted=CryptoJS.AES.decrypt(text, password).toString(CryptoJS.enc.Utf8);
    }
    catch(e){
      console.log(e);
    }
    return decrypted;
}
class TblRow extends Component {/*=({attributeText, isEncrypted, onDecrypt, timestamp, label, wrongPassword})=>{*/
  constructor(props){
    super(props);
    this.state={
      isEncrypted:this.props.isEncrypted,
      attributeText:this.props.attributeText,
      wrongPassword:false,
      password:"",
      showPasswordModal:false
    }
  }
  onDecrypt=()=>{
    this.setState({
      showPasswordModal:true
    })
  }
  onPasswordSubmit=()=>{
    const decryptedValue=decrypt(this.state.password, this.state.attributeText);
    this.setState({
      password:"",
      wrongPassword:decryptedValue?false:true,
      attributeText:decryptedValue,
      isEncrypted:decryptedValue?false:true,
      showPasswordModal:false
    }, ()=>{
      setTimeout(()=>{this.setState({wrongPassword:false})}, 3000)
    })
  }
  setPassword=(value)=>{
    this.setState({
      password:value
    })
  }
  hideModal=()=>{
    this.setState({
      showPasswordModal:false
    })
  }
  render(){
    return(
      <div>
  <PasswordModal onPassword={this.onPasswordSubmit} setPassword={this.setPassword} hidePasswordModal={this.hideModal} askForPassword={this.state.showPasswordModal}/>
      <TableRow>             
        <TableRowColumn>{this.props.timestamp}</TableRowColumn>
        <TableRowColumn> >{this.props.label}</TableRowColumn>
        <TableRowColumn>{this.state.isEncrypted?this.state.wrongPassword?<FlatButton label="Wrong Password" onClick={this.onDecrypt}/>:
            <FlatButton disabled={!this.state.isEncrypted} label="Decrypt" onClick={this.onDecrypt}/>:
          this.state.attributeText}
        </TableRowColumn>
    </TableRow>
    </div>
    );
  }
}

const AboutModal=({hideModal, show, contractAddress})=>
<Dialog
  title="About"
  actions={<FlatButton
        label="Ok"
        primary={true}
        onClick={hideModal}
      />}
  modal={false}
  open={show}
  onRequestClose={hideModal}
>
  <h4>How it works</h4>
      <p>Every pet should have a microchip which uniquely identifies itself.  A scanner can read the microchip and an ID is read.  For example, the ID may be 123.  This ID is then hashed and placed on the Ethereum blockchain.  The unhashed ID serves as a key to encrypt the name and address of the owner: hence the pet itself is needed in order to know who the owner and the address are (they are not public without knowing the ID of the pet).  This is not secure in the same sense that a human medical or banking record is secure; but as addresses are essentially public this is not a major issue.  If the medical records for the pet are not desired to be "public" then they can be encrypted using a key not associated with the microchip (eg, a password provided by the owners). 
      
      The contract that governs this is available at {contractAddress} on the blockchain.  See it <a href={blockChainView+contractAddress} target="_blank">here.</a> </p>
</Dialog>

const ErrorModal=({showError, hideError})=>
<Dialog
  title="Error!"
  actions={<FlatButton
        label="Ok"
        primary={true}
        onClick={hideError}
      />}
  modal={false}
  open={showError?true:false}
  onRequestClose={hideError}
>
 {showError}
</Dialog>


const PasswordModal=({onPassword, setPassword, hidePasswordModal, askForPassword})=>
<Dialog
  title="Enter Password"
  modal={true}
  open={askForPassword}
  onRequestClose={hidePasswordModal}
>
  <SubmitPassword onCreate={onPassword} onType={setPassword}/>
</Dialog>

const CustomToolBar=({showModal, account, moneyInAccount})=>
 <Toolbar>
  <ToolbarGroup firstChild={true}>
   <ToolbarTitle text="SkyPet" />
  </ToolbarGroup>
  <ToolbarGroup>
    <ToolbarTitle text="Account:" />
     {account}
     <ToolbarSeparator />
      {moneyInAccount==0?"Ether required!  Send the account some Ether to continue":"Balance: {moneyInAccount}" }
  </ToolbarGroup>
  <ToolbarGroup>
  <RaisedButton label="Create Broadcast" primary={true} onClick={showModal}/>
  </ToolbarGroup>
</Toolbar>

const SubmitPassword=({onCreate, onType})=>
<form onSubmit={(e)=>{e.preventDefault();onCreate();}}>
    <TextField floatingLabelText="Password" type="password" onChange={(e)=>{onType(e.target.value);}}/>
    <FlatButton label="Submit" primary={true} />
</form>
class AccountAndLogin extends Component{
  constructor(props){
    super(props);
    this.state = {
      finished: false,
      stepIndex: 0,
      hasAccount:this.props.hasAccount,
      hasPassword:false,
      password:""
    };
  }
  
  handleSubmitPassword=()=>{
    ipcRenderer.send('password', this.state.password);
    this.setState({
      hasPassword:true,
      hasAccount:true
    })
    this.handleNext();
  }
  handleTypePassword=(value)=>{
    this.setState({
      password:value
    });
  }
  handleNext = () => {
    this.setState({
      stepIndex: this.state.stepIndex + 1,
      finished: this.state.stepIndex >= 1,
    });
  };
  handlePrev = () => {
    if (this.state.stepIndex > 0) {
      this.setState({stepIndex: this.state.stepIndex - 1});
    }
  };
  getStepContent(stepIndex) {
    switch (stepIndex) {
      case 0:
        return <div><p>{this.state.hasAccount?"Password to login to account":"Enter a password to generate your account.  Don't forget this password!"}</p>
        <SubmitPassword onType={this.handleTypePassword} onCreate={this.handleSubmitPassword}/></div>;
      case 1:
        return <div>{this.props.children}</div>;
      default:
        return 'You\'re a long way from home sonny jim!';
    }
  }
  render() {
   // const {finished, stepIndex} = this.state;
    const contentStyle = {margin: '0 16px'};

    return (
      <div style={{width: '100%', maxWidth: 700, margin: 'auto'}}>
        <Stepper activeStep={this.state.stepIndex}>
          <Step>
            <StepLabel>{this.state.hasAccount?"Login":"Create Account"}</StepLabel>
            
          </Step>
          <Step>
            <StepLabel>Enjoy SkyPet!</StepLabel>
          </Step>
        </Stepper>
        <div style={contentStyle}>
          {this.getStepContent(this.state.stepIndex)}
          
        </div>
      </div>
    );
  }
}




class App extends Component {
  constructor(props){
    super(props); 
    this.state={
      name:"",
      owner:"",
      contractAddress:"",
      showNew:false,
      account:"",
      isSyncing:true,
      accountCreated:false,
      gethPasswordEntered:false,
      successSearch:false,
      cost:0,
      moneyInAccount:0,
      show:false,
      showError:"",
      addedEncryption:true,//for entering data
      historicalData:[],
      askForPassword:false,
      currentProgress:0,
      hasAccount:false,
      password:"",//for entereing data
      attributeValue:"", //for entering data
      attributeType:0 //for entering ata
    };
    ipcRenderer.send('startEthereum', 'ping')
    ipcRenderer.on('accounts', (event, arg) => {
      console.log(arg);
      this.setState({
        account:arg
      });
    })
    ipcRenderer.on('hasAccount', (event, arg) => {
      console.log(arg);
      this.setState({
        hasAccount:true
      });
    })
    ipcRenderer.on('sync', (event, arg) => {
      console.log(arg);
      this.setState(arg);
    })
    ipcRenderer.on('cost', (event, arg) => {
      console.log(arg);
      this.setState({
        cost:arg
      });
    })
    ipcRenderer.on('petId', (event, arg) => {
      console.log(arg);
      this.setState({
        petId:arg
      });
    })
    ipcRenderer.on('contractAddress', (event, arg) => {
      this.setState({
        contractAddress:arg
      });
    })
    ipcRenderer.on('moneyInAccount', (event, arg) => {
      console.log(arg);
      this.setState({
        moneyInAccount:arg
      });
    })
    ipcRenderer.on('error', (event, arg) => {
      console.log(arg);
      this.setState({
        showError:arg
      });
    })
    ipcRenderer.on('retrievedData', (event, arg) => {
      console.log(arg);
      this.retrievedData(arg);

    })
  }
  retrievedData=(arg)=>{
    const owner=arg.find((val)=>{
      console.log(val);
      return selection[val.attributeType]==='Owner'
    });
    const name=arg.find((val)=>{
      return selection[val.attributeType]==='Name'
    });
    this.setState({
      successSearch:arg[0]?true:false,
      showNew:arg[0]?false:true,
      historicalData:arg,
      name:name?name.attributeText:"",
      owner:owner?owner.attributeText:""
    });
  }
  onAttributeValue=(event)=>{
      this.setState({
          attributeValue:event.target.value
      });      
  }
  onAttributeType=(event)=>{
    //console.log(event.target.value);
      this.setState({
          attributeType:event.target.value
      });      
  }
  toggleAdditionalEncryption=()=>{
      this.setState({
          addedEncryption:!this.state.addedEncryption
      });
  }
  setPassword=(value)=>{
      this.setState({
          password:value
      });
  }
  onPassword=()=>{
    const attVal=Object.assign(formatAttribute(this.state.attributeType,CryptoJS.AES.encrypt(this.state.attributeValue, this.state.password).toString()), {addedEncryption:true});
    this.submitAttribute(attVal, attVal.attributeType);
    this.setState({
      askForPassword:false,
      password:""
    });
  }
  onSubmit=()=>{
    var obj={};
    if(this.state.addedEncryption){
      this.setState({
        askForPassword:true
      })
    }
    else{
      this.submitAttribute(formatAttribute(this.state.attributeType,this.state.attributeValue), this.state.attributeValue);
    }
  }
  submitAttribute=(formattedAttribute, attVal)=>{
    if(this.state.moneyInAccount>this.state.cost){
      ipcRenderer.send('addAttribute', formattedAttribute)
      this.setState({
        historicalData:this.state.historicalData.concat([{timestamp:new Date(), attributeText:attVal, attributeType:this.state.attributeType, isEncrypted:this.state.addedEncryption}])
      },()=>{
        this.retrievedData(this.state.historicalData);
      });
      
    }
    else{
      alert("Not enough money");
    }
    
  }
  showModal=()=>{
    this.setState({
      show:true
    });
  }
  hideModal=()=>{
    this.setState({
      show:false
    });
  }

  hidePasswordModal=()=>{
    this.setState({askForPassword: false});
  }
  hideError=()=>{
    this.setState({
      showError:""
    });
  }
  submitPassword=(event)=>{
    console.log(event);
    
  }
  createAccount=(event)=>{
    console.log(event);
  }
  render(){
      return(
        <MuiThemeProvider muiTheme={getMuiTheme(lightBaseTheme)}>
        <AccountAndLogin hasAccount={this.state.hasAccount}>
          <CustomToolBar 
            showModal={this.showModal} 
            account={this.state.account} 
            moneyInAccount={this.state.moneyInAccount}/>
          <AboutModal 
            hideModal={this.hideModal} 
            show={this.state.show} 
            contractAddress={this.state.contractAddress}/>
          <PasswordModal 
            onPassword={this.onPassword} 
            setPassword={this.setPassword}  
            hidePasswordModal={this.hidePasswordModal} 
            askForPassword={this.state.askForPassword}/>
          <ErrorModal 
            showError={this.state.showError} 
            hideError={this.hideError}/>
          {this.state.isSyncing?<CircularProgress size={80} thickness={5} mode={this.state.currentProgress>0?"determinate":null} value={this.state.currentProgress}/>:
          <div>
          <SelectField 
            floatingLabelText="Frequency"
            onChange={this.onAttributeType}
          >
            {selection.map((val, index)=>{
                return(<MenuItem key={index} value={index} primaryText={val}/>);
            })}
          </SelectField>
          <TextField
            floatingLabelText="Value"
            disabled={!this.state.petId}  onChange={this.onAttributeValue}
          />               
                     
                
    
        <Checkbox disabled={!this.state.petId}  label="Add Encryption" defaultChecked={true} onCheck={this.toggleAdditionalEncryption}/>
        <RaisedButton disabled={!this.state.petId} onClick={()=>{this.onSubmit();}} label={"Submit New Result (costs {this.state.cost} Ether)"}/>
                      
        <Table>
            
            <TableHeader>
              <TableRow>
                <TableHeaderColumn>TimeStamp</TableHeaderColumn>
                <TableHeaderColumn>Attribute</TableHeaderColumn>
                <TableHeaderColumn>Value</TableHeaderColumn>
              </TableRow>
            </TableHeader>
            {this.state.successSearch?
            <TableBody>
                {this.state.historicalData.map((val, index)=>{
                    return(
                        <TblRow key={index} timestamp={val.timestamp.toString()} attributeText={val.attributeText}  label={selection[val.attributeType]||"Unknown"} isEncrypted={val.isEncrypted}/>
                    );
                })}

            </TableBody>
            :null}
        </Table>
          </div>
          }
          
          <div className='whiteSpace'></div>
          <div className='whiteSpace'></div>
          <div className='whiteSpace'></div>
          <div className='whiteSpace'></div>
          </AccountAndLogin>
          </MuiThemeProvider>
      );
  }
}

export default App;