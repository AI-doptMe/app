import React, { Component } from 'react';
import {   
  ActivityIndicator,
  Button,
  Clipboard,
  Image,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  ScrollView,
  Linking
} from 'react-native';
import {
  createRouter,
  NavigationProvider,
  StackNavigation,
} from '@expo/ex-navigation';
import { Entypo } from '@expo/vector-icons';
import Exponent, {
  Constants,
  ImagePicker,
  registerRootComponent,
} from 'expo';

const Router = createRouter(() => ({
  home: () => HomeScreen,
  about: () => AboutScreen,
}));

const BASE_URL = 'http://877e7f1d.ngrok.io';

class HomeScreen extends React.Component {
  /**
    * This is where we can define any route configuration for this
    * screen. For example, in addition to the navigationBar title we
    * could add backgroundColor.
    */
  state = {
    image: null,
    uploading: false,
    zipcode: '',
    dogListings: []
  }
  static route = {
    navigationBar: {
      backgroundColor: 'rgba(0,0,0,0)',
      translucent: 'transparent',
      tintColor: '#fff',
      title: 'AiDoptMe',
    }
  }

  render() {
    let { image, zipcode, isListView } = this.state;
    return (
      <Image style={styles.container} source={{uri: 'http://i.imgur.com/rh6Xf70.jpg'}}>
        <View style={styles.logowrap}>
          <Image resizeModel={'cover'} style={{ width: 200, height: 142 }} source={{uri: 'http://i.imgur.com/wvMzxRB.png'}}></Image>
        </View>
        <View style={styles.contentwrap}>
          
          <View style={styles.inputwrap}>
            <Text style={{fontSize: 20, marginBottom: 16, color: 'rgba(255,255,255,1)', backgroundColor: 'rgba(0,0,0,0)'}}>
              First...
            </Text>
            <TextInput
              underlineColorAndroid="transparent"
              style={styles.zipInput}
              onChangeText={(text) => this.onZipChange(text)}
              value={zipcode}
              // keyboardType={'numeric'}
              placeholder={'Enter your ZipCode'}
            />
          </View>
          
          { zipcode.length == 5 && (<View style={styles.actionswrap}>
              <Text style={{fontSize: 20, marginBottom: 16, color: 'rgba(255,255,255,1)', backgroundColor: 'rgba(0,0,0,0)'}}>
                Then...
              </Text>
              
              <View style={{alignItems: 'center'}}>
                <TouchableOpacity
                  style={styles.shootButton}
                  onPress={this._pickImage}>
                  <Text style={{color: 'white', fontSize: 18}}>Choose a pooch from your device</Text>
                </TouchableOpacity>
                <Text style={{fontSize: 18, marginVertical: 8, color: 'rgba(255,255,255,1)', backgroundColor: 'rgba(0,0,0,0)'}}>or</Text>
                <TouchableOpacity
                  style={styles.pickButton}
                  onPress={this._takePhoto}>
                  <Text style={{color: 'white', fontSize: 18}}>Snap a picture of a doggo</Text>
                </TouchableOpacity>
                
              </View>
            </View>)
          }
        </View>
        <StatusBar barStyle="default" />
        { this._maybeRenderUploadingOverlay() }
      </Image>
    );
  }
  
  _maybeRenderUploadingOverlay = () => {
    if (this.state.uploading) {
      return (
        <View style={[StyleSheet.absoluteFill, {backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center'}]}>
          <ActivityIndicator
            color="#fff"
            animating
            size="large"
          />
        </View>
      );
    }
  }
  
  onZipChange(text) {
    this.setState({
      zipcode: text
    })
  }
  
  _goToAbout = () => {
    console.log('on route change', this.state.dogListings);
    this.props.navigator.push(Router.getRoute('about', {
      dogs: this.state.dogListings,
      image: this.state.image
    }));
  }
  
  _takePhoto = async () => {
    let pickerResult = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1,1]
    });

    this._handleImagePicked(pickerResult);
  }

