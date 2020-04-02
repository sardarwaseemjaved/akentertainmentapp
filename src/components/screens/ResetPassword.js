import React, { Component } from 'react';
import {
  KeyboardAvoidingView,
  StyleSheet,
  View,
  ImageBackground,
  ScrollView,
  StatusBar,
  Text,
} from 'react-native';
import { Container, Icon } from 'native-base'
import { showMessage } from 'react-native-flash-message';
import Button from './..//shared/Button';
import TextInput from './../shared/TextInput';
import IconTitleSet from './../shared/IconTitleSet';
import validateForm from './../../helpers/validation';
import Wrapper, { AuthWrapper } from './Wrapper';
import { get } from 'lodash';
// import { Icon } from 'react-native-elements';
import firebase from './../../lib/firebase';
import { signInApp } from '../../auth';
import ThemeColors from './../../styles/colors'
import AppConstants from './../../helpers/constants'
import api from './../../api';
export default class Login extends Component {
  static navigationOptions = {
    header: null,
  };
  state = {
    email: '',
    isLoading: false,
  };

  runValidation = () => {
    const { email } = this.state;

    const fields = [
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

  sendPasswordResetEmail = () => {
    const { email } = this.state;

    const isFormValid = this.runValidation();
    if (!isFormValid) {
      return;
    }

    this.setState({ isLoading: true });

    api.sendPasswordResetEmail(email)
      .then(() => {
        this.setState({ isLoading: false });
        this.props.navigation.navigate('Login', {
          messageProps: {
            title: 'Your mail is on its way',
            body: 'Check your inbox for your reset email',
            type: 'warning',
          },
        });
      })
      .catch((error) => {
        showMessage({
          message: 'Check your form',
          description: `${error.message} (${error.code})`,
          type: 'danger',
        });
        this.setState({
          isLoading: false,
        });
      });
  }

  render() {
    return (
      <Container>
        <AuthWrapper>
          <View style={{ width: '100%', paddingHorizontal: 30 }}>
            <Text style={styles.pageHeading}>RESET PASSWORD</Text>
          </View>
          <View style={[styles.textInputContainer]}>
            <Icon style={styles.icon} name='ios-mail' />
            <TextInput
              style={styles.textinput}
              placeholder="Email Address"
              keyboardType="email-address"
              value={this.state.email}
              onChangeText={email => this.setState({ email })}
            />
          </View>

          <View style={styles.submitButtonContainer}>
            <Button style={styles.submitButton} onPress={this.sendPasswordResetEmail}>SUBMIT</Button>
          </View>

          <View style={styles.linksContainer}>
            <Button onPress={() => this.props.navigation.navigate('Login')} textStyle={styles.linksText} style={styles.links} >
              Login
                  </Button>
            <Button onPress={() => this.props.navigation.navigate('Register')} textStyle={styles.linksText} style={styles.links}>
              Register
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
//   View,
// } from 'react-native';
// import { showMessage } from 'react-native-flash-message';

// import Button from './../shared/Button';
// import TextInput from './../shared/TextInput';
// import IconTitleSet from './../shared/IconTitleSet';
// import Wrapper from './Wrapper';

// import api from './../../api';
// import validateForm from './../../helpers/validation';

// export default class ResetPassword extends Component {
//   state = {
//     email: '',
//     isLoading: false,
//   };

//   runValidation = () => {
//     const { email } = this.state;

//     const fields = [
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

//   sendPasswordResetEmail = () => {
//     const { email } = this.state;

//     const isFormValid = this.runValidation();
//     if (!isFormValid) {
//       return;
//     }

//     this.setState({ isLoading: true });

//     api.sendPasswordResetEmail(email)
//       .then(() => {
//         this.setState({ isLoading: false });
//         this.props.navigation.navigate('Login', {
//           messageProps: {
//             title: 'Your mail is on its way',
//             body: 'Check your inbox for your reset email',
//             type: 'warning',
//           },
//         });
//       })
//       .catch((error) => {
//         showMessage({
//           message: 'Check your form',
//           description: `${error.message} (${error.code})`,
//           type: 'danger',
//         });
//         this.setState({
//           isLoading: false,
//         });
//       });
//   }

//   render() {
//     return (
//       <Wrapper isLoading={this.state.isLoading}>
//         <View style={styles.container}>
//           <IconTitleSet
//             iconName="mail"
//             iconSize={100}
//             iconColor="#bdede3"
//             style={styles.iconTitleSet}
//           >
//             Send Reset Email
//           </IconTitleSet>
//           <TextInput
//             placeholder="Email Address"
//             keyboardType="email-address"
//             value={this.state.email}
//             onChangeText={email => this.setState({ email })}
//           />
//           <Button onPress={this.sendPasswordResetEmail}>RESET PASSWORD</Button>
//         </View>
//       </Wrapper>
//     );
//   }
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingTop: 80,
//   },
//   iconTitleSet: {
//     marginBottom: 20,
//   },
// });
