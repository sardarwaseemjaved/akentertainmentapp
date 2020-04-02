import React, { Component } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  View,
  ImageBackground,
  ScrollView,
  Keyboard,
  StatusBar,
  Text,
  TextInput
} from 'react-native';
import { Container, Icon } from 'native-base'
import { showMessage } from 'react-native-flash-message';
import Button from './..//shared/Button';
// import TextInput from './../shared/TextInput';
import IconTitleSet from './../shared/IconTitleSet';
import validateForm from './../../helpers/validation';
import Wrapper, { AuthWrapper } from './Wrapper';
import { get } from 'lodash';
// import { Icon } from 'react-native-elements';
import firebase from './../../lib/firebase';
import { signInApp } from '../../auth';
import ThemeColors from './../../styles/colors'
import AppConstants from './../../helpers/constants'
import { getGravatarSrc } from './../../helpers';
import { getRandomColor } from '../../helpers/getRandomColor';
import DatePicker from 'react-native-datepicker'



export default class Register extends Component {
  static navigationOptions = {
    header: null,
  };
  state = {
    email: '',
    name: '',
    password: '',
    passwordConfirmation: '',
    isLoading: false,
  };

  runValidation = () => {
    const {
      name, email, password, passwordConfirmation,
    } = this.state;

    const fields = [
      {
        value: name,
        verify: [{
          type: 'isPopulated',
          message: 'Please enter your name',
        }],
      },
      {
        value: email,
        verify: [
          {
            type: 'isPopulated',
            message: 'Please enter your email address',
          },
          {
            type: 'isEmail',
            message: 'Please format your email address correctly',
          },
        ],
      },
      {
        value: password,
        verify: [
          {
            type: 'isPopulated',
            message: 'Please enter your password',
          },
          {
            type: 'isMatched',
            matchValue: passwordConfirmation,
            message: 'Password and Confirmation must match',
          },
          {
            type: 'isGreaterThanLength',
            length: 5,
            message: 'Password must be at least six characters',
          },
        ],
      },
      {
        value: passwordConfirmation,
        verify: [{
          type: 'isPopulated',
          message: 'Please confirm your password',
        }],
      },
    ];

    const errorMessage = validateForm(fields);
    if (errorMessage) {
      showMessage({
        message: 'Check your form',
        description: errorMessage,
        type: 'danger',
      });

      return false;
    }

    return true;
  }