  _pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1,1]
    });

    this._handleImagePicked(pickerResult);
  }

  _pickImage = async () => {
    let pickerResult = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1,1]
    });

    this._handleImagePicked(pickerResult);
  }

  _handleImagePicked = async (pickerResult) => {
    let uploadResponse, uploadResult;

    try {
      this.setState((prevState, props) => ({uploading: true}));

      if (!pickerResult.cancelled) {
        uploadResponse = await this.uploadImageAsync(pickerResult.uri, this.state.zipcode);
        uploadResult = await uploadResponse.json();
        console.log(uploadResult);
        console.log(BASE_URL + uploadResult.location);
        console.log("handlePick ", typeof(uploadResult.data));
        var newresults = JSON.parse(uploadResult.data);
        console.log("handlePick ", newresults);
        console.log("handlePick ",typeof(newresults));
        // console.log("sabina ", JSON.parse(newresults));
        
        this.setState((prevState, props) => ({
          image: BASE_URL + uploadResult.location,
          dogListings: newresults,
          uploading: false
        }));
        this._goToAbout()
        // this._goToAbout()
      }
    } catch(e) {
      console.log({uploadResponse});
      console.log({uploadResult});
      console.log({e});
      alert('Upload failed, sorry :(');
    } 
    finally {
      // this.setState((prevState, props) => ({uploading: false}));
      // this._goToAbout();
      
    }
  }
  
  uploadImageAsync = async (uri, zipcode) => {
    let apiUrl =  BASE_URL + '/imageUpload';
  
    // Note:
    // Uncomment this if you want to experiment with local server
    //
    // if (Constants.isDevice) {
    //   apiUrl = `https://your-ngrok-subdomain.ngrok.io/upload`;
    // } else {
    //   apiUrl = `http://localhost:3000/upload`
    // }
  
    let uriParts = uri.split('.');
    let fileType = uriParts[uriParts.length - 1];
  
    let formData = new FormData();
    
    formData.append('zipcode', zipcode);
    formData.append('photo', {
      uri,
      name: `photo.${fileType}`,
      type: `image/${fileType}`,
    });
  
    let options = {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'multipart/form-data',
      },
    };
  
    return fetch(apiUrl, options);
  }
}

class AboutScreen extends React.Component {
  static route = {
    navigationBar: {
      title: 'Similar Pups Waiting For You',
      backgroundColor: '#E01090',
      tintColor: '#fff',
    }
  }

  state = {
    dogListings: [],
    image: ''
  }

  onEmailTap(dogname, email) {
    const subject = encodeURIComponent("Info on " +dogname);
    const message = encodeURIComponent("I saw "+dogname+" on AiDoptMe, and would love more info.");
    Linking.openURL('mailto:'+email+'?subject='+subject+'&body='+message);
  }

  onPhoneTap(phone) {
    const cleaned_phone = phone;
    Linking.openURL('tel:'+cleaned_phone);
  }

  render() {
    const { image, dogs } = this.props.route.params;
    // if (dogs && dogs.length > 0) {
      dogs.map(dog => {
        console.log(dog)
        console.log(dog.name)
      })
    // }

    return (
      <View style={{alignItems: 'center', justifyContent: 'center', flex: 1}}>
        <ScrollView>
          {
            (dogs && dogs.length) > 0 ? dogs.map((dog, key) => {
              const imgurl = dog.imageURL;
              console.log(typeof(dog.breed));
              let breed = (typeof(dog.breed) === 'string') ?
                              dog.breed :
                              dog.breed.join(' and ');
              return (
                <View style={styles.dogPost} key={key}>
                  <Image style={{width: 340, height: 320}} source={{uri: imgurl}}></Image>
                    <Text style={styles.dogName}>{dog.name}</Text>
                    <Text style={{color: '#494949', fontSize: 15}}>{breed} in {dog.contactCity}</Text>
                    <TouchableOpacity onPress={() => this.onEmailTap(dog.name, dog.contactEmail)} style={{flexDirection: 'row', paddingVertical: 2}}>
                      <Entypo name="email" size={15} color="#000" />
                      <Text style={{marginLeft: 4, fontSize: 15, color: '#E01090'}}>{dog.contactEmail}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => this.onPhoneTap(dog.contactPhone)} style={{flexDirection: 'row', paddingVertical: 2}}>
                      <Entypo name="phone" size={15} color="#000" />
                      <Text style={{marginLeft: 4, fontSize: 15, color: '#E01090'}}>{dog.contactPhone}</Text>
                    </TouchableOpacity>
                </View>
              )
            }) : <Text>No doggies!</Text>
          }
        </ScrollView>
      </View>
    )
  }
  _goBackHome = () => {
    this.props.navigator.pop();
  }
}

export default class App extends Component {
  render() {
    return (
      <View style={styles.container}>
            <NavigationProvider router={Router}>
              <StackNavigation initialRoute={Router.getRoute('home')} />
            </NavigationProvider>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Constants.statusBarHeight,
    backgroundColor: '#ecf0f1',
  },
  imageContainer: {
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'space-between',
    width: null,
    height: null
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#34495e',
  },
  logowrap : {
    marginTop: 60,
    flex: 1,
    justifyContent: 'center'
  },
  contentwrap: {
    flex: 1,
    width: 320,
    marginBottom: 180
  },
  zipInput: {
    backgroundColor: '#ffffff',
    height: 50,
    fontSize: 18,
    padding: 12,
    borderWidth: 0,
    borderRadius: 4,
    marginBottom: 16
  },
  actionswrap: {
    marginBottom: 40
  },
  pickButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFB000',
    padding: 12,
    height: 50,
    borderRadius: 4,
    width: 320
  },
  shootButton: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E01090',
    padding: 12,
    height: 50,
    borderRadius: 4,
    width: 320
  },
  dogPost: {
    width: 340,
    paddingVertical: 20,
  },
  dogName: {
    marginTop: 10,
    fontSize: 22,
    fontWeight: 'bold'
  }
});