import React,  {  Component } from 'react';
const CryptoJS = require("crypto-js");
const {ipcRenderer} = require('electron');
import { Button, FormControl, Grid, FormGroup, Checkbox, ControlLabel, Jumbotron, Row, Col, Modal, ProgressBar, FieldGroup} from 'react-bootstrap';
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
      <Row>             
        <Col xsHidden sm={7} >{this.props.timestamp}</Col>
        <Col xs={6} sm={2}>{this.props.label}</Col>
        <Col xs={6} sm={3} >{this.state.isEncrypted?this.state.wrongPassword?<Button bsStyle="warning" onClick={this.onDecrypt}>Wrong Password</Button>:
            <Button disabled={!this.state.isEncrypted} onClick={this.onDecrypt}>Decrypt</Button>:
          this.state.attributeText}
        </Col>
    </Row>
    </div>
    );
  }
}

const AboutModal=({hideModal, show, contractAddress})=>
<Modal
    show={show}
    onHide={hideModal}
    dialogClassName="custom-modal"
>
<Modal.Header closeButton>
    <Modal.Title id="contained-modal-title-lg">About</Modal.Title>
</Modal.Header>
  <Modal.Body>
      <h4>How it works</h4>
      <p>Every pet should have a microchip which uniquely identifies itself.  A scanner can read the microchip and an ID is read.  For example, the ID may be 123.  This ID is then hashed and placed on the Ethereum blockchain.  The unhashed ID serves as a key to encrypt the name and address of the owner: hence the pet itself is needed in order to know who the owner and the address are (they are not public without knowing the ID of the pet).  This is not secure in the same sense that a human medical or banking record is secure; but as addresses are essentially public this is not a major issue.  If the medical records for the pet are not desired to be "public" then they can be encrypted using a key not associated with the microchip (eg, a password provided by the owners). 
      
      The contract that governs this is available at {contractAddress} on the blockchain.  See it <a href={blockChainView+contractAddress} target="_blank">here.</a> </p>
  </Modal.Body>
  <Modal.Footer>
      <Button onClick={hideModal}>Close</Button>
  </Modal.Footer>
</Modal>
const ErrorModal=({showError, hideError})=>
<Modal
    show={showError?true:false}
    onHide={hideError}
    dialogClassName="custom-modal"
>
<Modal.Header closeButton>
    <Modal.Title id="contained-modal-title-lg">Error!</Modal.Title>
</Modal.Header>
  <Modal.Body>
      {showError}
  </Modal.Body>
  <Modal.Footer>
      <Button onClick={hideError}>Close</Button>
  </Modal.Footer>
</Modal>
const PasswordModal=({onPassword, setPassword, hidePasswordModal, askForPassword})=>
<Modal
    show={askForPassword}
    dialogClassName="custom-modal"
    onHide={hidePasswordModal}
>
  <Modal.Body>
      <form onSubmit={(e)=>{e.preventDefault();onPassword();}}>
          <FormGroup>
              <ControlLabel>Password</ControlLabel>
              <FormControl autoFocus={true} 
                  type="password" onChange={(e)=>{setPassword(e.target.value);}}/>
          </FormGroup>
          <Button bsStyle="primary" onClick={onPassword}>Submit</Button>
      </form>
  </Modal.Body>

</Modal>
const CustomJumbo=({showModal, account, moneyInAccount})=>
<Jumbotron>
    <Grid>
        <h1>SkyPet</h1>
        <p>Input and access animal records: decentralized, immutable, and secure.  <a  onClick={showModal}>Learn More!</a></p>
        Account: {account} <br></br> Balance: {moneyInAccount} <br></br>   {moneyInAccount==0?"Ether required!  Send the account some Ether to continue":null}.
    </Grid>
</Jumbotron>

const SubmitPassword=({onCreate, label})=>
<form onSubmit={(event)=>{event.preventDefault();onCreate(event);}}>
  <FieldGroup
      id="formControlsPassword"
      label={label}
      type="password"
    />
    <Button type='submit'>Submit</Button>
</form>



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
        
        <div>
          <CustomJumbo 
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
          {(!this.state.accountCreated)?<SubmitPassword label="Enter password to generate account.  Don't forget this password!" onCreate={this.createAccount}/>:(!this.state.gethPasswordEntered)?<SubmitPassword label="Enter Geth account password" onCreate={this.submitPassword}/>:this.state.isSyncing?<ProgressBar now={this.state.currentProgress>0?this.state.currentProgress:100} active={this.state.currentProgress>0?false:true}/>:
            <Grid>
              <Row className="show-grid">
                  
                  <Col xs={12} md={6}>
                      {this.state.successSearch?
                          <div size={16}>Hello {this.state.owner}, {this.state.name} is in good hands! Did something new happen in {this.state.name}'s life?  Record it on the right!  Or view current and past events below.</div>
                      :this.state.showNew?"This is the first time your pet has been scanned!  Enter the name of the pet and owner!":null}
                  </Col>
                  <Col xs={12} md={6}>
                      
                      <FormGroup>
                          <ControlLabel>Type</ControlLabel>
                          <FormControl componentClass="select" placeholder="select" disabled={!this.state.petId} onChange={this.onAttributeType}>
                              {selection.map((val, index)=>{
                                  return(<option key={index} value={index}>{val}</option>);
                              })}
                          </FormControl>
                      </FormGroup>
                      
                      <FormGroup>
                          <ControlLabel>Value</ControlLabel>
                          <FormControl type="text" disabled={!this.state.petId}  onChange={this.onAttributeValue}/>
                          
                      </FormGroup>
                      <Checkbox disabled={!this.state.petId} checked={this.state.addedEncryption} onChange={this.onAdditionalEncryption}>Additional Encryption</Checkbox>
                      <Button bsStyle="primary" disabled={!this.state.petId} onClick={()=>{this.onSubmit();}}>Submit New Result (costs {this.state.cost} Ether)</Button>
                      
                  </Col>
                    
              </Row>
              <div className='whiteSpace'></div>
              <Row>
                  {this.state.successSearch?
                  <Col xs={12} md={6}>
                      <Row>
                          <Col xsHidden sm={7}>
                              <b>TimeStamp</b>
                          </Col>
                          <Col xs={6} sm={2}>
                              <b>Attribute</b>
                          </Col>
                          <Col xs={6} sm={3}>
                              <b>Value</b>
                          </Col>
                      </Row>
                      {this.state.historicalData.map((val, index)=>{
                          return(
                              <TblRow key={index} timestamp={val.timestamp.toString()} attributeText={val.attributeText}  label={selection[val.attributeType]||"Unknown"} isEncrypted={val.isEncrypted}/>
                          );
                      })}

                  </Col>
                  :null}
              </Row>
          </Grid>
          
          }
          
          <div className='whiteSpace'></div>
          <div className='whiteSpace'></div>
          <div className='whiteSpace'></div>
          <div className='whiteSpace'></div>
          </div>
      );
  }
}

export default App;