  onSubmitRegistration = async () => {
    const { email, password } = this.state;

    const isFormValid = this.runValidation();
    if (!isFormValid) {
      return;
    }

    this.setState({ isLoading: true });
    var userColor = getRandomColor()
    firebase
      .auth()
      .createUserWithEmailAndPassword(email, password)
      .then(async ({ user }) => {
        // Add the new user to the users table
        firebase.database().ref()
          .child(`users/${user.uid}`)
          .update({
            email: this.state.email,
            // uid: user.uid,
            name: this.state.name,
            photoURL: getGravatarSrc(this.state.email),
            userColor
          });

        // Update the user's metadata on firebase
        user.updateProfile({
          displayName: this.state.name,
          photoURL: getGravatarSrc(this.state.email)
        });
        await this.setState({ isLoading: false });
        return this.props.navigation.navigate('MainMenu');
      })
      .catch((error) => {
        showMessage({
          message: 'Check your form',
          description: `${error.message} (${error.code})`,
          type: 'danger',
        });
        this.setState({ isLoading: false });
      });
  }
  render() {
    return (
      <Container>
        <AuthWrapper>
          <View style={{ width: '100%', paddingHorizontal: 30 }}>
            <Text style={styles.pageHeading}>REGISTER</Text>
          </View>
          <View style={[styles.textInputContainer]}>
            <Icon style={styles.icon} name='ios-person' />
            <TextInput
              style={styles.textinput}
              value={this.state.name}
              onChangeText={name => this.setState({ name })}
              placeholder="Name"
              blurOnSubmit={false}
              ref={(input) => { this.nameInput = input; }}
              onSubmitEditing={() => this.emailInput.focus()}
            />
          </View>

          <View style={[styles.textInputContainer]}>
            <Icon style={styles.icon} name='ios-mail' />
            <TextInput
              style={styles.textinput}
              value={this.state.email}
              blurOnSubmit={false}
              onChangeText={email => this.setState({ email })}
              ref={(input) => { this.emailInput = input; }}
              onSubmitEditing={() => this.passwordInput.focus()}
              keyboardType="email-address"
              placeholder="Email Address"
            />

          </View>
          <View style={[styles.textInputContainer]}>
            <Icon style={styles.icon} name='lock' />
            <TextInput
              style={styles.textinput}
              value={this.state.password}
              blurOnSubmit={false}
              onChangeText={password => this.setState({ password })}
              placeholder="Password"
              secureTextEntry
              ref={(input) => { this.passwordInput = input; }}
              onSubmitEditing={() => this.passwordConfirmationInput.focus()}
            />
          </View>
          <View style={[styles.textInputContainer]}>
            <Icon style={styles.icon} name='lock' />
            <TextInput
              style={styles.textinput}
              blurOnSubmit={false}
              value={this.state.passwordConfirmation}
              onChangeText={passwordConfirmation => this.setState({ passwordConfirmation })}
              placeholder="Confirm Password"
              secureTextEntry
              returnKeyType="go"
              ref={(input) => { this.passwordConfirmationInput = input; }}
              onSubmitEditing={() => { Keyboard.dismiss(); this.passwordConfirmationInput.blur() }}
            />
          </View>
          <View style={[styles.textInputContainer]}>
            <Icon type='MaterialCommunityIcons' style={styles.icon} name='calendar-heart' />
            <DatePicker
              style={styles.textinput}
              date={this.state.date}
              mode="date"
              placeholder="Date of Birth"
              format="YYYY-MM-DD"
              minDate="1950-01-01"
              maxDate={new Date()}
              androidMode='spinner'
              showIcon={false}
              confirmBtnText="Confirm"
              cancelBtnText="Cancel"
              customStyles={{
                datePicker: {
                  backgroundColor: ThemeColors.secondaryColorRgba + '0.4)'
                },
                dateInput: {
                  alignItems: 'flex-start',
                  borderWidth: 0
                }
              }}
              onDateChange={(date) => { this.setState({ date: date }) }}
            />
            {/* <TextInput
              style={styles.textinput}
              blurOnSubmit={false}
              value={this.state.passwordConfirmation}
              onChangeText={passwordConfirmation => this.setState({ passwordConfirmation })}
              placeholder="Date of Birth"
              secureTextEntry
              returnKeyType="go"
              ref={(input) => { this.dateOfBirthInput = input; }}
              onSubmitEditing={() => { Keyboard.dismiss(); this.dateOfBirthInput.blur() }}
            /> */}
          </View>

          <View style={styles.submitButtonContainer}>
            <Button style={styles.submitButton} onPress={this.onSubmitRegistration}>SUBMIT</Button>
          </View>

          <View style={styles.linksContainer}>
            <Button onPress={() => this.props.navigation.navigate('Login')} textStyle={styles.linksText} style={styles.links} >
              Login
               </Button>
            <Button onPress={() => this.props.navigation.navigate('ResetPassword')} textStyle={styles.linksText} style={styles.links}>
              Reset Password
              </Button>
          </View>

        </AuthWrapper>
      </Container>
    )
  }
}
const styles = StyleSheet.create({
  
  ImageBackgroundStyle: {
    flex: 1,
    width: AppConstants.screenWidth,
    height: AppConstants.screenHeight,
    alignItems: 'center',
  },
  emptyView: { height: 30 },
  header: {
    backgroundColor: ThemeColors.primaryColor,
    width: AppConstants.screenWidth - 30,
    height: AppConstants.screenHeight / 3,
    resizeMode: 'center',
    borderRadius: 60, overflow: 'hidden'
  },
  
  pageHeading:{ color: 'white', marginTop: 15, fontSize: 20, fontWeight: 'bold', textAlign:'center' },
  content: {
    // marginTop: 50,
    borderRadius: 60, overflow: 'hidden',
    backgroundColor: ThemeColors.secondaryColorRgba + '0.5)',
    alignItems: 'center',
    paddingBottom: 50
  },

  textInputContainer: {
    marginTop: 15,
    width: AppConstants.screenWidth - 60,
    height: 40,
    borderRadius: 60,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 15
  },
  textinput: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 5,
  },
  icon: {
    paddingHorizontal: 10,
    fontSize: 20,
    width: 30
  },
  submitButtonContainer: {
    marginTop: 15,
  },
  submitButton: {
    width: AppConstants.screenWidth - 60,
    borderRadius: 60,
    height: 40,
    padding: 0,
    justifyContent: 'center',
    backgroundColor: ThemeColors.secondaryColor
  },
  linksContainer: {
    marginTop: 15
  },
  links: {
    backgroundColor: 'transparent',
    padding: 5
  },
  linksText: {
    color: ThemeColors.primaryColor,
  }
})

// import React, { Component } from 'react';
// import {
//   StyleSheet,
//   KeyboardAvoidingView,
//   ScrollView,
// } from 'react-native';

// import { showMessage } from 'react-native-flash-message';
// import Button from './../shared/Button';
// import TextInput from './../shared/TextInput';
// import IconTitleSet from './../shared/IconTitleSet';
// import Wrapper from './Wrapper';

// import firebase from './../../lib/firebase';
// import validateForm from './../../helpers/validation';
// import { getGravatarSrc } from './../../helpers';
// import { getRandomColor } from '../../helpers/getRandomColor';


// export default class Register extends Component {
//   state = {
//     email: '',
//     name: '',
//     password: '',
//     passwordConfirmation: '',
//     isLoading: false,
//   };

//   runValidation = () => {
//     const {
//       name, email, password, passwordConfirmation,
//     } = this.state;

//     const fields = [
//       {
//         value: name,
//         verify: [{
//           type: 'isPopulated',
//           message: 'Please enter your name',
//         }],
//       },
//       {
//         value: email,
//         verify: [
//           {
//             type: 'isPopulated',
//             message: 'Please enter your email address',
//           },
//           {
//             type: 'isEmail',
//             message: 'Please format your email address correctly',
//           },
//         ],
//       },
//       {
//         value: password,
//         verify: [
//           {
//             type: 'isPopulated',
//             message: 'Please enter your password',
//           },
//           {
//             type: 'isMatched',
//             matchValue: passwordConfirmation,
//             message: 'Password and Confirmation must match',
//           },
//           {
//             type: 'isGreaterThanLength',
//             length: 5,
//             message: 'Password must be at least six characters',
//           },
//         ],
//       },
//       {
//         value: passwordConfirmation,
//         verify: [{
//           type: 'isPopulated',
//           message: 'Please confirm your password',
//         }],
//       },
//     ];

//     const errorMessage = validateForm(fields);
//     if (errorMessage) {
//       showMessage({
//         message: 'Check your form',
//         description: errorMessage,
//         type: 'danger',
//       });

//       return false;
//     }

//     return true;
//   }

//   onSubmitRegistration = () => {
//     const { email, password } = this.state;

//     const isFormValid = this.runValidation();
//     if (!isFormValid) {
//       return;
//     }

//     this.setState({ isLoading: true });
//     var userColor = getRandomColor()
//     firebase
//       .auth()
//       .createUserWithEmailAndPassword(email, password)
//       .then(({ user }) => {
//         // Add the new user to the users table
//         firebase.database().ref()
//           .child(`users/${user.uid}`)
//           .update({
//             email: this.state.email,
//             // uid: user.uid,
//             name: this.state.name,
//             photoURL: getGravatarSrc(this.state.email),
//             userColor 
//           });

//         // Update the user's metadata on firebase
//         user.updateProfile({
//           displayName: this.state.name,
//           photoURL: getGravatarSrc(this.state.email)
//         });
//         this.setState({ isLoading: false });
//         return this.props.navigation.navigate('MainMenu');
//       })
//       .catch((error) => {
//         showMessage({
//           message: 'Check your form',
//           description: `${error.message} (${error.code})`,
//           type: 'danger',
//         });
//         this.setState({ isLoading: false });
//       });
//   }

//   render() {
//     return (
//       <Wrapper isLoading={this.state.isLoading}>
//         <ScrollView behavior="padding" contentContainerStyle={styles.container}>
//           <IconTitleSet
//             iconName="user-circle-o"
//             iconType="font-awesome"
//             iconSize={100}
//             iconColor="#bdede3"
//             style={styles.iconTitleSet}
//           >
//             Join Chat-a-lot
//           </IconTitleSet>
//           <KeyboardAvoidingView style={styles.signupFormContainer}>
//             <TextInput
//               value={this.state.name}
//               onChangeText={name => this.setState({ name })}
//               placeholder="Name"
//               ref={(input) => { this.nameInput = input; }}
//               onSubmitEditing={() => this.emailInput.focus()}
//             />
//             <TextInput
//               value={this.state.email}
//               onChangeText={email => this.setState({ email })}
//               ref={(input) => { this.emailInput = input; }}
//               onSubmitEditing={() => this.passwordInput.focus()}
//               keyboardType="email-address"
//               placeholder="Email Address"
//             />
//             <TextInput
//               value={this.state.password}
//               onChangeText={password => this.setState({ password })}
//               placeholder="Password"
//               secureTextEntry
//               ref={(input) => { this.passwordInput = input; }}
//               onSubmitEditing={() => this.passwordInput.focus()}
//             />
//             <TextInput
//               value={this.state.passwordConfirmation}
//               onChangeText={passwordConfirmation => this.setState({ passwordConfirmation })}
//               placeholder="Confirm Password"
//               secureTextEntry
//               returnKeyType="go"
//               ref={(input) => { this.passwordConfirmationInput = input; }}
//             />
//           </KeyboardAvoidingView>
//           <Button onPress={this.onSubmitRegistration}>SIGN UP</Button>
//         </ScrollView>
//       </Wrapper>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//   },
//   iconTitleSet: {
//     marginBottom: 20,
//   },
// });
